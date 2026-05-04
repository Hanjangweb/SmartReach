const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    sent: { type: Boolean, default: false },
    type: { type: String, enum: ['call', 'whatsapp', 'visit', 'email', 'general'], default: 'general' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
