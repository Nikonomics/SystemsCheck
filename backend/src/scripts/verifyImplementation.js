/**
 * Implementation Verification Script
 * Tests critical implementations before user testing
 */

const http = require('http');
const sequelize = require('../config/database');
const { User, Facility, UserFacility } = require('../models');

const API_BASE = 'http://localhost:3002';
const results = [];

// Helper to make HTTP requests
function makeRequest(method, path, token = null, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test result logging
function logResult(category, test, passed, details = '') {
  results.push({ category, test, passed, details });
  const status = passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  [${status}] ${test}${details ? ` - ${details}` : ''}`);
}

// ===========================================
// 1. DATABASE SCHEMA CHECKS
// ===========================================
async function testDatabaseSchema() {
  console.log('\n\x1b[36m=== 1. Database Schema Checks ===\x1b[0m');

  try {
    // Check if onboarding_completed column exists
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'onboarding_completed'
    `);

    const columnExists = columns.length > 0;
    logResult('Schema', 'onboarding_completed column exists', columnExists);

    if (columnExists) {
      const col = columns[0];
      const hasCorrectType = col.data_type === 'boolean';
      logResult('Schema', 'onboarding_completed is BOOLEAN type', hasCorrectType, col.data_type);

      const hasCorrectDefault = col.column_default === 'false';
      logResult('Schema', 'onboarding_completed defaults to false', hasCorrectDefault, col.column_default);
    }
  } catch (error) {
    logResult('Schema', 'Database schema check', false, error.message);
  }
}

// ===========================================
// 2. ROLE FILTERING LOGIC (Unit Tests)
// ===========================================
function testRoleFilteringLogic() {
  console.log('\n\x1b[36m=== 2. Role Filtering Logic ===\x1b[0m');

  // Recreate the hasMinRole logic from Sidebar.jsx
  const ROLE_HIERARCHY = [
    'clinical_resource',
    'facility_leader',
    'team_leader',
    'company_leader',
    'corporate',
    'admin'
  ];

  const hasMinRole = (userRole, minRole) => {
    const userIndex = ROLE_HIERARCHY.indexOf(userRole);
    const minIndex = ROLE_HIERARCHY.indexOf(minRole);
    return userIndex >= 0 && minIndex >= 0 && userIndex >= minIndex;
  };

  // Test cases
  const testCases = [
    { user: 'clinical_resource', min: 'clinical_resource', expected: true },
    { user: 'clinical_resource', min: 'team_leader', expected: false },
    { user: 'clinical_resource', min: 'facility_leader', expected: false },
    { user: 'facility_leader', min: 'clinical_resource', expected: true },
    { user: 'facility_leader', min: 'facility_leader', expected: true },
    { user: 'facility_leader', min: 'team_leader', expected: false },
    { user: 'team_leader', min: 'clinical_resource', expected: true },
    { user: 'team_leader', min: 'team_leader', expected: true },
    { user: 'admin', min: 'clinical_resource', expected: true },
    { user: 'admin', min: 'admin', expected: true },
    { user: 'corporate', min: 'team_leader', expected: true },
  ];

  testCases.forEach(tc => {
    const result = hasMinRole(tc.user, tc.min);
    logResult(
      'RoleLogic',
      `hasMinRole('${tc.user}', '${tc.min}')`,
      result === tc.expected,
      `expected ${tc.expected}, got ${result}`
    );
  });
}

