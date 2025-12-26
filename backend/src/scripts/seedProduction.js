/**
 * Safe Production Seed Script
 *
 * Creates SystemsCheck tables WITHOUT dropping existing CMS data tables.
 * Uses sync({ alter: true }) instead of sync({ force: true }).
 *
 * Run via: node src/scripts/seedProduction.js
 */
require('dotenv').config();
const sequelize = require('../config/database');
const {
  Company,
  Team,
  Facility,
  User,
  UserFacility,
  AuditTemplate,
  AuditTemplateSystem,
  AuditTemplateItem
} = require('../models');
const { getScoredSystems } = require('../data/auditCriteria');

// Real Cascadia Healthcare facilities from master list
const facilitiesData = [
  // Columbia - Pacific Storm
  { name: "Alderwood Park Health & Rehabilitation", type: "SNF", address: "2726 Alderwood Ave", city: "Bellingham", state: "WA", zip: "98225", company: "Columbia", team: "Pacific Storm", beds: 102, ccn: "505092" },
  { name: "Highland Health & Rehabilitation of Cascadia", type: "SNF", address: "2400 Samish Way", city: "Bellingham", state: "WA", zip: "98229", company: "Columbia", team: "Pacific Storm", beds: 44, ccn: "505140" },
  { name: "Stafholt Health and Rehabilitation of Cascadia", type: "SNF", address: "456 C Street", city: "Blaine", state: "WA", zip: "98230", company: "Columbia", team: "Pacific Storm", beds: 57, ccn: "505395" },

  // Columbia - Trail Blazers
  { name: "Beaverton Post Acute of Cascadia", type: "SNF", address: "11850 SW Allen Blvd.", city: "Beaverton", state: "OR", zip: "97005", company: "Columbia", team: "Trail Blazers", beds: 92, ccn: "385195" },
  { name: "Fairlawn Health and Rehabilitation of Cascadia", type: "SNF", address: "3457 NE Division Street", city: "Gresham", state: "OR", zip: "97030", company: "Columbia", team: "Trail Blazers", beds: 82, ccn: "385133" },
  { name: "Secora Rehabilitation of Cascadia", type: "SNF", address: "10435 Southeast Cora Street", city: "Portland", state: "OR", zip: "97266", company: "Columbia", team: "Trail Blazers", beds: 53, ccn: "385264" },
  { name: "Village Manor of Cascadia", type: "SNF", address: "2060 NE 238th Dr", city: "Wood Village", state: "OR", zip: "97060", company: "Columbia", team: "Trail Blazers", beds: 60, ccn: "385175" },

  // Columbia - Evergreen Alliance
  { name: "Bend Transitional Care", type: "SNF", address: "900 NE 27th Street", city: "Bend", state: "OR", zip: "97701", company: "Columbia", team: "Evergreen Alliance", beds: 60, ccn: "385253" },
  { name: "Creekside Health and Rehabilitation of Cascadia", type: "SNF", address: "3500 Hilyard Street", city: "Eugene", state: "OR", zip: "97405", company: "Columbia", team: "Evergreen Alliance", beds: 87, ccn: "385147" },
  { name: "Curry Village Health and Rehabilitation of Cascadia", type: "SNF", address: "1 Park Ave", city: "Brookings", state: "OR", zip: "97415", company: "Columbia", team: "Evergreen Alliance", beds: 59, ccn: "385165" },
  { name: "Curry Village of Cascadia - Hillside Apartments", type: "ILF", address: "420 Hillside Ave", city: "Brookings", state: "OR", zip: "97415", company: "Columbia", team: "Evergreen Alliance", beds: 14, ccn: null },
  { name: "Salem Transitional Care", type: "SNF", address: "3445 Boone Road SE", city: "Salem", state: "OR", zip: "97317", company: "Columbia", team: "Evergreen Alliance", beds: 80, ccn: "385234" },

  // Columbia - Bigfoot
  { name: "Brookfield Health & Rehabilitation of Cascadia", type: "SNF", address: "510 North Parkway Avenue", city: "Battle Ground", state: "WA", zip: "98604", company: "Columbia", team: "Bigfoot", beds: 83, ccn: "505331" },
  { name: "Hudson Bay Health & Rehabilitation", type: "SNF", address: "8507 NE 8th Way", city: "Vancouver", state: "WA", zip: "98664", company: "Columbia", team: "Bigfoot", beds: 92, ccn: "505260" },
  { name: "Snohomish Health and Rehabilitation of Cascadia", type: "SNF", address: "800 10th St", city: "Snohomish", state: "WA", zip: "98290", company: "Columbia", team: "Bigfoot", beds: 91, ccn: "505338" },

  // Envision - Triple Threat
  { name: "Arbor Valley of Cascadia", type: "SNF", address: "8211 Ustick Road", city: "Boise", state: "ID", zip: "83704", company: "Envision", team: "Triple Threat", beds: 148, ccn: "135079" },
  { name: "Cascadia of Boise", type: "SNF", address: "6000 West Denton St", city: "Boise", state: "ID", zip: "83704", company: "Envision", team: "Triple Threat", beds: 100, ccn: "135146" },
  { name: "Shaw Mountain of Cascadia", type: "SNF", address: "909 E. Reserve St.", city: "Boise", state: "ID", zip: "83712", company: "Envision", team: "Triple Threat", beds: 108, ccn: "135090" },

  // Envision - Ascend
  { name: "Caldwell of Cascadia", type: "SNF", address: "210 Cleveland Boulevard", city: "Caldwell", state: "ID", zip: "83605", company: "Envision", team: "Ascend", beds: 71, ccn: "135014" },
  { name: "Cherry Ridge of Cascadia", type: "SNF", address: "501 West Idaho Boulevard", city: "Emmett", state: "ID", zip: "83617", company: "Envision", team: "Ascend", beds: 40, ccn: "135095" },
  { name: "The Orchards of Cascadia", type: "SNF", address: "404 North Horton Street", city: "Nampa", state: "ID", zip: "83651", company: "Envision", team: "Ascend", beds: 100, ccn: "135019" },
  { name: "Wellspring Health and Rehab of Cascadia", type: "SNF", address: "2105 12th Ave", city: "Nampa", state: "ID", zip: "83686", company: "Envision", team: "Ascend", beds: 120, ccn: "135094" },

  // Envision - Tomahawk
  { name: "Canyon West of Cascadia", type: "SNF", address: "2814 South Indiana Avenue", city: "Caldwell", state: "ID", zip: "83605", company: "Envision", team: "Tomahawk", beds: 103, ccn: "135051" },
  { name: "Cascadia of Nampa", type: "SNF", address: "900 N Happy Valley Rd", city: "Nampa", state: "ID", zip: "83687", company: "Envision", team: "Tomahawk", beds: 99, ccn: "135144" },
  { name: "Payette Healthcare of Cascadia", type: "SNF", address: "1019 3rd Avenue South", city: "Payette", state: "ID", zip: "83661", company: "Envision", team: "Tomahawk", beds: 80, ccn: "135015" },
  { name: "Weiser Care of Cascadia", type: "SNF", address: "331 East Park Street", city: "Weiser", state: "ID", zip: "83672", company: "Envision", team: "Tomahawk", beds: 76, ccn: "135010" },

  // Envision - Wolfpack
  { name: "Eagle Rock Health and Rehabilitation of Cascadia", type: "SNF", address: "840 East Elva Street", city: "Idaho Falls", state: "ID", zip: "83401", company: "Envision", team: "Wolfpack", beds: 113, ccn: "135092" },
  { name: "Teton Healthcare of Cascadia", type: "SNF", address: "3111 Channing Way", city: "Idaho Falls", state: "ID", zip: "83404", company: "Envision", team: "Wolfpack", beds: 88, ccn: "135138" },
  { name: "The Cove of Cascadia - ALF", type: "ALF", address: "620 N. 6th Street", city: "Bellevue", state: "ID", zip: "83313", company: "Envision", team: "Wolfpack", beds: 16, ccn: null },
  { name: "The Cove of Cascadia - SNF", type: "SNF", address: "620 N. 6th Street", city: "Bellevue", state: "ID", zip: "83313", company: "Envision", team: "Wolfpack", beds: 32, ccn: "135069" },
  { name: "Twin Falls Transitional Care of Cascadia", type: "SNF", address: "674 Eastland Drive", city: "Twin Falls", state: "ID", zip: "83301", company: "Envision", team: "Wolfpack", beds: 104, ccn: "135104" },

  // Three Rivers - Palouse PAC
  { name: "Aspen Park of Cascadia", type: "SNF", address: "420 Rowe Street", city: "Moscow", state: "ID", zip: "83843", company: "Three Rivers", team: "Palouse PAC", beds: 70, ccn: "135093" },
  { name: "Clearwater Health & Rehabilitation of Cascadia", type: "SNF", address: "1204 Shriver Road", city: "Orofino", state: "ID", zip: "83544", company: "Three Rivers", team: "Palouse PAC", beds: 60, ccn: "135048" },
  { name: "Paradise Creek Health and Rehabilitation of Cascadia - SNF", type: "SNF", address: "640 N Eisenhower Street", city: "Moscow", state: "ID", zip: "83843", company: "Three Rivers", team: "Palouse PAC", beds: 63, ccn: "135067" },

  // Three Rivers - Two Rivers
  { name: "Cascadia of Lewiston", type: "SNF", address: "2852 Juniper Drive", city: "Lewiston", state: "ID", zip: "83501", company: "Three Rivers", team: "Two Rivers", beds: 34, ccn: "135145" },
  { name: "Grangeville Health and Rehabilitation of Cascadia", type: "SNF", address: "410 Northeast 2nd Street", city: "Grangeville", state: "ID", zip: "83530", company: "Three Rivers", team: "Two Rivers", beds: 60, ccn: "135080" },
  { name: "Lewiston Transitional Care of Cascadia", type: "SNF", address: "3315 8th Street", city: "Lewiston", state: "ID", zip: "83501", company: "Three Rivers", team: "Two Rivers", beds: 96, ccn: "135021" },
  { name: "Royal Plaza Health and Rehabilitation of Cascadia", type: "SNF", address: "2870 Juniper Dr", city: "Lewiston", state: "ID", zip: "83501", company: "Three Rivers", team: "Two Rivers", beds: 75, ccn: "135116" },

  // Northern - Northern FORCE
  { name: "Clarkston Health and Rehabilitation of Cascadia", type: "SNF", address: "1242 11th Street", city: "Clarkston", state: "WA", zip: "99403", company: "Northern", team: "Northern FORCE", beds: 90, ccn: "505283" },
  { name: "Colfax Health and Rehabilitation of Cascadia", type: "SNF", address: "1150 W Fairview St", city: "Colfax", state: "WA", zip: "99111", company: "Northern", team: "Northern FORCE", beds: 55, ccn: "505251" },
  { name: "Colville Health & Rehabilitation of Cascadia", type: "SNF", address: "1000 East Elep Avenue", city: "Colville", state: "WA", zip: "99114", company: "Northern", team: "Northern FORCE", beds: 92, ccn: "505275" },
  { name: "Spokane Valley Health and Rehabilitation of Cascadia", type: "SNF", address: "17121 East 8th Avenue", city: "Spokane Valley", state: "WA", zip: "99016", company: "Northern", team: "Northern FORCE", beds: 97, ccn: "505099" },

  // Northern - Golden Meadowlarks
  { name: "Libby Care Center of Cascadia", type: "SNF", address: "308 East Third Street", city: "Libby", state: "MT", zip: "59923", company: "Northern", team: "Golden Meadowlarks", beds: 101, ccn: "275040" },
  { name: "Mount Ascension Transitional Care of Cascadia", type: "SNF", address: "2475 Winne Avenue", city: "Helena", state: "MT", zip: "59601", company: "Northern", team: "Golden Meadowlarks", beds: 108, ccn: "275044" },
  { name: "Mountain View of Cascadia", type: "SNF", address: "10 Mountain View Dr", city: "Eureka", state: "MT", zip: "59917", company: "Northern", team: "Golden Meadowlarks", beds: 49, ccn: "275084" },

  // Northern - North By Northwest
  { name: "Coeur d'Alene Health and Rehabilitation of Cascadia", type: "SNF", address: "2514 N. 7th Street", city: "Coeur D Alene", state: "ID", zip: "83814", company: "Northern", team: "North By Northwest", beds: 117, ccn: "135052" },
  { name: "Mountain Valley of Cascadia", type: "SNF", address: "601 West Cameron Avenue", city: "Kellogg", state: "ID", zip: "83837", company: "Northern", team: "North By Northwest", beds: 68, ccn: "135065" },
  { name: "Silverton Health and Rehabilitation of Cascadia", type: "SNF", address: "405 West 7th St.", city: "Silverton", state: "ID", zip: "83867", company: "Northern", team: "North By Northwest", beds: 50, ccn: "135058" },
  { name: "Silverton of Cascadia Retirement Living-ALF", type: "ALF", address: "405 West 7th Street", city: "Silverton", state: "ID", zip: "83843", company: "Northern", team: "North By Northwest", beds: 14, ccn: null },
  { name: "Silverton of Cascadia Retirement Living-ILF", type: "ILF", address: "405 West 7th St.", city: "Silverton", state: "ID", zip: "83867", company: "Northern", team: "North By Northwest", beds: 14, ccn: null },

  // Vincero - Rising Phoenix
  { name: "Boswell Transitional Care of Cascadia", type: "SNF", address: "10601 W. Santa Fe Drive", city: "Sun City", state: "AZ", zip: "85351", company: "Vincero", team: "Rising Phoenix", beds: 115, ccn: "35121" },
  { name: "NorthPark Health and Rehabilitation of Cascadia", type: "SNF", address: "2020 North 95th Avenue", city: "Phoenix", state: "AZ", zip: "85037", company: "Vincero", team: "Rising Phoenix", beds: 54, ccn: "35299" },

  // Olympus - Olympus
  { name: "Creekside of Olympus Retirement Living ILF", type: "ILF", address: "3500 Hilyard St.", city: "Eugene", state: "OR", zip: "97405", company: "Olympus", team: "Olympus", beds: 24, ccn: null },
  { name: "Creekside-The Abbey of Olympus Retirement Living ILF", type: "ILF", address: "494 West 10th Ave", city: "Eugene", state: "OR", zip: "97401", company: "Olympus", team: "Olympus", beds: 50, ccn: null },
  { name: "Fairlawn of Olympus Retirement Living ILF", type: "ILF", address: "1280 NE Kane Drive", city: "Gresham", state: "OR", zip: "97030", company: "Olympus", team: "Olympus", beds: 119, ccn: null },
  { name: "Olympus Living at Spokane Valley - ILF", type: "ILF", address: "17117 East 8th Avenue", city: "Spokane Valley", state: "WA", zip: "99016", company: "Olympus", team: "Olympus", beds: 136, ccn: null },
  { name: "Olympus Living at Spokane Valley-ALF", type: "ALF", address: "17117 East 8th Avenue", city: "Spokane Valley", state: "WA", zip: "99016", company: "Olympus", team: "Olympus", beds: 14, ccn: null },
  { name: "Paradise Creek Fairview Estates of Olympus Retirement - ILF", type: "ILF", address: "403 Samaritan Lane", city: "Moscow", state: "ID", zip: "83843", company: "Olympus", team: "Olympus", beds: 60, ccn: null },
  { name: "Paradise Creek of Olympus Retirement Living - ALF", type: "ALF", address: "640 North Eisenhower Street", city: "Moscow", state: "ID", zip: "83843", company: "Olympus", team: "Olympus", beds: 36, ccn: null },
  { name: "Paradise Creek of Olympus Retirement Living - ILF", type: "ILF", address: "640 North Eisenhower St.", city: "Moscow", state: "ID", zip: "83843", company: "Olympus", team: "Olympus", beds: 62, ccn: null },
  { name: "Royal Plaza of Olympus Living - ALF", type: "ALF", address: "2870 Juniper Dr", city: "Lewiston", state: "ID", zip: "83501", company: "Olympus", team: "Olympus", beds: 110, ccn: null },
];

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

