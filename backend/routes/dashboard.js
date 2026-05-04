const express = require('express');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/dashboard/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const { agentId } = req.query;
    const matchQuery = { isArchived: false };
    if (req.user.role !== 'admin') {
      matchQuery.agent = req.user._id;
    } else if (agentId) {
      matchQuery.agent = agentId;
    }

    const [
      totalLeads,
      newLeads,
      contactedLeads,
      closedLeads,
      lostLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      sourceStats,
      recentLeads,
      monthlyStats,
    ] = await Promise.all([
      Lead.countDocuments({ ...matchQuery }),
      Lead.countDocuments({ ...matchQuery, status: 'New' }),
      Lead.countDocuments({ ...matchQuery, status: 'Contacted' }),
      Lead.countDocuments({ ...matchQuery, status: 'Closed' }),
      Lead.countDocuments({ ...matchQuery, status: 'Lost' }),
      Lead.countDocuments({ ...matchQuery, leadScore: 'Hot' }),
      Lead.countDocuments({ ...matchQuery, leadScore: 'Warm' }),
      Lead.countDocuments({ ...matchQuery, leadScore: 'Cold' }),

      // Source breakdown
      Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Recent 5 leads
      Lead.find(matchQuery).sort({ createdAt: -1 }).limit(5),

      // Monthly leads (last 6 months)
      Lead.aggregate([
        {
          $match: {
            ...matchQuery,
            createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        totalLeads,
        newLeads,
        contactedLeads,
        closedLeads,
        lostLeads,
        conversionRate: Number(conversionRate),
        leadScores: { hot: hotLeads, warm: warmLeads, cold: coldLeads },
        sourceStats: sourceStats.map((s) => ({ source: s._id, count: s.count })),
        recentLeads,
        monthlyStats: monthlyStats.map((m) => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          total: m.count,
          closed: m.closed,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
