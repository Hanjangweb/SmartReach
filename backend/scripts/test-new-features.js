// Test script for newly added features
// Run: node backend/scripts/test-new-features.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';
let testLeadId = '';

const log = (title, message) => {
  console.log(`\n✅ ${title}: ${message}`);
};

const error = (title, err) => {
  console.error(`\n❌ ${title}:`, err.response?.data || err.message);
};

async function runTests() {
  console.log('🚀 Testing newly added features...\n');

  try {
    // 1. Create test user (or login if exists)
    console.log('📝 Step 1: Setting up test user...');
    const authRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'testuser@smartreach.dev',
      password: 'TestPass123!',
    }).catch(async (err) => {
      // If user exists, login
      if (err.response?.status === 400) {
        return axios.post(`${BASE_URL}/auth/login`, {
          email: 'testuser@smartreach.dev',
          password: 'TestPass123!',
        });
      }
      throw err;
    });

    authToken = authRes.data.token;
    testUserId = authRes.data.user._id;
    log('Auth', `User ID: ${testUserId}`);

    // 2. Create test leads
    console.log('\n📝 Step 2: Creating test leads...');
    const leadsToCreate = [
      {
        name: 'Rahul Verma',
        phone: '9876543210',
        email: 'rahul@example.com',
        propertyType: '2BHK',
        budget: 80,
        location: 'Noida Sector 62',
        source: '99acres',
        status: 'Contacted',
      },
      {
        name: 'Priya Sharma',
        phone: '9988776655',
        email: 'priya@example.com',
        propertyType: '3BHK',
        budget: 150,
        location: 'Gurgaon',
        source: 'Facebook',
        status: 'Closed',
      },
      {
        name: 'Amit Singh',
        phone: '9876543211',
        email: 'amit@example.com',
        propertyType: '1BHK',
        budget: 50,
        location: 'Delhi',
        source: 'Direct',
        status: 'New',
      },
    ];

    const leadIds = [];
    for (const leadData of leadsToCreate) {
      const leadRes = await axios.post(`${BASE_URL}/leads`, leadData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      leadIds.push(leadRes.data.lead._id);
      log('Lead Created', `${leadData.name} (ID: ${leadRes.data.lead._id})`);
    }
    testLeadId = leadIds[0];

    // 3. Test Analytics APIs
    console.log('\n\n📊 Step 3: Testing Analytics APIs...');

    try {
      const funnelRes = await axios.get(`${BASE_URL}/analytics/funnel`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Analytics - Funnel', `New: ${funnelRes.data.funnel.new}, Closed: ${funnelRes.data.funnel.closed}`);
    } catch (err) {
      error('Analytics - Funnel', err);
    }

    try {
      const sourceRes = await axios.get(`${BASE_URL}/analytics/source-roi`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Analytics - Source ROI', `Found ${sourceRes.data.sourceROI.length} sources`);
    } catch (err) {
      error('Analytics - Source ROI', err);
    }

    try {
      const responseRes = await axios.get(`${BASE_URL}/analytics/response-time`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Analytics - Response Time', `Avg: ${responseRes.data.responseTime.avgResponseTime}h`);
    } catch (err) {
      error('Analytics - Response Time', err);
    }

    try {
      const propRes = await axios.get(`${BASE_URL}/analytics/property-performance`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Analytics - Property Performance', `${propRes.data.byPropertyType.length} property types found`);
    } catch (err) {
      error('Analytics - Property Performance', err);
    }

    try {
      const hotRes = await axios.get(`${BASE_URL}/analytics/hot-leads`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Analytics - Hot Leads', `${hotRes.data.hotLeads.length} hot leads`);
    } catch (err) {
      error('Analytics - Hot Leads', err);
    }

    // 4. Test Reminders APIs
    console.log('\n\n⏰ Step 4: Testing Reminders APIs...');

    let reminderId = '';

    try {
      const reminderRes = await axios.post(`${BASE_URL}/reminders`, {
        leadId: testLeadId,
        message: 'Follow up with client',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: 'call',
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      reminderId = reminderRes.data.reminder._id;
      log('Reminder - Create', `Reminder created with ID: ${reminderId}`);
    } catch (err) {
      error('Reminder - Create', err);
    }

    try {
      const statsRes = await axios.get(`${BASE_URL}/reminders/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Reminder - Stats', `Pending: ${statsRes.data.stats.pending}, Overdue: ${statsRes.data.stats.overdue}`);
    } catch (err) {
      error('Reminder - Stats', err);
    }

    try {
      const listRes = await axios.get(`${BASE_URL}/reminders?status=pending`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Reminder - List', `Found ${listRes.data.reminders.length} pending reminders`);
    } catch (err) {
      error('Reminder - List', err);
    }

    // 5. Test Templates APIs
    console.log('\n\n📝 Step 5: Testing Templates APIs...');

    try {
      const templatesRes = await axios.get(`${BASE_URL}/templates`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Templates - List', `Found ${templatesRes.data.templates.length} templates`);
    } catch (err) {
      error('Templates - List', err);
    }

    try {
      const createRes = await axios.post(`${BASE_URL}/templates`, {
        name: 'Test Template',
        category: 'first-contact',
        content: 'Hi {{name}}, this is a test message',
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Templates - Create', `Template created with ID: ${createRes.data.template._id}`);
    } catch (err) {
      error('Templates - Create', err);
    }

    // 6. Test Plan Features
    console.log('\n\n💳 Step 6: Checking Plan Model...');

    try {
      const userRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log('Plan Model', `User plan: ${userRes.data.user.plan}`);
    } catch (err) {
      error('Plan Model', err);
    }

    console.log('\n\n✨ All tests completed! ✨\n');

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

// Run tests
runTests();
