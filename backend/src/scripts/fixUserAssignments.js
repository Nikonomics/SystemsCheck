/**
 * Fix user assignments for test users
 */
require('dotenv').config();
const { User, Facility, UserFacility } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.\n');

    // Fix company_leader - needs facility assignment to derive company
    const companyLeader = await User.findOne({ where: { email: 'leader.columbia@test.com' } });
    if (companyLeader) {
      console.log('Found company_leader:', companyLeader.email, '| ID:', companyLeader.id);

      // Find a facility in Columbia company (Alderwood is in Columbia)
      const facility = await Facility.findOne({
        where: { name: { [Op.iLike]: '%alderwood%' } }
      });

      if (facility) {
        // Create UserFacility assignment
        await UserFacility.destroy({ where: { userId: companyLeader.id } });
        await UserFacility.create({
          userId: companyLeader.id,
          facilityId: facility.id
        });
        console.log('  Assigned to facility:', facility.name, '(ID:', facility.id + ')');
        console.log('  Company context will be derived from this facility.');
      }
    }

    // Clean up orphaned clinician user
    const orphan = await User.findOne({ where: { email: 'clinician.pacificstorm@test.com' } });
    if (orphan) {
      await orphan.destroy();
      console.log('\nDeleted orphaned user: clinician.pacificstorm@test.com');
    }

    // Verify final state
    console.log('\n=== Final User Assignments ===');
    const results = await sequelize.query(`
      SELECT u.email, u.role, uf.facility_id, f.name as facility_name, t.name as team_name, c.name as company_name
      FROM users u
      LEFT JOIN user_facilities uf ON u.id = uf.user_id
      LEFT JOIN facilities f ON uf.facility_id = f.id
      LEFT JOIN teams t ON f.team_id = t.id
      LEFT JOIN companies c ON t.company_id = c.id
      WHERE u.email LIKE '%@test.com'
      ORDER BY u.email
    `, { type: sequelize.QueryTypes.SELECT });

    console.table(results);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
