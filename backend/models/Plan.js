const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true, // 'free', 'pro', 'advanced'
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    leadLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    popular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
