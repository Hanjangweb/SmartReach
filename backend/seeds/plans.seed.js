// Seed Plans with Premium Features
// Run this in MongoDB or via API

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
    leadLimit: null, // unlimited
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
    leadLimit: null, // unlimited
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
    maxTeamMembers: null, // unlimited
    includePropertyCatalog: true,
    includeMarketingAutomation: true,
    maxEmailsCampaigns: null, // unlimited
    includeWhatsAppAPI: true,
    maxRemindersMonth: 0, // unlimited
    APIAccess: true,
  },
];

// How to seed:
// 1. In MongoDB shell or Compass:
// db.plans.insertMany(plansData)

// 2. Or via Node.js script:
// const Plan = require('./models/Plan');
// async function seedPlans() {
//   await Plan.deleteMany({});
//   await Plan.insertMany(plansData);
//   console.log('Plans seeded!');
// }

module.exports = plansData;
