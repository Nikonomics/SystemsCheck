require('dotenv').config();
const sequelize = require('../config/database');
const {
  Company,
  Team,
  Facility,
  User,
  UserFacility
} = require('../models');

// Organizational data structure
const organizationData = {
  Columbia: {
    teams: {
      'Pacific Storm': [
        'Avamere Bellingham Health & Rehab',
        'Avamere Court at Keizer',
        'Avamere Crestview of Portland',
        'Avamere Heritage Rehab of Tacoma',
        'Avamere Hillsboro',
        'Avamere Olympic Rehabilitation of Sequim',
        'Avamere Rehabilitation of Clackamas',
        'Avamere Transitional Care of Puget Sound'
      ],
      'Trail Blazers': [
        'Avamere Rehabilitation of Beaverton',
        'Avamere Rehabilitation of Eugene',
        'Avamere Rehabilitation of King City',
        'Avamere Rehabilitation of Oregon City'
      ],
      'Triple Threat': [
        'Avamere Rehabilitation of Coos Bay',
        'Avamere Rehabilitation of Newport',
        'Avamere Rehabilitation of Rogue Valley'
      ]
    }
  },
  Envision: {
    teams: {
      'Palouse PAC': [
        'Avamere at Chestnut Lane',
        'Avamere Rehabilitation of Lewiston',
        'Avamere Transitional Care & Rehab - Boise',
        'Avamere Transitional Care & Rehab - Malley'
      ],
      Willamette: [
        'Avamere Rehabilitation of Albany',
        'Avamere Rehabilitation of Bend',
        'Avamere Rehabilitation of Cascade Park',
        'Avamere Rehabilitation of Junction City',
        'Avamere Rehabilitation of Salem'
      ]
    }
  },
  'Three Rivers': {
    teams: {
      Chinook: [
        'Avamere Rehabilitation of Burien',
        'Avamere Rehabilitation of Enumclaw',
        'Avamere Rehabilitation of Federal Way',
        'Avamere Rehabilitation of Port Orchard'
      ],
      Salmon: [
        'Avamere Rehabilitation of Issaquah',
        'Avamere Rehabilitation of Lake Ridge',
        'Avamere Rehabilitation of Shoreline',
        'Avamere Skilled Nursing of Tacoma'
      ]
    }
  },
  Northern: {
    teams: {
      Redwoods: [
        'Avamere Rehabilitation of Eureka',
        'Avamere Rehabilitation of Humboldt',
        'Avamere Rehabilitation of Redding'
      ],
      Valley: [
        'Avamere Rehabilitation of Fresno',
        'Avamere Rehabilitation of Modesto',
        'Avamere Rehabilitation of Sacramento'
      ]
    }
  },
  Vincero: {
    teams: {
      Horizon: [
        'Avamere Rehabilitation of Chandler',
        'Avamere Rehabilitation of Mesa',
        'Avamere Rehabilitation of Phoenix',
        'Avamere Rehabilitation of Scottsdale'
      ],
      Summit: [
        'Avamere Rehabilitation of Boulder',
        'Avamere Rehabilitation of Denver',
        'Avamere Rehabilitation of Fort Collins',
        'Avamere Rehabilitation of Lakewood'
      ]
    }
  },
  Olympus: {
    teams: {
      Cascade: [
        'Avamere Rehabilitation of Bellevue',
        'Avamere Rehabilitation of Kirkland',
        'Avamere Rehabilitation of Lynnwood',
        'Avamere Rehabilitation of Redmond',
        'Avamere Rehabilitation of Woodinville'
      ],
      Peninsula: [
        'Avamere Rehabilitation of Bainbridge',
        'Avamere Rehabilitation of Gig Harbor',
        'Avamere Rehabilitation of Silverdale'
      ],
      'Puget Sound': [
        'Avamere Rehabilitation of Everett',
        'Avamere Rehabilitation of Marysville',
        'Avamere Rehabilitation of Mount Vernon'
      ],
      'San Juan': [
        'Avamere Rehabilitation of Anacortes',
        'Avamere Rehabilitation of Friday Harbor',
        'Avamere Rehabilitation of Oak Harbor'
      ]
    }
  }
};

// Users to seed
const usersData = [
  {
    email: 'admin@cascadia.com',
    passwordHash: 'password123',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin'
  },
  {
    email: 'clinician@cascadia.com',
    passwordHash: 'password123',
    firstName: 'Test',
    lastName: 'Clinician',
    role: 'clinical_resource'
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Syncing database schema...');
    await sequelize.sync({ force: true }); // WARNING: This drops all tables
    console.log('Database schema synced.');

    console.log('Seeding companies, teams, and facilities...');

    let totalFacilities = 0;
    let totalTeams = 0;

    for (const [companyName, companyData] of Object.entries(organizationData)) {
      // Create company
      const company = await Company.create({ name: companyName });
      console.log(`  Created company: ${companyName}`);

      for (const [teamName, facilities] of Object.entries(companyData.teams)) {
        // Create team
        const team = await Team.create({
          name: teamName,
          companyId: company.id
        });
        console.log(`    Created team: ${teamName}`);
        totalTeams++;

        // Create facilities
        for (const facilityName of facilities) {
          await Facility.create({
            name: facilityName,
            teamId: team.id,
            facilityType: 'SNF',
            isActive: true
          });
          totalFacilities++;
        }
        console.log(`      Created ${facilities.length} facilities`);
      }
    }

    console.log(`\nCreated ${Object.keys(organizationData).length} companies`);
    console.log(`Created ${totalTeams} teams`);
    console.log(`Created ${totalFacilities} facilities`);

    console.log('\nSeeding users...');
    const createdUsers = {};
    for (const userData of usersData) {
      const user = await User.create(userData);
      createdUsers[user.email] = user;
      console.log(`  Created user: ${user.email} (${user.role})`);
    }

    // Assign clinical resource to first 3 facilities from Pacific Storm team
    console.log('\nAssigning facilities to clinical resource...');
    const clinician = createdUsers['clinician@cascadia.com'];
    const firstThreeFacilities = await Facility.findAll({
      limit: 3,
      order: [['id', 'ASC']]
    });

    for (const facility of firstThreeFacilities) {
      await UserFacility.create({
        userId: clinician.id,
        facilityId: facility.id
      });
      console.log(`  Assigned: ${facility.name}`);
    }

    console.log('\n✓ Seed completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Admin: admin@cascadia.com / password123');
    console.log('  Clinician: clinician@cascadia.com / password123');
    console.log(`\nClinician is assigned to ${firstThreeFacilities.length} facilities`);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
