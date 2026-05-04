const express = require('express');
const axios = require('axios');
const Lead = require('../models/Lead');
const User = require('../models/User');

const router = express.Router();

// Mock store for conversation history (in production, use Redis or MongoDB)
// Format: { "phone_number": [{ role: 'user', content: 'hi' }, ...] }
const chatHistoryStore = {};

// @route POST /api/webhooks/whatsapp
// @desc Handle incoming WhatsApp messages
router.post('/whatsapp', async (req, res, next) => {
  try {
    // In a real Meta Webhook, req.body has a specific structure
    // For stubbing, we accept { from: '9876543210', text: 'hi', agentEmail: 'admin@smartreach.com' }
    const { from, text, agentEmail } = req.body;
    
    if (!from || !text) return res.status(200).send('OK'); // Always return 200 to webhooks

    // Find agent by email or default admin
    let agent = await User.findOne({ email: agentEmail });
    if (!agent) agent = await User.findOne({ role: 'admin' });

    // Initialize history
    if (!chatHistoryStore[from]) {
      chatHistoryStore[from] = [];
    }
    chatHistoryStore[from].push({ role: 'user', content: text });

    // Call AI Chatbot
    const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/ai/chat`, {
      history: chatHistoryStore[from]
    });

    const aiReply = aiRes.data.reply;
    chatHistoryStore[from].push({ role: 'assistant', content: aiReply });

    // In production: Send aiReply back to the user via WhatsApp Cloud API
    console.log(`[WhatsApp Bot -> ${from}]: ${aiReply}`);

    // If AI extracted lead data, save it to DB
    if (aiRes.data.extracted_data) {
      const data = aiRes.data.extracted_data;
      
      let lead = await Lead.findOne({ phone: from, agent: agent._id });
      if (!lead) {
        await Lead.create({
          name: 'WhatsApp Lead',
          phone: from,
          propertyType: data.propertyType || 'Other',
          budget: data.budget || 0,
          location: data.location || '',
          requirement: data.requirement || '',
          source: 'WhatsApp Bot',
          status: 'New',
          agent: agent._id,
          conversationHistory: chatHistoryStore[from]
        });
      } else {
        // Update existing
        lead.propertyType = data.propertyType || lead.propertyType;
        lead.budget = data.budget || lead.budget;
        lead.location = data.location || lead.location;
        lead.requirement = data.requirement || lead.requirement;
        lead.conversationHistory = chatHistoryStore[from];
        await lead.save();
      }
      
      // Clear history since we converted them
      delete chatHistoryStore[from];
    }

    res.status(200).json({ success: true, reply: aiReply });
  } catch (err) {
    console.error('WhatsApp Webhook Error:', err);
    res.status(500).send('Error');
  }
});

// @route GET /api/webhooks/facebook
// @desc Handle Facebook Webhook Verification Challenge
router.get('/facebook', (req, res) => {
  const verifyToken = process.env.FB_VERIFY_TOKEN || 'smartreach_fb_secret';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// @route POST /api/webhooks/facebook
// @desc Handle incoming Facebook Lead Ads payloads
router.post('/facebook', async (req, res) => {
  try {
    const body = req.body;
    
    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadId = change.value.leadgen_id;
            const formId = change.value.form_id;
            
            // In a real app, you use the leadId and Graph API Access Token to fetch the lead details
            // const fbRes = await axios.get(`https://graph.facebook.com/v19.0/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`);
            // const leadData = fbRes.data.field_data;
            
            console.log(`[Facebook Webhook]: Received Lead ID ${leadId} from Form ${formId}`);
            
            // Stubbed Lead Creation
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
              await Lead.create({
                name: `Facebook Lead ${leadId.slice(0, 5)}`,
                phone: '1234567890',
                source: 'Facebook',
                status: 'New',
                agent: admin._id,
                notes: [`Automatically synced from FB Form: ${formId}`]
              });
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    res.sendStatus(404);
  } catch (err) {
    console.error('Facebook Webhook Error:', err);
    res.status(500).send('Error');
  }
});

module.exports = router;
