/**
 * One-time script to add CCNs to existing facilities
 * Run via: node src/scripts/addCcns.js
 */
require('dotenv').config();
const { Facility } = require('../models');

// CCN mappings - same as in seed.js
const facilityToCcn = {
  'Alderwood Park Health & Rehabilitation': '505092',
  'Highland Health & Rehabilitation of Cascadia': '505140',
  'Stafholt Health and Rehabilitation of Cascadia': '505395',
  'Beaverton Post Acute of Cascadia': '385195',
  'Fairlawn Health and Rehabilitation of Cascadia': '385133',
  'Secora Rehabilitation of Cascadia': '385264',
  'Village Manor of Cascadia': '385175',
  'Bend Transitional Care': '385253',
  'Creekside Health and Rehabilitation of Cascadia': '385147',
  'Curry Village Health and Rehabilitation of Cascadia': '385165',
  'Evergreen Health and Rehabilitation of Cascadia': '385087',
  'McKenzie Health and Rehabilitation of Cascadia': '385149',
  'Regency Gresham Nursing and Rehabilitation of Cascadia': '385138',
  'Springfield Health and Rehabilitation of Cascadia': '385089',
  'Waterford Health and Rehabilitation of Cascadia': '385140',
  'Willamette Health and Rehabilitation of Cascadia': '385141',
  'Cedar Hills Health and Rehabilitation': '505094',
  'Clackamas Health and Rehabilitation': '505096',
  'Columbia Health and Rehabilitation': '505098',
  'Forest Grove Health and Rehabilitation': '505100',
  'Lake Oswego Health and Rehabilitation': '505102',
  'Milwaukie Health and Rehabilitation': '505104',
  'Oregon City Health and Rehabilitation': '505106',
  'Tigard Health and Rehabilitation': '505108',
  'Tualatin Health and Rehabilitation': '505110',
  'West Linn Health and Rehabilitation': '505112',
  'Wilsonville Health and Rehabilitation': '505114',
  'Woodburn Health and Rehabilitation': '505116',
  'Albany Health and Rehabilitation': '385167',
  'Corvallis Health and Rehabilitation': '385169',
  'Eugene Health and Rehabilitation': '385171',
  'Grants Pass Health and Rehabilitation': '385173',
  'Klamath Falls Health and Rehabilitation': '385177',
  'Medford Health and Rehabilitation': '385179',
  'Pendleton Health and Rehabilitation': '385181',
  'Roseburg Health and Rehabilitation': '385183',
  'Salem Health and Rehabilitation': '385185',
  'The Dalles Health and Rehabilitation': '385187',
  'Astoria Health and Rehabilitation': '385189',
  'Brookings Health and Rehabilitation': '385191',
  'Coos Bay Health and Rehabilitation': '385193',
  'Florence Health and Rehabilitation': '385197',
  'Hood River Health and Rehabilitation': '385199',
  'La Grande Health and Rehabilitation': '385201',
  'Lincoln City Health and Rehabilitation': '385203',
  'Newport Health and Rehabilitation': '385205',
  'Ontario Health and Rehabilitation': '385207',
  'Seaside Health and Rehabilitation': '385209',
};

async function addCcns() {
  console.log('Adding CCNs to facilities...');

  let updated = 0;
  let notFound = 0;

  for (const [name, ccn] of Object.entries(facilityToCcn)) {
    const facility = await Facility.findOne({ where: { name } });
    if (facility) {
      if (!facility.ccn) {
        await facility.update({ ccn });
        console.log(`  ✓ ${name}: ${ccn}`);
        updated++;
      }
    } else {
      notFound++;
    }
  }

  console.log(`\nDone! Updated ${updated} facilities. ${notFound} not found.`);
}

addCcns()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
