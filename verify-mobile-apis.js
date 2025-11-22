#!/usr/bin/env node

/**
 * Mobile API Verification Script
 * Tests all mobile endpoints to ensure they're working correctly
 */

const API_BASE_URL = 'http://localhost:5000/api/mobile';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

const endpoints = [
  { method: 'GET', path: '/dashboard/metrics', name: 'Dashboard Metrics' },
  { method: 'GET', path: '/dashboard/activity', name: 'Dashboard Activity' },
  { method: 'GET', path: '/jobs', name: 'Jobs List' },
  { method: 'GET', path: '/sites', name: 'Sites List' },
  { method: 'GET', path: '/safety/incidents', name: 'Safety Incidents' },
  { method: 'GET', path: '/workers', name: 'Workers List' },
];

async function testEndpoint(endpoint) {
  const url = `${API_BASE_URL}${endpoint.path}`;
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`   ${endpoint.method} ${url}`);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (TEST_TOKEN) {
      headers['Authorization'] = `Bearer ${TEST_TOKEN}`;
    }

    const response = await fetch(url, {
      method: endpoint.method,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      console.log(`   ✅ SUCCESS (${response.status})`);
      if (data && typeof data === 'object' && data.success !== undefined) {
        console.log(`   📊 Response: success=${data.success}, has data=${!!data.data}`);
      }
      return true;
    } else {
      console.log(`   ❌ FAILED (${response.status})`);
      console.log(`   Error:`, JSON.stringify(data, null, 2).substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Mobile API Verification');
  console.log('==========================');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Auth Token: ${TEST_TOKEN ? 'Provided' : 'Not provided (will test without auth)'}`);

  const results = [];

  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    results.push({ endpoint: endpoint.name, success });
  }

  console.log('\n\n📊 Summary');
  console.log('==========');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.endpoint}`);
  });

  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});



