const express = require('express');
const Lead = require('../models/Lead');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// @route POST /api/voice/call/:leadId
// @desc Trigger an outbound AI Voice Call
router.post('/call/:leadId', protect, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (req.user.plan !== 'advanced' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'AI Voice Calling requires the Advanced plan.' });
    }

    // In a real application, you would integrate with Twilio or Vapi.ai here.
    // Example Vapi.ai payload:
    /*
    await axios.post('https://api.vapi.ai/call', {
      phoneNumber: { twilioPhoneNumber: "+1234567890", customerPhoneNumber: lead.phone },
      assistant: {
        model: { provider: "openai", model: "gpt-3.5-turbo", messages: [{role: "system", content: "You are a real estate agent..."}] },
        voice: { provider: "11labs", voiceId: "pNInz6obpgDQGcFmaJgB" }
      }
    }, { headers: { Authorization: `Bearer ${process.env.VAPI_KEY}` }});
    */

    console.log(`[Voice API Stub] Initiating AI Call to ${lead.name} at ${lead.phone}`);

    // Log the call attempt in the CRM
    await Note.create({
      lead: lead._id,
      agent: req.user._id,
      content: `[System] Triggered AI Voice Assistant to call the lead. Awaiting transcript...`,
      type: 'call'
    });

    // Simulate webhook response after 5 seconds
    setTimeout(async () => {
      try {
        await Note.create({
          lead: lead._id,
          agent: req.user._id,
          content: `[AI Voice Transcript]\nAI: Hi ${lead.name}, are you still looking for a ${lead.propertyType} in ${lead.location}?\nLead: Yes, but my budget dropped to ${lead.budget - 5} Lakhs.\nAI: Noted. I will have an agent follow up with properties in that range.`,
          type: 'ai'
        });
      } catch (err) {
        console.error('Stub Webhook error', err);
      }
    }, 5000);

    res.json({ success: true, message: 'AI Call initiated successfully.' });
  } catch (err) {
    next(err);
  }
});

// Webhook to receive the call transcript once Vapi/Twilio call ends
// (Normally this would be unprotected and verify a webhook signature)
router.post('/webhook', async (req, res) => {
  try {
    // const { callId, transcript, summary, leadId } = req.body;
    // await Note.create({ lead: leadId, content: `[Call Summary] ${summary}\n\nTranscript: ${transcript}`, type: 'ai' });
    res.status(200).send('OK');
  } catch (err) {
    console.error('Voice Webhook Error', err);
    res.status(500).send('Error');
  }
});

module.exports = router;
