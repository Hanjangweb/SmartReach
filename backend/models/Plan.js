const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true, // 'free', 'pro', 'premium', 'enterprise'
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
    // New fields for advanced features
    includeAnalytics: { type: Boolean, default: false },
    includeLeadScoring: { type: Boolean, default: false },
    includeAutomatedReminders: { type: Boolean, default: false },
    includePremiumTemplates: { type: Boolean, default: false },
    includeTeamCollaboration: { type: Boolean, default: false },
    maxTeamMembers: { type: Number, default: 0 },
    includePropertyCatalog: { type: Boolean, default: false },
    includeMarketingAutomation: { type: Boolean, default: false },
    maxEmailsCampaigns: { type: Number, default: 0 }, // per month
    includeWhatsAppAPI: { type: Boolean, default: false },
    maxRemindersMonth: { type: Number, default: 0 }, // 0 = unlimited
    APIAccess: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Plan', planSchema);
