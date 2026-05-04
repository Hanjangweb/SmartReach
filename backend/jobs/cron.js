const cron = require('node-cron');
const Lead = require('../models/Lead');
const Reminder = require('../models/Reminder');
const Note = require('../models/Note');
const axios = require('axios');

// Initialize Cron Jobs
const initCronJobs = () => {
  console.log('🤖 Initializing Automation Cron Jobs...');

  // 1. Cold Lead Revival (Runs every day at 10:00 AM)
  cron.schedule('0 10 * * *', async () => {
    console.log('🔄 Running Cold Lead Revival Job...');
    try {
      // Find leads that are 'New' or 'Cold' and haven't been updated in 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const coldLeads = await Lead.find({
        status: { $in: ['New', 'Contacted'] },
        leadScore: { $in: ['Cold', 'Warm'] },
        updatedAt: { $lt: thirtyDaysAgo },
        isArchived: false
      }).populate('agent');

      let revivedCount = 0;

      for (const lead of coldLeads) {
        // Double check if a recent reminder exists for this lead
        const recentReminder = await Reminder.findOne({ 
          leadId: lead._id, 
          status: 'pending' 
        });

        if (!recentReminder) {
          // Generate AI re-engagement message
          // Normally we'd call AI service, but for cron reliability we use a strong template
          const aiMessage = `Hi ${lead.name.split(' ')[0]}, I noticed you were looking for a ${lead.propertyType} in ${lead.location} a while ago. Are you still in the market? Prices have shifted recently and I have some new options for you.`;
          
          // Create a task for the agent
          await Reminder.create({
            userId: lead.agent._id,
            leadId: lead._id,
            message: `[AI Revive] Re-engage this cold lead. Suggested WA: "${aiMessage}"`,
            type: 'whatsapp',
            scheduledAt: new Date(Date.now() + 60 * 60 * 1000), // Schedule for 1 hour from now
            status: 'pending'
          });

          // Log it
          await Note.create({
            lead: lead._id,
            agent: lead.agent._id,
            content: `[System] Lead was inactive for 30+ days. Automatically generated an AI re-engagement reminder.`,
            type: 'system'
          });

          revivedCount++;
        }
      }

      console.log(`✅ Cold Lead Revival complete. Generated ${revivedCount} reminders.`);
    } catch (error) {
      console.error('❌ Error in Cold Lead Revival Job:', error);
    }
  });

  // 2. Post-Site-Visit Feedback (Runs every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running Post-Site-Visit Feedback Job...');
    try {
      // Find leads whose site visit was scheduled but passed 2+ hours ago, and status isn't Completed/Cancelled
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const completedVisits = await Lead.find({
        siteVisitStatus: 'Scheduled',
        siteVisitDate: { $lt: twoHoursAgo },
        isArchived: false
      }).populate('agent');

      let feedbackCount = 0;

      for (const lead of completedVisits) {
        // Mark as completed
        lead.siteVisitStatus = 'Completed';
        await lead.save();

        const feedbackMessage = `Hi ${lead.name.split(' ')[0]}, thanks for visiting the property today! On a scale of 1 to 5 (5 being perfect), how would you rate your experience?`;
        
        await Reminder.create({
          userId: lead.agent._id,
          leadId: lead._id,
          message: `[Auto-Feedback] Site visit completed. Send feedback survey: "${feedbackMessage}"`,
          type: 'whatsapp',
          scheduledAt: new Date(), // Immediate
          status: 'pending'
        });

        await Note.create({
          lead: lead._id,
          agent: lead.agent._id,
          content: `[System Automation] Marked site visit as Completed. Triggered automated feedback reminder.`,
          type: 'system'
        });

        feedbackCount++;
      }

      console.log(`✅ Site Visit Feedback complete. Triggered ${feedbackCount} requests.`);
    } catch (error) {
      console.error('❌ Error in Feedback Job:', error);
    }
  });

  // Future phases will add more cron jobs here...
};

module.exports = initCronJobs;
