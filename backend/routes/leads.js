const express = require('express');
const Lead = require('../models/Lead');
const Note = require('../models/Note');
const Plan = require('../models/Plan');
const Property = require('../models/Property');
const User = require('../models/User');
const Automation = require('../models/Automation');
const Reminder = require('../models/Reminder');
const axios = require('axios');
const { protect } = require('../middleware/auth');

// Helper to run rules-based automations
const runAutomations = async (lead, triggerEvent) => {
  try {
    const automations = await Automation.find({ agent: lead.agent, triggerEvent, isActive: true });
    if (!automations.length) return;

    for (const auto of automations) {
      let cumulativeDelay = 0; // in milliseconds
      
      for (const act of auto.actions) {
        if (act.type === 'Wait') {
          cumulativeDelay += act.delayValue * (act.delayUnit === 'Days' ? 86400000 : 3600000);
        } else {
          // Schedule a task/WA message
          await Reminder.create({
            userId: lead.agent,
            leadId: lead._id,
            message: `[Automation: ${auto.name}] ${act.type === 'SendWhatsApp' ? 'Send WA:' : 'Task:'} ${act.message}`,
            type: act.type === 'SendWhatsApp' ? 'whatsapp' : 'general',
            scheduledAt: new Date(Date.now() + cumulativeDelay),
            status: 'pending'
          });
        }
      }

      await Note.create({
        lead: lead._id,
        agent: lead.agent,
        content: `[System] Enrolled in Automation: ${auto.name}`,
        type: 'system'
      });
    }
  } catch (err) {
    console.error('Automation Engine Error:', err);
  }
};

const router = express.Router();

// @route GET /api/leads
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, source, leadScore, search, page = 1, limit = 20, agentId } = req.query;
    const filter = { isArchived: false };
    
    if (req.user.role === 'manager') {
      const team = await User.find({ managerId: req.user._id }).select('_id');
      const teamIds = team.map(u => u._id);
      teamIds.push(req.user._id); // include manager's own leads
      filter.agent = { $in: teamIds };
      if (agentId) filter.agent = agentId; // filter to specific agent if requested
    } else if (req.user.role !== 'admin') {
      filter.agent = req.user._id;
    } else if (agentId) {
      filter.agent = agentId;
    }

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (leadScore) filter.leadScore = leadScore;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { requirement: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      Lead.find(filter).populate('agent', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);

    res.json({
      success: true,
      leads,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/leads
router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      const plan = await Plan.findOne({ planId: req.user.plan });
      if (plan && plan.leadLimit !== null) {
        const leadCount = await Lead.countDocuments({ agent: req.user._id, isArchived: false });
        if (leadCount >= plan.leadLimit) {
          return res.status(403).json({
            success: false,
            message: `You have reached the lead limit for your ${plan.name} plan (${plan.leadLimit} leads). Please upgrade to add more.`,
          });
        }
      }
    }

    const lead = await Lead.create({ ...req.body, agent: req.user._id });
    
    // Trigger Automations
    runAutomations(lead, 'LeadCreated');

    res.status(201).json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});


// @route GET /api/leads/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOne(query).populate('notes').populate('agent', 'name email');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/leads/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const oldLead = await Lead.findOne(query);
    if (!oldLead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const lead = await Lead.findOneAndUpdate(
      query,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // Trigger automations based on changes
    if (oldLead.status !== 'Cold' && req.body.status === 'Cold') {
      runAutomations(lead, 'StatusChangedToCold');
    }
    if (oldLead.leadScore !== 'Hot' && req.body.leadScore === 'Hot') {
      runAutomations(lead, 'ScoreChangedToHot');
    }
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/leads/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOneAndUpdate(
      query,
      { isArchived: true },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead archived' });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/leads/:id/notes
router.get('/:id/notes', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const notes = await Note.find({ lead: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, notes });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/leads/:id/notes
router.post('/:id/notes', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOne(query);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const note = await Note.create({
      lead: req.params.id,
      agent: req.user._id,
      content: req.body.content,
      type: req.body.type || 'manual',
    });

    // Also update conversation history on lead
    if (req.body.addToHistory) {
      lead.conversationHistory.push({ role: 'agent', message: req.body.content });
      await lead.save();
    }

    res.status(201).json({ success: true, note });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/leads/:id/status
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const lead = await Lead.findOneAndUpdate(
      query,
      { status: req.body.status, lastContacted: new Date() },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/leads/:id/assign
// Admin only: Reassign a lead to a different agent
router.put('/:id/assign', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reassign leads' });
    }

    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ success: false, message: 'agentId is required' });
    }

    const lead = await Lead.findById(req.params.id).populate('agent', 'name');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const oldAgentName = lead.agent ? lead.agent.name : 'Unassigned';
    
    // Find new agent
    const User = require('../models/User');
    const newAgent = await User.findById(agentId);
    if (!newAgent) return res.status(404).json({ success: false, message: 'New agent not found' });

    lead.agent = agentId;
    await lead.save();

    // Create system note for audit log
    await Note.create({
      lead: lead._id,
      agent: req.user._id,
      content: `[System] Lead reassigned from ${oldAgentName} to ${newAgent.name} by Admin`,
      type: 'system',
    });

    res.json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/leads/:id/matches
// @desc Get AI property matches for a lead
router.get('/:id/matches', protect, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (lead.agent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.plan === 'free') {
      return res.status(403).json({ success: false, message: 'AI Property Matcher requires Advanced plan' });
    }

    // Fetch user's available properties
    const properties = await Property.find({ agent: req.user._id, status: 'Available', isArchived: false });
    
    if (!properties.length) {
      return res.json({ success: true, matches: [] });
    }

    const payload = {
      lead_budget: lead.budget || 0,
      lead_location: lead.location || '',
      lead_type: lead.propertyType || '',
      lead_requirement: lead.requirement || '',
      properties: properties.map(p => ({
        id: p._id.toString(),
        title: p.title,
        type: p.type,
        price: p.price,
        location: p.location,
        description: p.description
      }))
    };

    const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/ai/match`, payload);
    
    // Attach property details to the matches
    const matches = aiRes.data.matches.map(m => {
      const prop = properties.find(p => p._id.toString() === m.propertyId);
      return { ...m, property: prop };
    }).filter(m => m.property); // remove any matches where property wasn't found

    res.json({ success: true, matches });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
