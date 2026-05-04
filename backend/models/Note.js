const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: ['manual', 'ai', 'call', 'visit'], default: 'manual' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
