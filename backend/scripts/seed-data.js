// Seed Plans and Templates to Database
// Run: node backend/scripts/seed-data.js

require('dotenv').config();
const mongoose = require('mongoose');

const Plan = require('../models/Plan');
const Template = require('../models/Template');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartreach';

const plansData = [
  {
    planId: 'free',
    name: 'Free',
    price: 0,
    leadLimit: 10,
    description: 'Perfect for getting started',
    features: [
      'Up to 10 leads',
      'Basic lead management',
      'Manual reminders',
      'Basic AI Extract (limited)',
      'Email support',
    ],
    color: '#94a3b8',
    popular: false,
    includeAnalytics: false,
    includeLeadScoring: false,
    includeAutomatedReminders: false,
    includePremiumTemplates: false,
    includeTeamCollaboration: false,
    maxTeamMembers: 0,
    includePropertyCatalog: false,
    includeMarketingAutomation: false,
    maxEmailsCampaigns: 0,
    includeWhatsAppAPI: false,
    maxRemindersMonth: 0,
    APIAccess: false,
  },
  {
    planId: 'pro',
    name: 'Pro',
    price: 299,
    leadLimit: 500,
    description: 'For growing agents and small teams',
    features: [
      'Up to 500 leads',
      'Advanced lead management',
      'Lead Analytics & Funnel Tracking',
      'AI-Powered Lead Scoring',
      'Automated Smart Reminders',
      'Professional Message Templates',
      'Response Time Analytics',
      'Hot Leads Dashboard',
      'Priority Support',
    ],
    color: '#3b82f6',
    popular: true,
    includeAnalytics: true,
    includeLeadScoring: true,
    includeAutomatedReminders: true,
    includePremiumTemplates: true,
    includeTeamCollaboration: false,
    maxTeamMembers: 0,
    includePropertyCatalog: false,
    includeMarketingAutomation: false,
    maxEmailsCampaigns: 0,
    includeWhatsAppAPI: false,
    maxRemindersMonth: 100,
    APIAccess: false,
  },
  {
    planId: 'premium',
    name: 'Premium',
    price: 699,
    leadLimit: null,
    description: 'For agencies and power users',
    features: [
      'Unlimited leads',
      'All Pro features',
      'Team Collaboration (up to 5 members)',
      'Advanced Lead Scoring',
      'Full Property Catalog Management',
      'Marketing Automation & Email Campaigns',
      'Deal Tracking & Commission Management',
      'Performance Leaderboards',
      'Custom Reports',
      'Dedicated Support',
    ],
    color: '#a855f7',
    popular: false,
    includeAnalytics: true,
    includeLeadScoring: true,
    includeAutomatedReminders: true,
    includePremiumTemplates: true,
    includeTeamCollaboration: true,
    maxTeamMembers: 5,
    includePropertyCatalog: true,
    includeMarketingAutomation: true,
    maxEmailsCampaigns: 5000,
    includeWhatsAppAPI: false,
    maxRemindersMonth: 500,
    APIAccess: true,
  },
  {
    planId: 'enterprise',
    name: 'Enterprise',
    price: 1999,
    leadLimit: null,
    description: 'For agencies and enterprises',
    features: [
      'Unlimited everything',
      'All Premium features',
      'Unlimited team members',
      'WhatsApp Business API Integration',
      'White Label Solution',
      'Custom Integrations',
      'Dedicated Account Manager',
      'Advanced API Access',
      'Real-time Reporting',
      '24/7 Priority Support',
    ],
    color: '#ec4899',
    popular: false,
    includeAnalytics: true,
    includeLeadScoring: true,
    includeAutomatedReminders: true,
    includePremiumTemplates: true,
    includeTeamCollaboration: true,
    maxTeamMembers: null,
    includePropertyCatalog: true,
    includeMarketingAutomation: true,
    maxEmailsCampaigns: null,
    includeWhatsAppAPI: true,
    maxRemindersMonth: 0,
    APIAccess: true,
  },
];

