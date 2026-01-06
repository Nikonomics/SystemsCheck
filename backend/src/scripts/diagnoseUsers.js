/**
 * Diagnose test users - check their state and associations
 */
require('dotenv').config();
const { User, Facility, UserFacility, Team, Company } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const TEST_EMAILS = [
  'facilitylead.alderwood@test.com',
  'clinician.bend@test.com',
  'leader.columbia@test.com',
  'corporate@test.com'
];

async function main() {
  try {
    await sequelize.authenticate();
    console.log('=== DIAGNOSTIC: Test Users State ===\n');

    for (const email of TEST_EMAILS) {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        console.log(email + ': NOT FOUND\n');
        continue;
      }

      console.log(email);
      console.log('  ID:', user.id);
      console.log('  Role:', user.role);

      // Check UserFacility assignments
      const assignments = await UserFacility.findAll({
        where: { userId: user.id },
        include: [{ model: Facility, attributes: ['id', 'name', 'teamId'] }]
      });

      if (assignments.length === 0) {
        console.log('  UserFacility: NO ASSIGNMENTS');
      } else {
        console.log('  UserFacility assignments:');
        for (const a of assignments) {
          const f = a.Facility;
          console.log('    - Facility ID:', f.id, '|', f.name, '| teamId:', f.teamId);
        }
      }
      console.log('');
    }

    // Check Alderwood facility details
    const alderwood = await Facility.findOne({
      where: { name: { [Op.iLike]: '%alderwood%' } },
      include: [{ model: Team, include: [Company] }]
    });

    if (alderwood) {
      console.log('=== Alderwood Facility Details ===');
      console.log('  Facility ID:', alderwood.id);
      console.log('  Name:', alderwood.name);
      console.log('  teamId:', alderwood.teamId);
      if (alderwood.Team) {
        console.log('  Team Name:', alderwood.Team.name);
        console.log('  Team companyId:', alderwood.Team.companyId);
        if (alderwood.Team.Company) {
          console.log('  Company Name:', alderwood.Team.Company.name);
        }
      }
    }

    // Check Columbia company
    const columbia = await Company.findOne({
      where: { name: { [Op.iLike]: '%columbia%' } },
      include: [{ model: Team }]
    });

    if (columbia) {
      console.log('\n=== Columbia Company Details ===');
      console.log('  Company ID:', columbia.id);
      console.log('  Name:', columbia.name);
      if (columbia.Teams && columbia.Teams.length > 0) {
        console.log('  Teams:');
        for (const t of columbia.Teams) {
          console.log('    - Team ID:', t.id, '|', t.name);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
