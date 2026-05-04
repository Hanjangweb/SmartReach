const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  triggerEvent: { 
    type: String, 
    enum: ['LeadCreated', 'StatusChangedToCold', 'ScoreChangedToHot'], 
    required: true 
  },
  isActive: { type: Boolean, default: true },
  actions: [{
    type: { type: String, enum: ['Wait', 'SendWhatsApp', 'CreateTask'], required: true },
    delayValue: { type: Number, default: 0 }, // If 'Wait', how many units
    delayUnit: { type: String, enum: ['Hours', 'Days'], default: 'Days' },
    message: { type: String } // Content for WA or Task
  }],
}, { timestamps: true });

module.exports = mongoose.model('Automation', automationSchema);
