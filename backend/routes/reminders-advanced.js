const express = require('express');
const Reminder = require('../models/Reminder');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/reminders
// Get all reminders for the user
router.get('/', protect, async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = { agent: req.user._id };

    if (status === 'pending') {
      filter.sent = false;
      filter.scheduledAt = { $gte: new Date() };
    } else if (status === 'completed') {
      filter.sent = true;
    } else if (status === 'overdue') {
      filter.sent = false;
      filter.scheduledAt = { $lt: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [reminders, total] = await Promise.all([
      Reminder.find(filter)
        .populate('lead', 'name phone email propertyType location budget')
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Reminder.countDocuments(filter),
    ]);

    res.json({
      success: true,
      reminders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/reminders
// Create a new reminder
router.post('/', protect, async (req, res, next) => {
  try {
    const { leadId, message, scheduledAt, type = 'general' } = req.body;

    // Verify lead ownership
    const lead = await Lead.findOne({ _id: leadId, agent: req.user._id });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const reminder = await Reminder.create({
      lead: leadId,
      agent: req.user._id,
      message,
      scheduledAt,
      type,
    });

    res.status(201).json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/reminders/:id
// Update reminder
router.put('/:id', protect, async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, agent: req.user._id },
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('lead');

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    res.json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/reminders/:id
// Delete reminder
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      agent: req.user._id,
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/reminders/:id/mark-done
// Mark reminder as sent
router.put('/:id/mark-done', protect, async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, agent: req.user._id },
      { sent: true },
      { new: true }
    ).populate('lead');

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    res.json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/reminders/stats
// Get reminder statistics
router.get('/stats', protect, async (req, res, next) => {
  try {
    const [pending, completed, overdue] = await Promise.all([
      Reminder.countDocuments({
        agent: req.user._id,
        sent: false,
        scheduledAt: { $gte: new Date() },
      }),
      Reminder.countDocuments({
        agent: req.user._id,
        sent: true,
      }),
      Reminder.countDocuments({
        agent: req.user._id,
        sent: false,
        scheduledAt: { $lt: new Date() },
      }),
    ]);

    res.json({
      success: true,
      stats: { pending, completed, overdue },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
