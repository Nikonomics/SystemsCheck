/**
 * Validate KEV Extraction
 *
 * Run this against sample files to see exactly what data we're capturing
 * and identify any gaps or issues before building the database tables.
 */

const { parseKevFile } = require('../utils/kevParser');
const fs = require('fs');
const path = require('path');

// Sample files to test - one of each type
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
console.log('KEV EXTRACTION VALIDATION');
console.log('='.repeat(80));

for (const testFile of testFiles) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`FILE: ${testFile.name}`);
  console.log(`PATH: ${path.basename(testFile.path)}`);
  console.log('─'.repeat(80));

  try {
    const buffer = fs.readFileSync(testFile.path);
    const parsed = parseKevFile(buffer);

    // Top-level metadata
    console.log('\n📋 METADATA:');
    console.log(`   Format: ${parsed.kevType}`);
    console.log(`   Facility: ${parsed.facilityName || 'NOT EXTRACTED'}`);
    console.log(`   Review Period: ${parsed.reviewPeriod || 'NOT EXTRACTED'}`);
    console.log(`   Month: ${parsed.month || 'NOT EXTRACTED'}`);
    console.log(`   Year: ${parsed.year || 'NOT EXTRACTED'}`);

    // Scores
    console.log('\n📊 SCORES:');
    console.log(`   Total Score: ${parsed.totalScore} / ${parsed.totalMaxPoints}`);
    console.log(`   Percentage: ${parsed.scorePercentage}%`);

    // Categories
    console.log('\n📁 CATEGORIES:');
    for (const cat of parsed.categories) {
      console.log(`\n   ${cat.categoryName}:`);
      console.log(`      Points: ${cat.totalPointsEarned} / ${cat.totalMaxPoints}`);
      console.log(`      Items extracted: ${cat.items.length}`);

      // Show first 3 items as sample
      console.log(`      Sample items:`);
      for (const item of cat.items.slice(0, 3)) {
        console.log(`         ${item.itemNumber}) ${item.criteriaText.substring(0, 50)}...`);
        console.log(`            Max: ${item.maxPoints}, Earned: ${item.pointsEarned}, Charts: ${item.chartsMet}/${item.sampleSize}`);
      }
      if (cat.items.length > 3) {
        console.log(`         ... and ${cat.items.length - 3} more items`);
      }
    }

    // Data quality checks
    console.log('\n⚠️  DATA QUALITY CHECKS:');

    const issues = [];

    if (!parsed.facilityName) issues.push('Missing facility name');
    if (!parsed.month) issues.push('Missing month');
    if (!parsed.year) issues.push('Missing year');
    if (parsed.categories.length < 4) issues.push(`Only ${parsed.categories.length} of 4 categories found`);

    for (const cat of parsed.categories) {
      if (cat.items.length === 0) {
        issues.push(`${cat.categoryName}: No items extracted`);
      }
      // Check if any items have 0 max points
      const zeroMaxItems = cat.items.filter(i => !i.maxPoints || i.maxPoints === 0);
      if (zeroMaxItems.length > 0) {
        issues.push(`${cat.categoryName}: ${zeroMaxItems.length} items with 0 max points`);
      }
      // Check for items with points > max
      const overMaxItems = cat.items.filter(i => i.pointsEarned > i.maxPoints);
      if (overMaxItems.length > 0) {
        issues.push(`${cat.categoryName}: ${overMaxItems.length} items with points > max`);
      }
    }

    // Check if category totals match sum of items
    for (const cat of parsed.categories) {
      const itemsTotal = cat.items.reduce((sum, i) => sum + (i.pointsEarned || 0), 0);
      if (Math.abs(itemsTotal - cat.totalPointsEarned) > 1) {
        issues.push(`${cat.categoryName}: Items sum (${itemsTotal.toFixed(1)}) ≠ category total (${cat.totalPointsEarned})`);
      }
    }

    if (issues.length === 0) {
      console.log('   ✅ No issues found');
    } else {
      for (const issue of issues) {
        console.log(`   ❌ ${issue}`);
      }
    }

    // Show raw data structure
    console.log('\n📦 RAW DATA STRUCTURE:');
    console.log('   Fields available at top level:');
    console.log(`      ${Object.keys(parsed).join(', ')}`);
    console.log('   Fields available per category:');
    console.log(`      ${Object.keys(parsed.categories[0] || {}).join(', ')}`);
    console.log('   Fields available per item:');
    console.log(`      ${Object.keys(parsed.categories[0]?.items[0] || {}).join(', ')}`);

  } catch (error) {
    console.log(`\n   ❌ ERROR: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('EXTRACTION VALIDATION COMPLETE');
console.log('='.repeat(80));
