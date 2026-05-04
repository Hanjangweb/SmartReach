const express = require('express');
const User = require('../models/User');
const Lead = require('../models/Lead');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here are protected and admin only
router.use(protect);
router.use(authorize('admin'));

// @route GET /api/admin/stats
// Get global stats for the platform
router.get('/stats', async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalLeads = await Lead.countDocuments();
    const proUsers = await User.countDocuments({ plan: 'pro' });
    const advancedUsers = await User.countDocuments({ plan: 'advanced' });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalLeads,
        proUsers,
        advancedUsers,
        revenueEstimate: proUsers * 699 + advancedUsers * 1499,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/admin/users
// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort('-createdAt');
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/admin/users/:id/plan
// Manually update a user's plan
router.post('/users/:id/plan', async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'advanced'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
