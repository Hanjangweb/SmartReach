const express = require('express');
const Lead = require('../models/Lead');
const axios = require('axios');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/analytics/funnel
// Conversion funnel: New → Contacted → Site Visit → Deal
router.get('/funnel', protect, async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false };
    if (req.user.role !== 'admin') {
      matchQuery.agent = req.user._id;
    }

    const funnel = await Lead.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          new: [{ $match: { status: 'New' } }, { $count: 'count' }],
          contacted: [{ $match: { status: 'Contacted' } }, { $count: 'count' }],
          siteVisit: [{ $match: { status: 'SiteVisit' } }, { $count: 'count' }],
          negotiation: [{ $match: { status: 'Negotiation' } }, { $count: 'count' }],
          closed: [{ $match: { status: 'Closed' } }, { $count: 'count' }],
          lost: [{ $match: { status: 'Lost' } }, { $count: 'count' }],
        },
      },
    ]);

    const extract = (arr) => (arr[0]?.count || 0);
    const funnelData = {
      new: extract(funnel[0].new),
      contacted: extract(funnel[0].contacted),
      siteVisit: extract(funnel[0].siteVisit),
      negotiation: extract(funnel[0].negotiation),
      closed: extract(funnel[0].closed),
      lost: extract(funnel[0].lost),
    };

    const total = Object.values(funnelData).reduce((a, b) => a + b, 0);
    const conversionRate =
      total > 0 ? ((funnelData.closed / funnelData.new) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      funnel: funnelData,
      conversionRate: Number(conversionRate),
    });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/analytics/source-roi
// Lead source ROI analysis
router.get('/source-roi', protect, async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false };
    if (req.user.role !== 'admin') {
      matchQuery.agent = req.user._id;
    }

    const sourceROI = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$source',
          totalLeads: { $sum: 1 },
          contactedLeads: {
            $sum: { $cond: [{ $ne: ['$status', 'New'] }, 1, 0] },
          },
          closedDeals: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
          totalBudget: { $sum: '$budget' },
          avgBudget: { $avg: '$budget' },
          hotLeads: { $sum: { $cond: [{ $eq: ['$leadScore', 'Hot'] }, 1, 0] } },
        },
      },
      {
        $project: {
          source: '$_id',
          _id: 0,
          totalLeads: 1,
          contactedLeads: 1,
          closedDeals: 1,
          contactRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$contactedLeads', '$totalLeads'] },
                  100,
                ],
              },
              1,
            ],
          },
          conversionRate: {
            $round: [
              {
                $multiply: [{ $divide: ['$closedDeals', '$totalLeads'] }, 100],
              },
              1,
            ],
          },
          totalBudget: 1,
          avgBudget: { $round: ['$avgBudget', 2] },
          hotLeads: 1,
        },
      },
      { $sort: { closedDeals: -1 } },
    ]);

    res.json({ success: true, sourceROI });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/analytics/response-time
