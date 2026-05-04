const express = require('express');
const Property = require('../models/Property');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/properties
// Get all properties
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const filter = { isArchived: false };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('agent', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    res.json({
      success: true,
      properties,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/properties
// Create new property
router.post('/', protect, async (req, res, next) => {
  try {
    const property = await Property.create({
      ...req.body,
      agent: req.user._id,
    });
    res.status(201).json({ success: true, property });
  } catch (err) {
    next(err);
  }
});

// @route GET /api/properties/:id
// Get single property
router.get('/:id', protect, async (req, res, next) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, isArchived: false }).populate('agent', 'name email');
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    res.json({ success: true, property });
  } catch (err) {
    next(err);
  }
});

// @route PUT /api/properties/:id
// Update property
router.put('/:id', protect, async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Only creator or admin can update
    if (property.agent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this property' });
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json({ success: true, property });
  } catch (err) {
    next(err);
  }
});

// @route DELETE /api/properties/:id
// Delete (Archive) property
router.delete('/:id', protect, async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Only creator or admin can delete
    if (property.agent.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndUpdate(req.params.id, { isArchived: true });
    
    res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
