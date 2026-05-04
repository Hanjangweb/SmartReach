const express = require('express');
const Deal = require('../models/Deal');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/deals
// Get deals
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.agent = req.user._id;
    }

    const deals = await Deal.find(filter)
      .populate('agent', 'name email')
      .populate('lead', 'name phone')
      .sort({ createdAt: -1 });

    // Calculate totals
    const totals = deals.reduce((acc, deal) => {
      acc.totalSales += deal.saleValue || 0;
      acc.totalAgencyRevenue += deal.agencyRevenue || 0;
      acc.totalAgentCommission += deal.agentCommission || 0;
      return acc;
    }, { totalSales: 0, totalAgencyRevenue: 0, totalAgentCommission: 0 });

    res.json({
      success: true,
      deals,
      totals
    });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/deals
// Create new deal
router.post('/', protect, async (req, res, next) => {
  try {
    const { lead: leadId } = req.body;
    
    // Check if deal already exists for this lead
    const existingDeal = await Deal.findOne({ lead: leadId });
    if (existingDeal) {
      return res.status(400).json({ success: false, message: 'A deal already exists for this lead' });
    }

    // Verify lead exists and user has access
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (req.user.role !== 'admin' && lead.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const deal = await Deal.create({
      ...req.body,
      agent: req.user._id,
    });

    res.status(201).json({ success: true, deal });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/deals/:id/status
// Update deal status (Admin only for Paid)
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.body.status === 'Paid') {
      return res.status(403).json({ success: false, message: 'Only admins can mark deals as paid' });
    }

    const deal = await Deal.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    res.json({ success: true, deal });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
