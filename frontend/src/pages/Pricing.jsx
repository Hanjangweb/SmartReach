import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PayPalButtons } from '@paypal/react-paypal-js';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import './Pricing.css';

const ICONS = {
  free: Shield,
  pro: Zap,
  advanced: Crown,
};

export default function Pricing() {
  const [loading, setLoading] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [planToUpgrade, setPlanToUpgrade] = useState(null);
  const { user, fetchUser } = useAuthStore();

  useEffect(() => {
    api.get('/plans').then((res) => setPlans(res.data.plans)).catch(console.error);
  }, []);

  const handleUpgradeClick = (plan) => {
    setPlanToUpgrade(plan);
    setShowModal(true);
  };

  const handleRazorpayCheckout = async () => {
    setLoading(true);
    try {
      const { data: { order } } = await api.post('/payment/razorpay/create-order', { planId: planToUpgrade.planId });
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'SmartReach',
        description: `Upgrade to ${planToUpgrade.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payment/razorpay/verify', response);
            toast.success('Subscription upgraded successfully!');
            setShowModal(false);
            fetchUser();
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: { color: '#6366f1' },
        config: {
          display: {
            hide: [],
            sequence: ['upi', 'card', 'netbanking']
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-4"
        >
          Simple, Transparent Pricing
        </motion.h1>
        <p className="text-secondary max-w-2xl mx-auto">
          Choose the plan that's right for you. All plans include our core features with no hidden fees.
        </p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, index) => {
          const Icon = ICONS[plan.planId] || Zap;
          return (
          <motion.div
            key={plan.planId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`pricing-card ${plan.recommended ? 'recommended' : ''}`}
          >
            {plan.recommended && <div className="recommended-badge">Most Popular</div>}
            
            <div className="plan-icon-wrap" style={{ backgroundColor: `${plan.color}20`, color: plan.color }}>
              <Icon size={24} />
            </div>

            <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
            <div className="price-wrap">
              <span className="currency">₹</span>
              <span className="price">{plan.price}</span>
              <span className="period">/month</span>
            </div>
            <p className="plan-desc">{plan.description}</p>

            <ul className="feature-list">
              {plan.features.map((feature, i) => (
                <li key={i}>
                  <Check size={16} className="text-emerald" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {plan.planId !== 'free' && user?.plan !== plan.planId && (
              <button
                onClick={() => handleUpgradeClick(plan)}
                className={`subscribe-btn ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
              >
                Upgrade to {plan.name}
              </button>
            )}
            
            {user?.plan === plan.planId && (
              <div className="current-plan-badge">
                <Check size={14} /> Current Plan
              </div>
            )}
          </motion.div>
        )})}
      </div>

      {/* Checkout Modal */}
      {showModal && planToUpgrade && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div 
            className="checkout-modal glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Upgrade to {planToUpgrade.name}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="plan-summary mb-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="text-sm text-secondary">Monthly Subscription</p>
                    <p className="font-bold text-lg">{planToUpgrade.name} Plan</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo">₹{planToUpgrade.price}</p>
                </div>
              </div>

              <p className="text-sm text-secondary mb-4 font-semibold uppercase tracking-wider">Select Payment Method</p>
              
              <div className="flex flex-col gap-4">
                {/* Stripe Card/UPI */}
                <button 
                  className="payment-method-btn"
                  onClick={handleRazorpayCheckout}
                  disabled={loading}
                >
                  <div className="flex items-center gap-3">
                    <div className="payment-icon card-icon">🇮🇳</div>
                    <div className="text-left">
                      <p className="font-bold">UPI / Card / NetBanking</p>
                      <p className="text-xs text-muted">Powered by Razorpay</p>
                    </div>
                  </div>
                  {loading && <div className="spinner-xs" />}
                </button>

                <div className="payment-divider"><span>OR</span></div>

                {/* PayPal */}
                <div className="paypal-container">
                  <PayPalButtons
                    style={{ layout: 'horizontal', height: 50 }}
                    createOrder={async () => {
                      try {
                        const { data } = await api.post('/payment/paypal/create-order', { planId: planToUpgrade.planId });
                        return data.orderId;
                      } catch (err) {
                        toast.error('PayPal initiation failed');
                      }
                    }}
                    onApprove={async (data) => {
                      try {
                        await api.post('/payment/paypal/capture-order', { orderId: data.orderID });
                        toast.success('Subscription upgraded successfully!');
                        setShowModal(false);
                        fetchUser();
                      } catch (err) {
                        toast.error('PayPal verification failed');
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-muted mt-6 px-4">
              By completing this purchase, you agree to our Terms of Service and Privacy Policy. 
              Payments are secure and encrypted.
            </p>
          </motion.div>
        </div>
      )}

      <div className="mt-16 text-center">
        <p className="text-sm text-muted">
          Secure payment processing by <span className="font-bold">Stripe</span>. 
          Questions? <a href="#" className="text-indigo">Contact our support team</a>.
        </p>
      </div>
    </div>
  );
}
