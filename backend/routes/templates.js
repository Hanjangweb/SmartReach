const express = require('express');
const Template = require('../models/Template');
const Plan = require('../models/Plan');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/templates
// Get available templates for user based on plan
router.get('/', protect, async (req, res, next) => {
  try {
    const { category } = req.query;
    const userPlan = await Plan.findOne({ planId: req.user.plan });

    // Get system templates included in all plans
    const filter = { isSystem: true };
    if (category) filter.category = category;

    let templates = await Template.find(filter).sort({ category: 1 });

    // For Pro/Advanced, include premium templates
    if (req.user.plan !== 'free' && userPlan?.includePremiumTemplates) {
      const premiumFilter = { isPremium: true };
      if (category) premiumFilter.category = category;
      const premiumTemplates = await Template.find(premiumFilter);
      templates = [...templates, ...premiumTemplates];
    }

    // Include user's custom templates
    const customFilter = { agent: req.user._id };
    if (category) customFilter.category = category;
    const customTemplates = await Template.find(customFilter);
    templates = [...templates, ...customTemplates];

    res.json({ success: true, templates });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/templates
// Create custom template
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, category, content } = req.body;

    if (!name || !category || !content) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, category, and content are required' });
    }

    const template = await Template.create({
      name,
      category,
      content,
      agent: req.user._id,
    });

    res.status(201).json({ success: true, template });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/templates/:id
// Update custom template
router.put('/:id', protect, async (req, res, next) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, agent: req.user._id },
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/templates/:id
// Delete custom template
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      agent: req.user._id,
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/templates/:id/track-usage
// Track template usage
router.put('/:id/track-usage', protect, async (req, res, next) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    res.json({ success: true, template });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
