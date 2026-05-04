const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const paypal = require('@paypal/checkout-server-sdk');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Plan = require('../models/Plan');

// Razorpay Client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

// PayPal Environment
let environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID || 'mock_client_id',
  process.env.PAYPAL_CLIENT_SECRET || 'mock_client_secret'
);
let client = new paypal.core.PayPalHttpClient(environment);



const router = express.Router();


// @route POST /api/payment/create-checkout-session
// Create Stripe Checkout Session
router.post('/create-checkout-session', protect, async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findOne({ planId });

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const session = await stripe.checkout.sessions.create({

      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price * 100, // Amount in paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString(),
        planId: planId,
      },
    });

    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        return res.json({ 
          success: true, 
          sessionId: 'mock_session', 
          url: `${process.env.FRONTEND_URL}/settings?session_id=mock_session&plan_id=${req.body.planId}`
        });
      }
      next(err);
    }
});


// @route POST /api/payment/verify-session
// Verify session after return from Stripe
router.post('/verify-session', protect, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    // Mock verification for development
    if (sessionId === 'mock_session' || (process.env.NODE_ENV === 'development' && sessionId.startsWith('cs_test'))) {
      const planId = req.body.planId || 'pro'; // Fallback if not in metadata
      await User.findByIdAndUpdate(req.user._id, { plan: planId });
      return res.json({ success: true, message: 'Mock Payment verified and plan updated' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);


    if (session.payment_status === 'paid') {
      const { userId, planId } = session.metadata;
      
      // Update user plan
      await User.findByIdAndUpdate(userId, { plan: planId });
      
      res.json({ success: true, message: 'Payment verified and plan updated' });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (err) {
    next(err);
  }
});

// @route POST /api/payment/paypal/create-order
router.post('/paypal/create-order', protect, async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findOne({ planId });
    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD', // PayPal often requires USD for sandbox tests unless configured
          value: (plan.price / 80).toFixed(2) // Rough INR to USD conversion for demo
        },
        description: plan.name,
        custom_id: `${req.user._id}:${planId}`
      }]
    });

    const order = await client.execute(request);
    res.json({ success: true, orderId: order.result.id });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/payment/paypal/capture-order
router.post('/paypal/capture-order', protect, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      const customId = capture.result.purchase_units[0].custom_id;
      const [userId, planId] = customId.split(':');
      
      await User.findByIdAndUpdate(userId, { plan: planId });
      res.json({ success: true, message: 'PayPal payment successful' });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (err) {
    next(err);
  }
});


// @route POST /api/payment/razorpay/create-order
router.post('/razorpay/create-order', protect, async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findOne({ planId });

    if (!plan) return res.status(400).json({ success: false, message: 'Invalid plan' });

    const options = {
      amount: plan.price * 100, // Amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}_${planId}`,
      notes: {
        userId: req.user._id.toString(),
        planId: planId
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error('RAZORPAY CREATE ORDER ERROR:', err);
    res.status(500).json({ success: false, message: err.message || 'Razorpay order creation failed' });
  }
});

// @route POST /api/payment/razorpay/verify
router.post('/razorpay/verify', protect, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment verified
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const { userId, planId } = order.notes;
      
      await User.findByIdAndUpdate(userId, { plan: planId });
      res.json({ success: true, message: 'Razorpay payment successful' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    console.error('RAZORPAY VERIFY ERROR:', err);
    res.status(500).json({ success: false, message: err.message || 'Razorpay verification failed' });
  }
});


// Webhook for Stripe (Production use)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, planId } = session.metadata;
    await User.findByIdAndUpdate(userId, { plan: planId });
  }

  res.json({ received: true });
});

module.exports = router;
