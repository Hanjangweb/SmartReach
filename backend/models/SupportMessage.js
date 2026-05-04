const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isFromAdmin: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly fetch conversations for a specific user
supportMessageSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