const systemTemplates = [
  {
    name: 'Initial Inquiry Response',
    category: 'first-contact',
    content: `Hi {{name}},

Thanks for reaching out! I'm excited to help you find your {{propertyType}} in {{location}}.

I see you're looking for something in the {{budget}}L budget range. I have some great options that might be perfect for you.

Let's chat! Can we schedule a quick call tomorrow?

Looking forward to connecting!`,
    isSystem: true,
    isPremium: false,
  },
  {
    name: 'First Contact - Short & Direct',
    category: 'first-contact',
    content: `Hi {{name}}! 

Thanks for contacting us about {{propertyType}} properties. I have some great matches for you in {{location}} within your {{budget}}L budget.

Can we connect this week?

Looking forward to it!`,
    isSystem: true,
    isPremium: false,
  },
  {
    name: 'Check-in After No Response',
    category: 'follow-up',
    content: `Hi {{name}},

Just following up on the {{propertyType}} options I shared earlier. Did you get a chance to review them?

I have a few more premium properties that just came in {{location}} within your budget. 

Would love to show you around! Free this week?`,
    isSystem: true,
    isPremium: false,
  },
  {
    name: 'Daily Follow-up Message',
    category: 'follow-up',
    content: `{{name}}, just checking in! 

Any questions about the {{propertyType}} I shared? I can arrange a viewing anytime that's convenient for you.

Let me know! 👍`,
    isSystem: true,
    isPremium: false,
  },
  {
    name: 'Site Visit Confirmation',
    category: 'site-visit',
    content: `Great! {{name}}, let's lock in your site visit.

Property: {{propertyType}} in {{location}}
Expected Duration: 30-45 mins
What to bring: ID, checkbook (if serious)

See you soon!`,
    isSystem: true,
    isPremium: false,
  },
  {
    name: 'Post-Visit Follow-up',
    category: 'site-visit',
    content: `{{name}}, thanks for visiting today! 

What did you think of the {{propertyType}}? 

I have two more options for you that I think you might prefer. Can we catch up tomorrow?

Looking forward to finding you the perfect home!`,
    isSystem: true,
    isPremium: true,
  },
  {
    name: 'Price Negotiation Opener',
    category: 'negotiation',
    content: `{{name}},

I loved your enthusiasm about the {{propertyType}}! 

The owner is flexible on pricing for serious buyers. What was your budget/expectation for this property?

Let's see if we can make this work! 💼`,
    isSystem: true,
    isPremium: true,
  },
  {
    name: 'Final Negotiation Push',
    category: 'negotiation',
    content: `{{name}},

Great news! The seller is willing to negotiate for a quick closure.

This is the best offer I can get. Shall we move forward and start the paperwork?`,
    isSystem: true,
    isPremium: true,
  },
  {
    name: 'Deal Closed Celebration',
    category: 'close',
    content: `{{name}}, it's done! 🎉

Welcome to your new {{propertyType}} in {{location}}! 

I'm thrilled we could make this happen. Here's the closing checklist:
✅ Registry update
✅ Key handover
✅ Society registration

Congrats! 🔑`,
    isSystem: true,
    isPremium: true,
  },
  {
    name: 'Come Back After Loss',
    category: 'loss-recovery',
    content: `{{name}},

I heard the other deal didn't work out. That's okay - happens to the best of us! 

I have some even better options for you now. Shall we reconnect?

Let's find you something you'll absolutely love this time.`,
    isSystem: true,
    isPremium: true,
  },
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing plans
    await Plan.deleteMany({});
    console.log('🗑️  Cleared existing plans');

    // Clear existing system templates
    await Template.deleteMany({ isSystem: true });
    console.log('🗑️  Cleared existing system templates');

    // Seed plans
    await Plan.insertMany(plansData);
    console.log('✅ Seeded 4 plans:', plansData.map((p) => p.name).join(', '));

    // Seed templates
    await Template.insertMany(systemTemplates);
    console.log('✅ Seeded 10 system templates');

    console.log('\n✨ Database seeding completed successfully! ✨\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedData();
