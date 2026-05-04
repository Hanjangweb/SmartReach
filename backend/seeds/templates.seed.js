// Seed System Templates
// These are pre-built templates available to all Pro/Premium users

const systemTemplates = [
  // First Contact
  {
    name: 'Initial Inquiry Response',
    category: 'first-contact',
    content: `Hi {{name}},

Thanks for reaching out! I'm {{agentName}}, and I'm excited to help you find your {{property}} in {{location}}.

I see you're looking for something in the {{budget}}L budget range. I have some great options that might be perfect for you.

Let's chat! Can we schedule a quick call tomorrow? I'll share a few premium properties I think you'll love.

Looking forward to connecting!
Cheers`,
    isSystem: true,
    isPremium: false,
  },
  {
    name: 'First Contact - Short & Direct',
    category: 'first-contact',
    content: `Hi {{name}}! 

Thanks for contacting us about {{property}} properties. I have some great matches for you in {{location}} within your {{budget}}L budget.

Can we connect this week? WhatsApp/call details: {{phone}}

Looking forward to it!`,
    isSystem: true,
    isPremium: false,
  },

  // Follow-up
  {
    name: 'Check-in After No Response',
    category: 'follow-up',
    content: `Hi {{name}},

Just following up on the {{property}} options I shared earlier. Did you get a chance to review them?

I have a few more premium properties that just came in {{location}} within your budget. 

Would love to show you around! Free this week?

Cheers,
{{agentName}}`,
    isSystem: true,
    isPremium: false,
  },
  {
    name: 'Daily Follow-up Message',
    category: 'follow-up',
    content: `{{name}}, just checking in! 

Any questions about the {{property}} I shared? I can arrange a viewing anytime that's convenient for you.

Let me know! 👍`,
    isSystem: true,
    isPremium: false,
  },

  // Site Visit
  {
    name: 'Site Visit Confirmation',
    category: 'site-visit',
    content: `Great! {{name}}, let's lock in your site visit.

Property: {{property}} in {{location}}
Expected Duration: 30-45 mins
What to bring: ID, checkbook (if serious)

See you soon! Call me if you're running late - {{phone}}

{{agentName}}`,
    isSystem: true,
    isPremium: false,
  },
  {
    name: 'Post-Visit Follow-up',
    category: 'site-visit',
    content: `{{name}}, thanks for visiting today! 

What did you think of the {{property}}? 

I have two more options for you that I think you might prefer. Can we catch up tomorrow?

Looking forward to finding you the perfect home!
{{agentName}}`,
    isSystem: true,
    isPremium: true,
  },

  // Negotiation
  {
    name: 'Price Negotiation Opener',
    category: 'negotiation',
    content: `{{name}},

I loved your enthusiasm about the {{property}}! 

The owner is flexible on pricing for serious buyers. What was your budget/expectation for this property?

Let's see if we can make this work! 💼

{{agentName}}`,
    isSystem: true,
    isPremium: true,
  },
  {
    name: 'Final Negotiation Push',
    category: 'negotiation',
    content: `{{name}},

Great news! The seller is willing to come down by {{discount}} for a quick closure.

This is the best offer I can get. Shall we move forward and start the paperwork?

{{agentName}}`,
    isSystem: true,
    isPremium: true,
  },

  // Closing
  {
    name: 'Deal Closed Celebration',
    category: 'close',
    content: `{{name}}, it's done! 🎉

Welcome to your new {{property}} in {{location}}! 

I'm thrilled we could make this happen. Here's the closing checklist:
✅ Registry update
✅ Key handover - {{date}}
✅ Society registration

See you at the handover! This is just the beginning of your journey here.

Congrats! 🔑
{{agentName}}`,
    isSystem: true,
    isPremium: true,
  },

  // Loss Recovery
  {
    name: 'Re-engagement After Losing Deal',
    category: 'loss-recovery',
    content: `{{name}},

I heard the other deal didn't work out. That's okay - happens to the best of us! 

I have some even better options for you now - better location, better price. Shall we reconnect?

Let's find you something you'll absolutely love this time.

{{agentName}}`,
    isSystem: true,
    isPremium: true,
  },
  {
    name: 'Come Back After 3 Months',
    category: 'loss-recovery',
    content: `{{name}},

It's been a while! Just wanted to check in - are you still looking for a {{property}} in {{location}}?

I have some amazing new inventory that just hit the market. Perfect matches for your {{budget}}L budget.

Coffee & property talk? ☕

{{agentName}}`,
    isSystem: true,
    isPremium: false,
  },
];

// How to seed:
// 1. In MongoDB shell:
// db.templates.insertMany(systemTemplates)

// 2. Or via Node.js:
// const Template = require('./models/Template');
// async function seedTemplates() {
//   await Template.insertMany(systemTemplates);
//   console.log('Templates seeded!');
// }

module.exports = systemTemplates;
