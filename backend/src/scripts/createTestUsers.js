/**
 * Create test users for manual testing
 * Run: cd backend && node src/scripts/createTestUsers.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { User, Facility, Company, Team, UserFacility } = require('../models');
const sequelize = require('../config/database');

const TEST_PASSWORD = 'Test123!';

const TEST_USERS = [
  {
    email: 'facilitylead.alderwood@test.com',
    firstName: 'Alderwood',
    lastName: 'FacilityLead',
    role: 'facility_leader',
    assignmentType: 'facility',
    assignmentSearch: 'Alderwood'
  },
  {
    email: 'clinician.bend@test.com',
    firstName: 'Bend',
    lastName: 'Clinician',
    role: 'clinical_resource',
    assignmentType: 'facility',
    assignmentSearch: 'Bend Transitional'
  },
  {
    email: 'leader.columbia@test.com',
    firstName: 'Columbia',
    lastName: 'Leader',
    role: 'company_leader',
    assignmentType: 'company',
    assignmentSearch: 'Columbia'
  },
  {
    email: 'corporate@test.com',
    firstName: 'Corporate',
    lastName: 'User',
    role: 'corporate',
    assignmentType: null,
    assignmentSearch: null
  }
];

async function findFacility(searchTerm) {
  const facility = await Facility.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')),
      'LIKE',
      `%${searchTerm.toLowerCase()}%`
    )
  });
  return facility;
}

async function findCompany(searchTerm) {
  const company = await Company.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')),
      'LIKE',
      `%${searchTerm.toLowerCase()}%`
    )
  });
  return company;
}

async function createOrUpdateUser(userData, rawPassword, companyId, teamId) {
  let user = await User.findOne({ where: { email: userData.email } });

  if (user) {
    // Update existing user
    await user.update({
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      companyId,
      teamId,
      onboardingCompleted: false,
      isActive: true
    });
    console.log(`  Updated existing user: ${userData.email}`);
  } else {
    // Create new user - passwordHash gets auto-hashed by beforeCreate hook
    user = await User.create({
      email: userData.email,
      passwordHash: rawPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      companyId,
      teamId,
      onboardingCompleted: false,
      isActive: true
    });
    console.log(`  Created new user: ${userData.email}`);
  }

  return user;
}

async function assignUserToFacility(user, facility) {
  // Remove existing facility assignments
  await UserFacility.destroy({ where: { userId: user.id } });

  // Create new assignment
  await UserFacility.create({
    userId: user.id,
    facilityId: facility.id,
    isPrimary: true
  });

  console.log(`  Assigned to facility: ${facility.name} (ID: ${facility.id})`);
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.\n');

    // Pass raw password - the User model hooks handle hashing
    console.log(`Password for all users: ${TEST_PASSWORD}\n`);

    const results = [];

    for (const userData of TEST_USERS) {
      console.log(`\nProcessing: ${userData.email}`);
      console.log(`  Role: ${userData.role}`);

      let companyId = null;
      let teamId = null;
      let facility = null;
      let company = null;

      // Look up assignment
      if (userData.assignmentType === 'facility' && userData.assignmentSearch) {
        facility = await findFacility(userData.assignmentSearch);
        if (facility) {
          console.log(`  Found facility: "${facility.name}" (ID: ${facility.id})`);
          companyId = facility.companyId;
          teamId = facility.teamId;
          if (facility.companyId) {
            const facilityCompany = await Company.findByPk(facility.companyId);
            if (facilityCompany) {
              console.log(`  Company: "${facilityCompany.name}" (ID: ${facility.companyId})`);
            }
          }
        } else {
          console.log(`  WARNING: No facility found matching "${userData.assignmentSearch}"`);
        }
      } else if (userData.assignmentType === 'company' && userData.assignmentSearch) {
        company = await findCompany(userData.assignmentSearch);
        if (company) {
          console.log(`  Found company: "${company.name}" (ID: ${company.id})`);
          companyId = company.id;
        } else {
          console.log(`  WARNING: No company found matching "${userData.assignmentSearch}"`);
        }
      }

      // Create or update user
      const user = await createOrUpdateUser(userData, TEST_PASSWORD, companyId, teamId);

      // Assign to facility if needed
      if (userData.assignmentType === 'facility' && facility) {
        await assignUserToFacility(user, facility);
      }

      results.push({
        email: user.email,
        id: user.id,
        role: user.role,
        companyId: user.companyId,
        teamId: user.teamId,
        facilityId: facility?.id || null,
        facilityName: facility?.name || null
      });
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY - Test Users Created/Updated');
    console.log('='.repeat(80));
    console.log(`Password for all users: ${TEST_PASSWORD}\n`);

    console.log('| Email                              | Role              | Company | Team | Facility |');
    console.log('|' + '-'.repeat(36) + '|' + '-'.repeat(19) + '|' + '-'.repeat(9) + '|' + '-'.repeat(6) + '|' + '-'.repeat(10) + '|');

    for (const r of results) {
      const email = r.email.padEnd(34);
      const role = r.role.padEnd(17);
      const company = (r.companyId || '-').toString().padEnd(7);
      const team = (r.teamId || '-').toString().padEnd(4);
      const facility = (r.facilityId || '-').toString().padEnd(8);
      console.log(`| ${email} | ${role} | ${company} | ${team} | ${facility} |`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('Done! You can now log in with these test accounts.');
    console.log('='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