// ===========================================
// 3. BACKEND ACCESS CONTROL TESTS
// ===========================================
async function testAccessControl() {
  console.log('\n\x1b[36m=== 3. Backend Access Control Tests ===\x1b[0m');

  // First, login as admin to get a token
  let adminToken = null;
  let clinicalToken = null;
  let testFacilityId = null;
  let unassignedFacilityId = null;

  try {
    // Login as admin
    const adminLogin = await makeRequest('POST', '/api/auth/login', null, {
      email: 'admin@cascadia.com',
      password: 'password123'
    });

    if (adminLogin.status === 200 && adminLogin.data.token) {
      adminToken = adminLogin.data.token;
      logResult('AccessControl', 'Admin login', true);
    } else {
      logResult('AccessControl', 'Admin login', false, `Status: ${adminLogin.status}`);
      return; // Can't continue without admin token
    }

    // Check if clinical user exists, create one if needed
    let clinicalUser = await User.findOne({ where: { email: 'clinical.test@cascadia.com' } });

    if (!clinicalUser) {
      console.log('  Creating test clinical_resource user...');
      clinicalUser = await User.create({
        email: 'clinical.test@cascadia.com',
        passwordHash: 'password123', // Will be hashed by hook
        firstName: 'Test',
        lastName: 'Clinical',
        role: 'clinical_resource',
        isActive: true,
        onboardingCompleted: false
      });
    }

    // Login as clinical_resource
    const clinicalLogin = await makeRequest('POST', '/api/auth/login', null, {
      email: 'clinical.test@cascadia.com',
      password: 'password123'
    });

    if (clinicalLogin.status === 200 && clinicalLogin.data.token) {
      clinicalToken = clinicalLogin.data.token;
      logResult('AccessControl', 'Clinical resource login', true);
    } else {
      logResult('AccessControl', 'Clinical resource login', false, `Status: ${clinicalLogin.status}`);
    }

    // Get facilities
    const facilities = await Facility.findAll({ limit: 2 });
    if (facilities.length < 2) {
      logResult('AccessControl', 'Need at least 2 facilities for testing', false);
      return;
    }

    testFacilityId = facilities[0].id;
    unassignedFacilityId = facilities[1].id;

    // Ensure clinical user is assigned to first facility only
    await UserFacility.destroy({ where: { userId: clinicalUser.id } });
    await UserFacility.create({ userId: clinicalUser.id, facilityId: testFacilityId });
    console.log(`  Assigned clinical user to facility ${testFacilityId}, not to ${unassignedFacilityId}`);

    // Test: Admin can access any facility
    const adminAccess1 = await makeRequest('GET', `/api/facilities/${testFacilityId}/scorecards`, adminToken);
    logResult('AccessControl', 'Admin can access facility scorecards', adminAccess1.status === 200, `Status: ${adminAccess1.status}`);

    const adminAccess2 = await makeRequest('GET', `/api/facilities/${testFacilityId}/trend`, adminToken);
    logResult('AccessControl', 'Admin can access facility trend', adminAccess2.status === 200, `Status: ${adminAccess2.status}`);

    // Test: Clinical resource CAN access assigned facility
    const clinicalAccess1 = await makeRequest('GET', `/api/facilities/${testFacilityId}/scorecards`, clinicalToken);
    logResult('AccessControl', 'Clinical can access ASSIGNED facility scorecards', clinicalAccess1.status === 200, `Status: ${clinicalAccess1.status}`);

    const clinicalAccess2 = await makeRequest('GET', `/api/facilities/${testFacilityId}/trend`, clinicalToken);
    logResult('AccessControl', 'Clinical can access ASSIGNED facility trend', clinicalAccess2.status === 200, `Status: ${clinicalAccess2.status}`);

    // Test: Clinical resource CANNOT access unassigned facility
    const clinicalDeny1 = await makeRequest('GET', `/api/facilities/${unassignedFacilityId}/scorecards`, clinicalToken);
    logResult('AccessControl', 'Clinical DENIED unassigned facility scorecards', clinicalDeny1.status === 403, `Status: ${clinicalDeny1.status}`);

    const clinicalDeny2 = await makeRequest('GET', `/api/facilities/${unassignedFacilityId}/trend`, clinicalToken);
    logResult('AccessControl', 'Clinical DENIED unassigned facility trend', clinicalDeny2.status === 403, `Status: ${clinicalDeny2.status}`);

  } catch (error) {
    logResult('AccessControl', 'Access control tests', false, error.message);
  }
}

