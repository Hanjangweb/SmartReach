const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartreach').then(async () => {
  const plans = await Plan.find();
  console.log(plans.map(p => ({ planId: p.planId, price: p.price, name: p.name })));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
