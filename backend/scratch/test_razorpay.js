require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

razorpay.orders.create({
  amount: 100,
  currency: 'INR',
  receipt: 'test_receipt'
}).then(order => {
  console.log('SUCCESS:', order.id);
  process.exit(0);
}).catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
