const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lead',
      required: true,
    },
    agent: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    saleValue: {
      type: Number,
      required: true,
      default: 0,
    },
    commissionRate: {
      type: Number, // Percentage (e.g., 2)
      required: true,
      default: 0,
    },
    agentSplit: {
      type: Number, // Percentage (e.g., 50)
      required: true,
      default: 0,
    },
    agencyRevenue: {
      type: Number, // Calculated value
      required: true,
      default: 0,
    },
    agentCommission: {
      type: Number, // Calculated value
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate revenue and commission
dealSchema.pre('save', function (next) {
  const totalCommission = this.saleValue * (this.commissionRate / 100);
  this.agentCommission = totalCommission * (this.agentSplit / 100);
  this.agencyRevenue = totalCommission - this.agentCommission;
  next();
});

module.exports = mongoose.model('Deal', dealSchema);
