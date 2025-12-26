/**
 * One-Time CCN Matching Script
 *
 * Matches SystemsCheck facilities to CMS facilities by name and state,
 * populating the CCN (CMS Certification Number) field.
 *
 * Run with: node src/scripts/matchFacilityCCN.js
 */

require('dotenv').config();

const { Pool } = require('pg');
const sequelize = require('../config/database');
const Facility = require('../models/Facility');

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Normalize facility name for comparison
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')         // Normalize spaces
    .replace(/\b(of|the|and|at|in|on|for)\b/g, '') // Remove common words
    .replace(/\b(health|healthcare|care|center|facility|nursing|skilled|rehabilitation|rehab|transitional|post acute|postacute)\b/g, '')
    .trim();
}

// Calculate similarity score (0-100)
function similarityScore(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  if (n1 === n2) return 100;

  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 0;

  const distance = levenshtein(n1, n2);
  return Math.round((1 - distance / maxLen) * 100);
}

async function main() {
  console.log('='.repeat(60));
  console.log('CCN Matching Script');
  console.log('='.repeat(60));

  // Connect to market database
  const marketConnectionString = process.env.MARKET_DATABASE_URL;
  if (!marketConnectionString) {
    console.error('ERROR: MARKET_DATABASE_URL not set');
    process.exit(1);
  }

  const marketPool = new Pool({
    connectionString: marketConnectionString,
    ssl: marketConnectionString.includes('render.com') ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connections
    console.log('\nTesting database connections...');
    await sequelize.authenticate();
    console.log('✓ SystemsCheck database connected');

    await marketPool.query('SELECT 1');
    console.log('✓ Market database connected');

    // Get all SystemsCheck facilities
    const facilities = await Facility.findAll({
      where: { facilityType: 'SNF' }, // Only match SNF facilities
      order: [['name', 'ASC']]
    });
    console.log(`\nFound ${facilities.length} SNF facilities in SystemsCheck`);

    // Get all SNF facilities from market database
    const { rows: cmsFacilities } = await marketPool.query(`
      SELECT
        federal_provider_number as ccn,
        facility_name as name,
        city,
        state,
        county
      FROM snf_facilities
      WHERE federal_provider_number IS NOT NULL
    `);
    console.log(`Found ${cmsFacilities.length} facilities in CMS database`);

    // Match facilities
    const matches = [];
    const noMatches = [];
    const multipleMatches = [];

    for (const facility of facilities) {
      const state = facility.state?.toUpperCase();
      const city = facility.city?.toLowerCase();

      // Filter CMS facilities by state first
      const stateMatches = cmsFacilities.filter(
        cms => cms.state?.toUpperCase() === state
      );

      if (stateMatches.length === 0) {
        noMatches.push({ facility, reason: 'No facilities in state' });
        continue;
      }

      // Calculate similarity scores
      const scored = stateMatches.map(cms => ({
        cms,
        nameScore: similarityScore(facility.name, cms.name),
        cityMatch: city && cms.city?.toLowerCase() === city
      }));

      // Sort by score (and city match as tiebreaker)
      scored.sort((a, b) => {
        if (b.nameScore !== a.nameScore) return b.nameScore - a.nameScore;
        return (b.cityMatch ? 1 : 0) - (a.cityMatch ? 1 : 0);
      });

      const bestMatch = scored[0];

      // Check for high-confidence match
      if (bestMatch.nameScore >= 70) {
        // Check if there are multiple good matches
        const goodMatches = scored.filter(s => s.nameScore >= 70);
        if (goodMatches.length > 1) {
          multipleMatches.push({
            facility,
            matches: goodMatches.slice(0, 3).map(m => ({
              ccn: m.cms.ccn,
              name: m.cms.name,
              city: m.cms.city,
              score: m.nameScore
            }))
          });
        } else {
          matches.push({
            facility,
            ccn: bestMatch.cms.ccn,
            cmsName: bestMatch.cms.name,
            cmsCity: bestMatch.cms.city,
            score: bestMatch.nameScore
          });
        }
      } else if (bestMatch.nameScore >= 50) {
        // Medium confidence - log for review
        noMatches.push({
          facility,
          reason: 'Low confidence match',
          bestMatch: {
            ccn: bestMatch.cms.ccn,
            name: bestMatch.cms.name,
            city: bestMatch.cms.city,
            score: bestMatch.nameScore
          }
        });
      } else {
        noMatches.push({ facility, reason: 'No similar facilities found' });
      }
    }

    // Report results
    console.log('\n' + '='.repeat(60));
    console.log('MATCHING RESULTS');
    console.log('='.repeat(60));

    console.log(`\n✓ Matched: ${matches.length} facilities`);
    console.log(`⚠ Multiple matches: ${multipleMatches.length} facilities`);
    console.log(`✗ No match: ${noMatches.length} facilities`);

    // Show matched facilities
    if (matches.length > 0) {
      console.log('\n--- MATCHED FACILITIES ---');
      for (const m of matches) {
        console.log(`  ${m.facility.name} (${m.facility.city}, ${m.facility.state})`);
        console.log(`    → CCN: ${m.ccn} | ${m.cmsName} (${m.cmsCity}) | Score: ${m.score}%`);
      }
    }

    // Show multiple matches (need manual review)
    if (multipleMatches.length > 0) {
      console.log('\n--- MULTIPLE MATCHES (needs review) ---');
      for (const mm of multipleMatches) {
        console.log(`  ${mm.facility.name} (${mm.facility.city}, ${mm.facility.state})`);
        for (const m of mm.matches) {
          console.log(`    → CCN: ${m.ccn} | ${m.name} (${m.city}) | Score: ${m.score}%`);
        }
      }
    }

    // Show no matches
    if (noMatches.length > 0) {
      console.log('\n--- NO MATCH ---');
      for (const nm of noMatches) {
        console.log(`  ${nm.facility.name} (${nm.facility.city}, ${nm.facility.state})`);
        console.log(`    Reason: ${nm.reason}`);
        if (nm.bestMatch) {
          console.log(`    Best candidate: ${nm.bestMatch.name} (${nm.bestMatch.city}) | Score: ${nm.bestMatch.score}%`);
        }
      }
    }

    // Ask for confirmation before updating
    console.log('\n' + '='.repeat(60));
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question(`\nUpdate ${matches.length} facilities with matched CCNs? (yes/no): `, resolve);
    });
    rl.close();

    if (answer.toLowerCase() === 'yes') {
      console.log('\nUpdating facilities...');
      let updated = 0;
      for (const m of matches) {
        await Facility.update(
          { ccn: m.ccn },
          { where: { id: m.facility.id } }
        );
        updated++;
      }
      console.log(`✓ Updated ${updated} facilities with CCN values`);
    } else {
      console.log('Skipped updates.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await marketPool.end();
    await sequelize.close();
  }
}

main();
