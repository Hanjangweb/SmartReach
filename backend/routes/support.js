const express = require('express');
const SupportMessage = require('../models/SupportMessage');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/support/messages
// Get current user's chat history
router.get('/messages', protect, async (req, res, next) => {
  try {
    const messages = await SupportMessage.find({ userId: req.user._id }).sort({ createdAt: 1 });
    
    // Mark messages from admin as read
    await SupportMessage.updateMany(
      { userId: req.user._id, isFromAdmin: true, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/support/messages
// Send a message to support
router.post('/messages', protect, async (req, res, next) => {
  try {
    if (req.user.plan === 'free') {
      return res.status(403).json({ success: false, message: 'Support chat is for Pro/Advanced users only.' });
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Message content is required' });

    const message = await SupportMessage.create({
      userId: req.user._id,
      content,
      isFromAdmin: false,
    });

    // Broadcast to admins via socket
    const io = req.app.get('io');
    if (io) {
      // Emit to a special 'admin_room' or broadcast with the message
      io.emit('new_support_message', { message, user: { _id: req.user._id, name: req.user.name, email: req.user.email } });
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/support/admin/conversations
// Admin only: Get all conversations
router.get('/admin/conversations', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });

    // Aggregate to get the latest message per user
    const conversations = await SupportMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          latestMessage: { $first: '$$ROOT' },
          unreadCount: { 
            $sum: { $cond: [{ $and: [{ $eq: ['$isFromAdmin', false] }, { $eq: ['$isRead', false] }] }, 1, 0] } 
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          'userInfo.name': 1,
          'userInfo.email': 1,
          'userInfo.plan': 1,
          latestMessage: 1,
          unreadCount: 1
        }
      },
      { $sort: { 'latestMessage.createdAt': -1 } }
    ]);

    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/support/admin/messages/:userId
// Admin only: Get chat history with a specific user
router.get('/admin/messages/:userId', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });

    const messages = await SupportMessage.find({ userId: req.params.userId }).sort({ createdAt: 1 });
    
    // Mark user messages as read by admin
    await SupportMessage.updateMany(
      { userId: req.params.userId, isFromAdmin: false, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/support/admin/messages/:userId
// Admin only: Reply to a user
router.post('/admin/messages/:userId', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });

    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Message content is required' });

    const message = await SupportMessage.create({
      userId: req.params.userId,
      content,
      isFromAdmin: true,
    });

    // Broadcast to the specific user via socket
    const io = req.app.get('io');
    if (io) {
      io.emit(`support_reply_${req.params.userId}`, { message });
    }

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
