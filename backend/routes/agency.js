const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure user is a manager
const managerOnly = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only managers can access agency features' });
  }
  next();
};

// @route GET /api/agency/team
// @desc Get all agents in the manager's team
router.get('/team', protect, managerOnly, async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? { role: 'user' } : { managerId: req.user._id };
    const team = await User.find(query).select('-password');
    res.json({ success: true, team });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/agency/invite
// @desc Invite an agent to the team (Create user)
router.post('/invite', protect, managerOnly, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'user',
      managerId: req.user._id,
      agency: req.user.agency || `${req.user.name}'s Agency`,
      plan: req.user.plan // inherit manager's plan
    });

    user.password = undefined;
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/agency/team/:id
// @desc Remove agent from team
router.delete('/team/:id', protect, managerOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (user.managerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to remove this user' });
    }

    user.managerId = null;
    user.agency = '';
    await user.save();
    
    res.json({ success: true, message: 'User removed from agency' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