// ===========================================
// 4. AUTH ONBOARDING ENDPOINT TEST
// ===========================================
async function testOnboardingEndpoint() {
  console.log('\n\x1b[36m=== 4. Auth Onboarding Endpoint ===\x1b[0m');

  try {
    // Create a fresh test user for onboarding test
    let testUser = await User.findOne({ where: { email: 'onboarding.test@cascadia.com' } });

    if (testUser) {
      // Reset onboarding status
      testUser.onboardingCompleted = false;
      await testUser.save();
    } else {
      testUser = await User.create({
        email: 'onboarding.test@cascadia.com',
        passwordHash: 'password123',
        firstName: 'Onboarding',
        lastName: 'Test',
        role: 'clinical_resource',
        isActive: true,
        onboardingCompleted: false
      });
    }

    // Verify initial state
    await testUser.reload();
    logResult('Onboarding', 'Test user onboarding_completed starts as false', testUser.onboardingCompleted === false);

    // Login
    const loginRes = await makeRequest('POST', '/api/auth/login', null, {
      email: 'onboarding.test@cascadia.com',
      password: 'password123'
    });

    if (loginRes.status !== 200) {
      logResult('Onboarding', 'Login for onboarding test', false, `Status: ${loginRes.status}`);
      return;
    }

    const token = loginRes.data.token;
    logResult('Onboarding', 'Login returns onboardingCompleted in response',
      loginRes.data.user.onboardingCompleted !== undefined,
      `onboardingCompleted: ${loginRes.data.user.onboardingCompleted}`
    );

    // Call onboarding-complete endpoint
    const completeRes = await makeRequest('POST', '/api/auth/onboarding-complete', token);
    logResult('Onboarding', 'POST /api/auth/onboarding-complete returns 200', completeRes.status === 200, `Status: ${completeRes.status}`);

    // Verify database was updated
    await testUser.reload();
    logResult('Onboarding', 'User onboarding_completed is now true in DB', testUser.onboardingCompleted === true);

  } catch (error) {
    logResult('Onboarding', 'Onboarding endpoint test', false, error.message);
  }
}

// ===========================================
// MAIN TEST RUNNER
// ===========================================
async function runAllTests() {
  console.log('\n\x1b[1m╔════════════════════════════════════════════════════════════╗');
  console.log('║     SystemsCheck Implementation Verification Suite         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\x1b[0m');

  try {
    await sequelize.authenticate();
    console.log('\n✓ Database connection established');

    await testDatabaseSchema();
    testRoleFilteringLogic();
    await testAccessControl();
    await testOnboardingEndpoint();

    // Print summary
    console.log('\n\x1b[1m╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\x1b[0m\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    // Group by category
    const categories = [...new Set(results.map(r => r.category))];

    console.log('┌────────────────────┬────────┬────────┐');
    console.log('│ Category           │ Passed │ Failed │');
    console.log('├────────────────────┼────────┼────────┤');

    categories.forEach(cat => {
      const catResults = results.filter(r => r.category === cat);
      const catPassed = catResults.filter(r => r.passed).length;
      const catFailed = catResults.filter(r => !r.passed).length;
      console.log(`│ ${cat.padEnd(18)} │ ${String(catPassed).padStart(6)} │ ${String(catFailed).padStart(6)} │`);
    });

    console.log('├────────────────────┼────────┼────────┤');
    console.log(`│ ${'TOTAL'.padEnd(18)} │ ${String(passed).padStart(6)} │ ${String(failed).padStart(6)} │`);
    console.log('└────────────────────┴────────┴────────┘');

    const successRate = ((passed / total) * 100).toFixed(1);
    const color = failed === 0 ? '\x1b[32m' : '\x1b[33m';
    console.log(`\n${color}Success Rate: ${successRate}% (${passed}/${total})\x1b[0m`);

    if (failed > 0) {
      console.log('\n\x1b[31mFailed Tests:\x1b[0m');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - [${r.category}] ${r.test}: ${r.details}`);
      });
    }

  } catch (error) {
    console.error('\x1b[31mTest suite error:\x1b[0m', error.message);
  } finally {
    await sequelize.close();
    process.exit(results.some(r => !r.passed) ? 1 : 0);
  }
}

runAllTests();
