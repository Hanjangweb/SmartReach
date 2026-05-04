const express = require('express');
const Lead = require('../models/Lead');
const { protectApiKey } = require('../middleware/apiKeyAuth');

const router = express.Router();

// Apply API Key protection to all /api/v1 routes
router.use(protectApiKey);

// @route POST /api/v1/leads
// @desc Create a new lead via API
router.post('/leads', async (req, res, next) => {
  try {
    const { name, phone, email, propertyType, budget, location, requirement, source } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const lead = await Lead.create({
      user: req.user._id,
      name,
      phone,
      email,
      propertyType,
      budget,
      location,
      requirement,
      source: source || 'API Integration',
      status: 'New',
    });

    res.status(201).json({ success: true, lead });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/v1/leads
// @desc Get leads via API
router.get('/leads', async (req, res, next) => {
  try {
    const leads = await Lead.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
