const express = require('express');
const Property = require('../models/Property');
const Lead = require('../models/Lead');

const router = express.Router();

// @route GET /api/public/properties/:id
// @desc Get property details for public landing page
router.get('/properties/:id', async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate('agent', 'name email phone avatar agency');
    if (!property || property.isArchived || property.status !== 'Available') {
      return res.status(404).json({ success: false, message: 'Property not found or unavailable' });
    }
    
    // We only send safe public data
    res.json({
      success: true,
      property: {
        _id: property._id,
        title: property.title,
        type: property.type,
        price: property.price,
        location: property.location,
        description: property.description,
        images: property.images,
        agent: {
          _id: property.agent._id,
          name: property.agent.name,
          phone: property.agent.phone,
          agency: property.agent.agency,
          avatar: property.agent.avatar
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/public/leads
// @desc Submit a lead from a public landing page
router.post('/leads', async (req, res, next) => {
  try {
    const { name, phone, email, requirement, propertyId, agentId } = req.body;
    
    if (!name || !phone || !agentId) {
      return res.status(400).json({ success: false, message: 'Name, phone, and agentId are required' });
    }

    const lead = await Lead.create({
      name,
      phone,
      email: email || '',
      requirement: requirement || '',
      propertyType: 'Other',
      budget: 0,
      source: 'Landing Page',
      status: 'New',
      agent: agentId,
      notes: propertyId ? [`Submitted interest in property ID: ${propertyId}`] : []
    });

    res.status(201).json({ success: true, message: 'Lead submitted successfully' });
  } catch (err) {
    next(err);
  }
});

// @route POST /api/public/book/:leadId
// @desc Public route for leads to schedule a site visit
router.post('/book/:leadId', async (req, res, next) => {
  try {
    const { date, time } = req.body;
    
    if (!date || !time) {
      return res.status(400).json({ success: false, message: 'Date and time are required' });
    }

    const lead = await Lead.findById(req.params.leadId).populate('agent', 'name');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Parse date and time into a single Date object
    const scheduleDate = new Date(`${date}T${time}`);

    lead.siteVisitDate = scheduleDate;
    lead.siteVisitStatus = 'Scheduled';
    lead.status = 'SiteVisit';
    await lead.save();

    // In a real app, send a confirmation email or WhatsApp here
    res.json({ success: true, message: 'Site visit scheduled successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
