const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function classifyFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets = workbook.SheetNames;
    if (sheets.includes('KEV Score Cards Cover Sheet')) return 'KEV Mini';
    if (sheets.includes('Cover Sheet') && sheets.includes('Abuse & Grievances')) return 'KEV Hybrid';
    if (sheets.includes('Clinical Systems Overview') || sheets.some(s => s.includes('1. Change of Condition'))) return 'SNF';
    return 'Unknown';
  } catch (e) { return 'Error'; }
}

const northernDir = '/Users/nikolashulewsky/Desktop/Score Cards/Northern';
const facilities = {};

function scan(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      scan(fullPath);
    } else if (/\.(xlsx|xlsm)$/i.test(item.name) && !item.name.startsWith('~')) {
      // Get facility from folder name
      const parts = dir.replace(northernDir, '').split(path.sep).filter(Boolean);
      const facility = parts[0] || 'Root';

      if (!facilities[facility]) {
        facilities[facility] = { 'SNF': 0, 'KEV Hybrid': 0, 'KEV Mini': 0, 'Unknown': 0 };
      }

      const format = classifyFile(fullPath);
      facilities[facility][format]++;
    }
  }
}

scan(northernDir);

console.log('=== NORTHERN FACILITIES BY FORMAT ===\n');
console.log('Facility'.padEnd(35) + '| SNF  | Hybrid | Mini | Unk');
console.log('-'.repeat(65));

for (const [facility, formats] of Object.entries(facilities).sort()) {
  console.log(
    facility.substring(0, 34).padEnd(35) + '| ' +
    String(formats['SNF']).padEnd(4) + ' | ' +
    String(formats['KEV Hybrid']).padEnd(6) + ' | ' +
    String(formats['KEV Mini']).padEnd(4) + ' | ' +
    formats['Unknown']
  );
}
