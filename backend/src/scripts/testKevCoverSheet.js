/**
 * Test KEV Cover Sheet Parser
 *
 * Validates the simplified cover sheet extraction on sample files.
 */

const { parseKevCoverSheet, validateCoverSheetData } = require('../utils/kevCoverSheetParser');
const fs = require('fs');
const path = require('path');

// Sample files to test
const testFiles = [
  {
    name: 'KEV Hybrid',
    path: '/Users/nikolashulewsky/Desktop/Score Cards/Columbia Vincero/Alderwood Scorecards/KEV Scorecards 2025/Alderwood July 2025 Hybrid KEV Scorecard 4-4-25 Final.xlsx'
  },
  {
    name: 'KEV Mini',
    path: '/Users/nikolashulewsky/Desktop/Score Cards/Northern/KEV Scorecard Colville/Colville January 2025 KEV Score Cards (Mini).xlsm'
  }
];

console.log('='.repeat(80));
console.log('KEV COVER SHEET PARSER TEST');
console.log('='.repeat(80));

for (const testFile of testFiles) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`FILE: ${testFile.name}`);
  console.log(`PATH: ${path.basename(testFile.path)}`);
  console.log('─'.repeat(80));

  try {
    const buffer = fs.readFileSync(testFile.path);
    const parsed = parseKevCoverSheet(buffer, path.basename(testFile.path));

    if (!parsed.success) {
      console.log(`\n❌ PARSE ERROR: ${parsed.error}`);
      continue;
    }

    // Cover Sheet Data
    console.log('\n📋 COVER SHEET DATA:');
    console.log(`   Format: ${parsed.format}`);
    console.log(`   Facility: ${parsed.facilityName || 'NOT EXTRACTED'}`);
    console.log(`   Review Period: ${parsed.reviewPeriod || 'NOT EXTRACTED'}`);
    console.log(`   Date of Completion: ${parsed.dateOfCompletion || 'NOT EXTRACTED'}`);
    console.log(`   Audit Completed By: ${parsed.auditCompletedBy || 'NOT EXTRACTED'}`);
    console.log(`   Month: ${parsed.month || 'NOT EXTRACTED'}`);
    console.log(`   Year: ${parsed.year || 'NOT EXTRACTED'}`);
    console.log(`   Date Source: ${parsed.dateSource || 'N/A'}`);

    // Scores
    console.log('\n📊 SCORES:');
    console.log(`   Total Possible: ${parsed.totalPossible}`);
    console.log(`   Total Met: ${parsed.totalMet}`);
    console.log(`   Total %: ${parsed.totalPercentage}%`);
    console.log(`   Overall Score: ${parsed.overallScore}%`);

    // Quality Areas
    console.log('\n📁 QUALITY AREAS:');
    if (parsed.qualityAreas.length === 0) {
      console.log('   ⚠️  No quality areas extracted');
    } else {
      for (const area of parsed.qualityAreas) {
        console.log(`   ${area.category}:`);
        console.log(`      Possible: ${area.possibleScore}, Met: ${area.metScore}, %: ${area.percentage}`);
      }
    }

    // Validation
    console.log('\n⚠️  VALIDATION:');
    const validation = validateCoverSheetData(parsed);
    if (validation.isValid) {
      console.log('   ✅ Data is valid');
    } else {
      console.log('   ❌ Validation failed:');
      for (const err of validation.errors) {
        console.log(`      - ${err}`);
      }
    }
    if (validation.warnings.length > 0) {
      console.log('   ⚠️  Warnings:');
      for (const warn of validation.warnings) {
        console.log(`      - ${warn}`);
      }
    }

  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
