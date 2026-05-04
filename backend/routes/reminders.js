const express = require('express');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/reminders
router.get('/', protect, async (req, res, next) => {
  try {
    const { upcoming, agentId } = req.query;
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.agent = req.user._id;
    } else if (agentId) {
      filter.agent = agentId;
    }
    if (upcoming === 'true') {
      filter.scheduledAt = { $gte: new Date() };
      filter.sent = false;
    }
    const reminders = await Reminder.find(filter)
      .populate('lead', 'name phone propertyType status')
      .sort({ scheduledAt: 1 });
    res.json({ success: true, reminders });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/reminders
router.post('/', protect, async (req, res, next) => {
  try {
    const reminder = await Reminder.create({ ...req.body, agent: req.user._id });
    const populated = await reminder.populate('lead', 'name phone propertyType status');
    res.status(201).json({ success: true, reminder: populated });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/reminders/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const reminder = await Reminder.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    ).populate('lead', 'name phone propertyType status');
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/reminders/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    await Reminder.findOneAndDelete(query);
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/reminders/:id/done
router.put('/:id/done', protect, async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.agent = req.user._id;
    const reminder = await Reminder.findOneAndUpdate(
      query,
      { sent: true },
      { new: true }
    ).populate('lead', 'name phone');
    res.json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