// Response time analytics
router.get('/response-time', protect, async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false, lastContacted: { $ne: null } };
    if (req.user.role !== 'admin') {
      matchQuery.agent = req.user._id;
    }

    const analytics = await Lead.aggregate([
      { $match: matchQuery },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$lastContacted', '$createdAt'] },
              1000 * 60 * 60, // Convert to hours
            ],
          },
          status: 1,
          leadScore: 1,
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          totalLeadsWithResponse: { $sum: 1 },
          hotLeadAvgTime: {
            $avg: {
              $cond: [{ $eq: ['$leadScore', 'Hot'] }, '$responseTime', null],
            },
          },
          coldLeadAvgTime: {
            $avg: {
              $cond: [{ $eq: ['$leadScore', 'Cold'] }, '$responseTime', null],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          avgResponseTime: { $round: ['$avgResponseTime', 1] },
          minResponseTime: { $round: ['$minResponseTime', 1] },
          maxResponseTime: { $round: ['$maxResponseTime', 1] },
          totalLeadsWithResponse: 1,
          hotLeadAvgTime: { $round: ['$hotLeadAvgTime', 1] },
          coldLeadAvgTime: { $round: ['$coldLeadAvgTime', 1] },
        },
      },
    ]);

    res.json({
      success: true,
      responseTime: analytics[0] || {
        avgResponseTime: 0,
        totalLeadsWithResponse: 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/analytics/property-performance
// Deal close rate by property type/location
router.get('/property-performance', protect, async (req, res, next) => {
  try {
    const matchQuery = { isArchived: false };
    if (req.user.role !== 'admin') {
      matchQuery.agent = req.user._id;
    }

    const byPropertyType = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$propertyType',
          total: { $sum: 1 },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
          avgBudget: { $avg: '$budget' },
        },
      },
      {
        $project: {
          propertyType: '$_id',
          _id: 0,
          total: 1,
          closed: 1,
          closeRate: {
            $round: [{ $multiply: [{ $divide: ['$closed', '$total'] }, 100] }, 1],
          },
          avgBudget: { $round: ['$avgBudget', 2] },
        },
      },
      { $sort: { closed: -1 } },
    ]);

    const byLocation = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$location',
          total: { $sum: 1 },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
          avgBudget: { $avg: '$budget' },
        },
      },
      {
        $project: {
          location: '$_id',
          _id: 0,
          total: 1,
          closed: 1,
          closeRate: {
            $round: [{ $multiply: [{ $divide: ['$closed', '$total'] }, 100] }, 1],
          },
          avgBudget: { $round: ['$avgBudget', 2] },
        },
      },
      { $sort: { closed: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      byPropertyType,
      byLocation,
    });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/analytics/hot-leads
// Hot leads for immediate follow-up
router.get('/hot-leads', protect, async (req, res, next) => {
  try {
    const filter = { leadScore: 'Hot', status: { $ne: 'Closed' }, isArchived: false };
    if (req.user.role !== 'admin') {
      filter.agent = req.user._id;
    }

    const hotLeads = await Lead.find(filter)
      .populate('agent', 'name email phone')
      .sort({ scorePercentage: -1, createdAt: -1 })
      .limit(20);

    res.json({ success: true, hotLeads });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/analytics/forecast
// AI Predictive Revenue Forecasting
router.get('/forecast', protect, async (req, res, next) => {
  try {
    const filter = { status: { $nin: ['Closed', 'Lost'] }, isArchived: false };
    if (req.user.role !== 'admin') {
      filter.agent = req.user._id;
    }

    const leads = await Lead.find(filter).select('name budget leadScore status');

    let totalExpectedRevenue = 0;
    let hotExpected = 0;
    let warmExpected = 0;
    const commissionRate = 0.02; // Assuming 2% average commission

    leads.forEach(lead => {
      let probability = 0.05; // Base probability for Unscored
      if (lead.leadScore === 'Hot') probability = 0.80;
      else if (lead.leadScore === 'Warm') probability = 0.40;
      else if (lead.leadScore === 'Cold') probability = 0.10;

      // Budget is in Lakhs, so let's keep revenue in Lakhs
      const expected = (lead.budget || 0) * commissionRate * probability;
      totalExpectedRevenue += expected;

      if (lead.leadScore === 'Hot') hotExpected += expected;
      if (lead.leadScore === 'Warm') warmExpected += expected;
    });

    res.json({
      success: true,
      forecast: {
        totalExpectedRevenueLakhs: totalExpectedRevenue.toFixed(2),
        hotExpectedLakhs: hotExpected.toFixed(2),
        warmExpectedLakhs: warmExpected.toFixed(2),
        activeLeadsCount: leads.length
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/analytics/forecast/insight
// Proxy to AI service for forecast insight
router.post('/forecast/insight', protect, async (req, res, next) => {
  try {
    if (req.user.plan === 'free') {
      return res.json({ success: true, insight: "Upgrade to Advanced Plan to unlock AI Financial Forecasting!" });
    }

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000'}/insight/forecast`, req.body);
    res.json({ success: true, insight: aiResponse.data.insight });
  } catch (err) {
    console.error('AI Forecast Proxy Error:', err.message);
    res.json({ success: true, insight: "AI is currently analyzing the market. Check back later." });
  }
});

module.exports = router;
