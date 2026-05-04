const express = require('express');
const Automation = require('../models/Automation');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/automations
router.get('/', protect, async (req, res, next) => {
  try {
    const automations = await Automation.find({ agent: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, automations });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/automations
router.post('/', protect, async (req, res, next) => {
  try {
    if (req.user.plan === 'free') {
      return res.status(403).json({ success: false, message: 'Automations require Pro or Advanced plan.' });
    }

    const automation = await Automation.create({
      ...req.body,
      agent: req.user._id
    });
    res.status(201).json({ success: true, automation });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/automations/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    let automation = await Automation.findById(req.params.id);
    if (!automation || automation.agent.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Automation not found' });
    }

    automation = await Automation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, automation });
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/automations/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const automation = await Automation.findOneAndDelete({ _id: req.params.id, agent: req.user._id });
    if (!automation) {
      return res.status(404).json({ success: false, message: 'Automation not found' });
    }
    res.json({ success: true, message: 'Automation deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
