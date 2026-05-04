const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['first-contact', 'follow-up', 'site-visit', 'negotiation', 'close', 'loss-recovery'],
      required: true,
    },
    content: { type: String, required: true },
    isSystem: { type: Boolean, default: false }, // System templates (included in plans)
    isPremium: { type: Boolean, default: false }, // Premium template pack
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Custom templates for agent
    usageCount: { type: Number, default: 0 },
    averageResponse: { type: Number, default: 0 }, // % response rate
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);
