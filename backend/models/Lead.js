const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: [true, 'Lead name is required'], trim: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    email: { type: String, lowercase: true, trim: true, default: '' },

    // Property Details
    propertyType: {
      type: String,
      enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Plot', 'Commercial', 'Other'],
      default: 'Other',
    },
    budget: { type: Number, default: 0 }, // in lakhs
    location: { type: String, trim: true, default: '' },
    requirement: { type: String, trim: true, default: '' }, // free text

    // Lead Meta
    source: {
      type: String,
      enum: ['Facebook', '99acres', 'MagicBricks', 'Housing', 'Referral', 'Instagram', 'Direct', 'Other'],
      default: 'Direct',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Negotiation', 'SiteVisit', 'Closed', 'Lost'],
      default: 'New',
    },
    leadScore: {
      type: String,
      enum: ['Hot', 'Warm', 'Cold', 'Unscored'],
      default: 'Unscored',
    },
    scorePercentage: { type: Number, default: 0, min: 0, max: 100 },

    // Follow up
    followUpDate: { type: Date, default: null },
    lastContacted: { type: Date, default: null },

    // AI Memory
    conversationHistory: [
      {
        role: { type: String, enum: ['agent', 'client', 'ai'] },
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    tags: [{ type: String }],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: notes count
leadSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'lead',
});

// Indexes
leadSchema.index({ agent: 1, status: 1 });
leadSchema.index({ agent: 1, createdAt: -1 });
leadSchema.index({ phone: 1 });

module.exports = mongoose.model('Lead', leadSchema);
