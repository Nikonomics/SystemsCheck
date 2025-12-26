/**
 * One-time migration script to populate CCNs for existing facilities
 *
 * Reads CCN data from cascadia-facilities.csv and updates facilities in the database.
 * Safe to run multiple times - skips facilities that already have CCNs.
 *
 * Usage: node src/scripts/populateCCNs.js
 *    or: npm run populate-ccns
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Facility } = require('../models');
const sequelize = require('../config/database');

// Path to CSV file
const CSV_PATH = path.join(__dirname, '../data/cascadia-facilities.csv');

/**
 * Parse CSV file and return facility name -> CCN mapping
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Get header to find column indices
  const header = lines[0].split(',');
  const nameIndex = header.findIndex(h => h.trim() === 'Facility Name');
  const ccnIndex = header.findIndex(h => h.trim() === 'CCN');

  if (nameIndex === -1 || ccnIndex === -1) {
    throw new Error('CSV must have "Facility Name" and "CCN" columns');
  }

  const mapping = new Map();

  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with potential quoted fields
    const parts = parseCSVLine(line);

    const name = parts[nameIndex]?.trim();
    let ccn = parts[ccnIndex]?.trim();

    // Skip empty names or CCNs
    if (!name) continue;

    // Handle scientific notation (e.g., "3.80E+175" should be skipped)
    if (ccn && ccn.includes('E+')) {
      ccn = null;
    }

    // Only add if CCN is a valid number string
    if (ccn && /^\d+$/.test(ccn)) {
      mapping.set(name, ccn);
    }
  }

  return mapping;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);

  return parts;
}

/**
 * Normalize facility name for matching
 * Removes common suffixes and variations
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Find best matching CCN for a facility name
 */
function findCCN(facilityName, ccnMapping) {
  // Try exact match first
  if (ccnMapping.has(facilityName)) {
    return ccnMapping.get(facilityName);
  }

  // Try normalized match
  const normalizedFacility = normalizeName(facilityName);

  for (const [csvName, ccn] of ccnMapping.entries()) {
    if (normalizeName(csvName) === normalizedFacility) {
      return ccn;
    }
  }

  // Try partial match (facility name contains or is contained by CSV name)
  for (const [csvName, ccn] of ccnMapping.entries()) {
    const normalizedCsv = normalizeName(csvName);
    if (normalizedFacility.includes(normalizedCsv) || normalizedCsv.includes(normalizedFacility)) {
      return ccn;
    }
  }

  return null;
}

async function main() {
  console.log('='.repeat(60));
  console.log('CCN Population Script');
  console.log('='.repeat(60));
  console.log();

  try {
    // Connect to database
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected.\n');

    // Parse CSV
    console.log(`Reading CSV: ${CSV_PATH}`);
    const ccnMapping = parseCSV(CSV_PATH);
    console.log(`Found ${ccnMapping.size} facilities with CCNs in CSV.\n`);

    // Get all facilities from database
    const facilities = await Facility.findAll({
      attributes: ['id', 'name', 'ccn', 'facilityType'],
      order: [['name', 'ASC']]
    });

    console.log(`Found ${facilities.length} facilities in database.\n`);

    // Track results
    let updated = 0;
    let alreadyHadCCN = 0;
    let notFound = [];
    let skippedNonSNF = 0;

    // Update facilities
    console.log('Processing facilities...\n');

    for (const facility of facilities) {
      // Skip non-SNF facilities (they don't have CCNs)
      if (facility.facilityType !== 'SNF') {
        skippedNonSNF++;
        continue;
      }

      // Skip if already has CCN
      if (facility.ccn) {
        alreadyHadCCN++;
        console.log(`  [SKIP] ${facility.name} - already has CCN: ${facility.ccn}`);
        continue;
      }

      // Find CCN in mapping
      const ccn = findCCN(facility.name, ccnMapping);

      if (ccn) {
        await facility.update({ ccn });
        updated++;
        console.log(`  [UPDATE] ${facility.name} -> CCN: ${ccn}`);
      } else {
        notFound.push(facility.name);
        console.log(`  [NOT FOUND] ${facility.name}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total facilities in DB:     ${facilities.length}`);
    console.log(`SNF facilities:             ${facilities.length - skippedNonSNF}`);
    console.log(`Non-SNF (skipped):          ${skippedNonSNF}`);
    console.log(`Already had CCN:            ${alreadyHadCCN}`);
    console.log(`Updated with CCN:           ${updated}`);
    console.log(`Not found in CSV:           ${notFound.length}`);

    if (notFound.length > 0) {
      console.log('\nFacilities not found in CSV:');
      notFound.forEach(name => console.log(`  - ${name}`));
    }

    console.log('\nDone!');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
