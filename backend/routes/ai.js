const express = require('express');
const axios = require('axios');
const Lead = require('../models/Lead');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const handleAIError = (err, res, next) => {
  if (err.response && err.response.status === 500) {
    return res.status(500).json({
      success: false,
      message: err.response.data?.detail || 'AI Service Internal Error'
    });
  }
  
  if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || (err.response && [502, 503, 504].includes(err.response.status))) {
    return res.status(503).json({ 
      success: false, 
      message: 'AI Service is warming up (Free Tier). Please wait 45-60 seconds and try again!' 
    });
  }
  next(err);
};

// Middleware to check if user has a Pro plan for AI features
const checkPlan = (req, res, next) => {
  if (req.user.plan === 'free') {
    return res.status(403).json({
      success: false,
      message: 'This feature is only available on the Pro plan. Please upgrade to continue.',
    });
  }
  next();
};

// @route POST /api/ai/reply
// Generate a context-aware AI reply for a lead
router.post('/reply', protect, checkPlan, async (req, res, next) => {
  try {
    const { leadId, customPrompt } = req.body;

    const query = { _id: leadId };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOne(query);

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const payload = {
      lead: {
        name: lead.name,
        propertyType: lead.propertyType,
        budget: lead.budget,
        location: lead.location,
        requirement: lead.requirement,
        status: lead.status,
        conversationHistory: lead.conversationHistory.slice(-6), // last 6 messages
      },
      agentName: req.user.name,
      customPrompt: customPrompt || '',
    };

    const response = await axios.post(`${AI_SERVICE_URL}/ai/reply`, payload, { timeout: 100000 });

    // Save the AI reply as a note
    await Note.create({
      lead: leadId,
      agent: req.user._id,
      content: `[AI Reply] ${response.data.reply}`,
      type: 'ai',
    });

    // Add to conversation history
    lead.conversationHistory.push({ role: 'ai', message: response.data.reply });
    await lead.save();

    // Notify via Socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.user._id}`).emit('ai_complete', {
        type: 'Reply',
        leadName: lead.name,
        leadId: lead._id,
      });
    }

    res.json({ success: true, reply: response.data.reply });
  } catch (err) {
    handleAIError(err, res, next);
  }
});

// @route POST /api/ai/extract
// Extract lead info from pasted WhatsApp/Instagram DM text
router.post('/extract', protect, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

    const response = await axios.post(`${AI_SERVICE_URL}/ai/extract`, { text }, { timeout: 100000 });

    res.json({ success: true, extracted: response.data.extracted });
  } catch (err) {
    handleAIError(err, res, next);
  }
});

// @route POST /api/ai/score
// Score a lead as Hot / Warm / Cold
router.post('/score', protect, checkPlan, async (req, res, next) => {
  try {
    const { leadId } = req.body;

    const query = { _id: leadId };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOne(query);

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const payload = {
      lead: {
        propertyType: lead.propertyType,
        budget: lead.budget,
        location: lead.location,
        status: lead.status,
        followUpDate: lead.followUpDate,
        lastContacted: lead.lastContacted,
        conversationCount: lead.conversationHistory.length,
        createdAt: lead.createdAt,
      },
    };

    const response = await axios.post(`${AI_SERVICE_URL}/ai/score`, payload, { timeout: 100000 });

    // Update lead score
    lead.leadScore = response.data.score;
    lead.scorePercentage = response.data.percentage;
    await lead.save();

    res.json({ success: true, score: response.data.score, percentage: response.data.percentage, reason: response.data.reason });
  } catch (err) {
    handleAIError(err, res, next);
  }
});

// @route POST /api/ai/suggest-followup
// AI suggests a follow-up message based on lead status
router.post('/suggest-followup', protect, checkPlan, async (req, res, next) => {
  try {
    const { leadId } = req.body;
    const query = { _id: leadId };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOne(query);

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const payload = {
      lead: {
        name: lead.name,
        propertyType: lead.propertyType,
        budget: lead.budget,
        location: lead.location,
        status: lead.status,
        lastContacted: lead.lastContacted,
      },
      agentName: req.user.name,
    };

    const response = await axios.post(`${AI_SERVICE_URL}/ai/suggest-followup`, payload, { timeout: 100000 });
    res.json({ success: true, suggestion: response.data.suggestion });
  } catch (err) {
    handleAIError(err, res, next);
  }
});

// @route POST /api/ai/generate-template
// AI generates a message template
router.post('/generate-template', protect, checkPlan, async (req, res, next) => {
  try {
    const { name, category } = req.body;
    
    const payload = {
      name,
      category,
      agentName: req.user.name,
    };

    const response = await axios.post(`${AI_SERVICE_URL}/ai/generate-template`, payload, { timeout: 100000 });
    res.json({ success: true, content: response.data.content });
  } catch (err) {
    handleAIError(err, res, next);
  }
});

// @route POST /api/ai/insight
// Generate actionable AI insights for a lead
router.post('/insight', protect, checkPlan, async (req, res, next) => {
  try {
    const { leadId } = req.body;
    
    const query = { _id: leadId };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOne(query);

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Fetch recent notes for context
    const notes = await Note.find({ lead: leadId })
      .sort({ createdAt: -1 })
      .limit(5);

    const payload = {
      lead: {
        name: lead.name,
        propertyType: lead.propertyType,
        budget: lead.budget,
        location: lead.location,
        requirement: lead.requirement,
        status: lead.status,
        leadScore: lead.leadScore,
        scorePercentage: lead.scorePercentage,
        notes: notes.map(n => n.content),
      }
    };

    const response = await axios.post(`${AI_SERVICE_URL}/ai/insight`, payload, { timeout: 100000 });
    res.json({ success: true, insight: response.data.insight });
  } catch (err) {
    handleAIError(err, res, next);
  }
});

module.exports = router;
