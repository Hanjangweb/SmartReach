const express = require('express');
const Plan = require('../models/Plan');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper to seed default plans if the collection is empty
const seedPlansIfEmpty = async () => {
  try {
    const count = await Plan.countDocuments();
    if (count === 0) {
      const defaultPlans = [
        { planId: 'free', name: 'Starter', price: 0, leadLimit: 50, description: 'Perfect for exploring the platform', features: ['Up to 50 leads', 'Basic AI extraction', 'Manual reminders', 'Property Catalog', 'Email support'], color: '#94a3b8' },
        { planId: 'pro', name: 'Professional', price: 1, leadLimit: 500, description: 'Best for growing businesses', features: ['Up to 500 leads', 'Advanced AI extraction', 'WhatsApp Templates', 'Premium Support Chat', 'AI Strategic Insights'], color: '#6366f1', popular: true },
        { planId: 'advanced', name: 'Advanced', price: 2, leadLimit: null, description: 'For power users and agencies', features: ['Unlimited leads', 'Bulk AI extraction', 'Team Leaderboards', 'Commission & Deal Tracking', 'API access'], color: '#f59e0b' },
      ];
      await Plan.insertMany(defaultPlans);
      console.log('Seeded default plans');
    }
  } catch (err) {
    console.error('Error seeding plans:', err);
  }
};

// @route GET /api/plans
// Get all plans (Public)
router.get('/', async (req, res, next) => {
  try {
    await seedPlansIfEmpty(); // Ensure they exist before fetching
    const plans = await Plan.find().sort({ price: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/plans/:id
// Update a plan (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