async function seedProduction() {
  try {
    console.log('='.repeat(60));
    console.log('SystemsCheck Production Seed');
    console.log('='.repeat(60));
    console.log('\nConnecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Use ALTER instead of FORCE to preserve existing tables
    console.log('\nSyncing SystemsCheck tables (ALTER mode - preserves existing data)...');

    // Sync only the models we need, without force
    await Company.sync({ alter: true });
    await Team.sync({ alter: true });
    await Facility.sync({ alter: true });
    await User.sync({ alter: true });
    await UserFacility.sync({ alter: true });
    await AuditTemplate.sync({ alter: true });
    await AuditTemplateSystem.sync({ alter: true });
    await AuditTemplateItem.sync({ alter: true });

    // Also need scorecard tables
    const { Scorecard, ScorecardSystem, ScorecardItem } = require('../models');
    await Scorecard.sync({ alter: true });
    await ScorecardSystem.sync({ alter: true });
    await ScorecardItem.sync({ alter: true });

    console.log('Tables synced.');

    // Check if data already exists
    const existingCompanies = await Company.count();
    const existingFacilities = await Facility.count();

    if (existingCompanies > 0 && existingFacilities > 0) {
      console.log(`\nData already exists (${existingCompanies} companies, ${existingFacilities} facilities).`);
      console.log('Skipping company/team/facility seeding to avoid duplicates.');
    } else {
      console.log('\nSeeding companies, teams, and facilities...');

      // Collect unique companies and teams
      const companiesMap = new Map();
      const teamsMap = new Map();

      for (const facility of facilitiesData) {
        if (!companiesMap.has(facility.company)) {
          companiesMap.set(facility.company, null);
        }
        const teamKey = `${facility.company}|${facility.team}`;
        if (!teamsMap.has(teamKey)) {
          teamsMap.set(teamKey, { company: facility.company, team: facility.team });
        }
      }

      // Create companies
      for (const companyName of companiesMap.keys()) {
        const [company] = await Company.findOrCreate({
          where: { name: companyName },
          defaults: { name: companyName }
        });
        companiesMap.set(companyName, company);
        console.log(`  Company: ${companyName}`);
      }

      // Create teams
      for (const [teamKey, teamInfo] of teamsMap.entries()) {
        const company = companiesMap.get(teamInfo.company);
        const [team] = await Team.findOrCreate({
          where: { name: teamInfo.team, companyId: company.id },
          defaults: { name: teamInfo.team, companyId: company.id }
        });
        teamsMap.set(teamKey, { ...teamInfo, teamModel: team });
        console.log(`    Team: ${teamInfo.team} (${teamInfo.company})`);
      }

      // Create facilities
      let facilityCount = 0;
      for (const facilityData of facilitiesData) {
        const teamKey = `${facilityData.company}|${facilityData.team}`;
        const teamInfo = teamsMap.get(teamKey);

        await Facility.findOrCreate({
          where: { name: facilityData.name },
          defaults: {
            name: facilityData.name,
            teamId: teamInfo.teamModel.id,
            facilityType: facilityData.type,
            address: facilityData.address,
            city: facilityData.city,
            state: facilityData.state,
            zipCode: facilityData.zip,
            ccn: facilityData.ccn || null,
            isActive: true
          }
        });
        facilityCount++;
      }

      console.log(`\nCreated ${companiesMap.size} companies`);
      console.log(`Created ${teamsMap.size} teams`);
      console.log(`Created ${facilityCount} facilities`);
    }

    // Seed users (check if they exist first)
    console.log('\nChecking users...');
    const createdUsers = {};
    for (const userData of usersData) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      createdUsers[user.email] = user;
      console.log(`  User: ${user.email} ${created ? '(created)' : '(exists)'}`);
    }

    // Assign clinical resource to first 3 SNF facilities if not already
    const clinician = createdUsers['clinician@cascadia.com'];
    const existingAssignments = await UserFacility.count({ where: { userId: clinician.id } });

    if (existingAssignments === 0) {
      console.log('\nAssigning facilities to clinical resource...');
      const snfFacilities = await Facility.findAll({
        where: { facilityType: 'SNF' },
        limit: 3,
        order: [['id', 'ASC']]
      });

      for (const facility of snfFacilities) {
        await UserFacility.findOrCreate({
          where: { userId: clinician.id, facilityId: facility.id },
          defaults: { userId: clinician.id, facilityId: facility.id }
        });
        console.log(`  Assigned: ${facility.name}`);
      }
    } else {
      console.log(`\nClinician already has ${existingAssignments} facility assignments.`);
    }

    // Check audit template
    const existingTemplate = await AuditTemplate.findOne({ where: { isActive: true } });
    if (existingTemplate) {
      console.log('\nAudit template already exists.');
    } else {
      console.log('\nSeeding audit template...');
      const admin = createdUsers['admin@cascadia.com'];

      const template = await AuditTemplate.create({
        name: 'Master Template',
        isActive: true,
        createdById: admin.id,
        updatedById: admin.id
      });

      const scoredSystems = getScoredSystems();
      let totalItems = 0;

      for (const systemData of scoredSystems) {
        const templateSystem = await AuditTemplateSystem.create({
          templateId: template.id,
          systemNumber: systemData.systemNumber,
          name: systemData.name,
          maxPoints: systemData.maxPoints,
          sections: systemData.sections || [],
          pageDescription: systemData.pageDescription || null,
          sortOrder: systemData.systemNumber
        });

        for (let i = 0; i < systemData.items.length; i++) {
          const item = systemData.items[i];
          await AuditTemplateItem.create({
            templateSystemId: templateSystem.id,
            itemNumber: item.number,
            text: item.text,
            maxPoints: item.maxPoints,
            sampleSize: item.sampleSize,
            multiplier: item.multiplier,
            inputType: item.inputType,
            sortOrder: i + 1
          });
          totalItems++;
        }

        console.log(`  System ${systemData.systemNumber}: ${systemData.name} (${systemData.items.length} items)`);
      }

      console.log(`\nCreated audit template with ${scoredSystems.length} systems and ${totalItems} items`);
    }

    // Final summary
    const finalStats = {
      companies: await Company.count(),
      teams: await Team.count(),
      facilities: await Facility.count(),
      users: await User.count(),
      snfWithCcn: await Facility.count({ where: { facilityType: 'SNF', ccn: { [require('sequelize').Op.ne]: null } } })
    };

    console.log('\n' + '='.repeat(60));
    console.log('Seed Complete!');
    console.log('='.repeat(60));
    console.log(`Companies: ${finalStats.companies}`);
    console.log(`Teams: ${finalStats.teams}`);
    console.log(`Facilities: ${finalStats.facilities}`);
    console.log(`SNFs with CCN: ${finalStats.snfWithCcn}`);
    console.log(`Users: ${finalStats.users}`);
    console.log('\nTest credentials:');
    console.log('  Admin: admin@cascadia.com / password123');
    console.log('  Clinician: clinician@cascadia.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedProduction();
