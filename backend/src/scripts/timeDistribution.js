const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const MONTH_MAP = {
  'jan': 1, 'january': 1,
  'feb': 2, 'february': 2,
  'mar': 3, 'march': 3,
  'apr': 4, 'april': 4,
  'may': 5,
  'jun': 6, 'june': 6,
  'jul': 7, 'july': 7,
  'aug': 8, 'august': 8,
  'sep': 9, 'sept': 9, 'september': 9,
  'oct': 10, 'october': 10,
  'nov': 11, 'november': 11,
  'dec': 12, 'december': 12
};

function getCompany(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes("columbia") || lower.includes("vincero")) return "Columbia Vincero";
  if (lower.includes("envision")) return "Envision";
  if (lower.includes("northern")) return "Northern";
  if (lower.includes("olympus")) return "Olympus";
  if (lower.includes("three rivers") || lower.includes("three_rivers")) return "Three Rivers";
  return "Unknown";
}

function classifyFile(workbook) {
  const sheets = workbook.SheetNames;
  if (sheets.includes('KEV Score Cards Cover Sheet')) return 'KEV Mini';
  if (sheets.includes('Cover Sheet') && sheets.includes('Abuse & Grievances')) return 'KEV Hybrid';
  if (sheets.includes('Clinical Systems Overview') || sheets.some(s => s.includes('1. Change of Condition'))) return 'SNF';
  return 'Unknown';
}

function extractDateFromFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const format = classifyFile(workbook);

    let month = null;
    let year = null;

    // Try to get from cover sheet first
    let coverSheet = null;
    if (format === 'KEV Mini') {
      coverSheet = workbook.Sheets['KEV Score Cards Cover Sheet'];
    } else if (format === 'KEV Hybrid') {
      coverSheet = workbook.Sheets['Cover Sheet'];
    } else if (format === 'SNF') {
      coverSheet = workbook.Sheets['Clinical Systems Overview'];
    }

    if (coverSheet) {
      const data = XLSX.utils.sheet_to_json(coverSheet, { header: 1 });

      for (let row = 0; row < Math.min(20, data.length); row++) {
        const rowData = data[row];
        if (!rowData) continue;

        for (let col = 0; col < rowData.length; col++) {
          const cell = String(rowData[col] || '').toLowerCase();

          if (cell.includes('review period') || cell.includes('month')) {
            const nextCell = String(rowData[col + 1] || '').toLowerCase();

            // Try to find month
            for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
              if (nextCell.includes(monthName)) {
                month = monthNum;
                break;
              }
            }

            // Try to find year
            const yearMatch = nextCell.match(/20\d{2}/);
            if (yearMatch) {
              year = parseInt(yearMatch[0]);
            }
          }
        }
      }
    }

    // Fallback: try to extract from filename
    if (!month || !year) {
      const filename = path.basename(filePath).toLowerCase();

      for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
        if (filename.includes(monthName)) {
          month = month || monthNum;
          break;
        }
      }

      const yearMatch = filename.match(/20\d{2}/);
      if (yearMatch) {
        year = year || parseInt(yearMatch[0]);
      }
    }

    return { month, year, format };
  } catch (e) {
    return { month: null, year: null, format: 'Error' };
  }
}

// Scan all files
const results = [];

function scanDir(dir) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(xlsx|xlsm)$/i.test(item.name) && !item.name.startsWith('~')) {
        const dateInfo = extractDateFromFile(fullPath);
        results.push({
          file: item.name,
          path: fullPath,
          company: getCompany(fullPath),
          ...dateInfo
        });
      }
    }
  } catch (e) {}
}

scanDir('/Users/nikolashulewsky/Desktop/Score Cards');

// Group by year-month
const byYearMonth = {};
const byCompanyYearMonth = {};

for (const r of results) {
  if (r.year && r.month) {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    byYearMonth[key] = (byYearMonth[key] || 0) + 1;

    if (!byCompanyYearMonth[r.company]) {
      byCompanyYearMonth[r.company] = {};
    }
    byCompanyYearMonth[r.company][key] = (byCompanyYearMonth[r.company][key] || 0) + 1;
  }
}

// Sort and display
const sortedKeys = Object.keys(byYearMonth).sort();

console.log('=== SCORECARD DISTRIBUTION OVER TIME ===\n');
console.log('Month      | Count | ');
console.log('-'.repeat(50));

for (const key of sortedKeys) {
  const bar = '█'.repeat(Math.min(byYearMonth[key], 30));
  console.log(`${key}   | ${String(byYearMonth[key]).padEnd(5)} | ${bar}`);
}

// Summary stats
const years = {};
for (const r of results) {
  if (r.year) {
    years[r.year] = (years[r.year] || 0) + 1;
  }
}

console.log('\n=== BY YEAR ===\n');
for (const [year, count] of Object.entries(years).sort()) {
  console.log(`${year}: ${count} files`);
}

// No date found
const noDate = results.filter(r => !r.year || !r.month);
console.log(`\nFiles with no date extracted: ${noDate.length}`);

// By company over time
console.log('\n=== BY COMPANY OVER TIME ===\n');

const companies = ['Columbia Vincero', 'Northern', 'Olympus', 'Three Rivers'];

for (const company of companies) {
  const companyData = byCompanyYearMonth[company] || {};
  const companyKeys = Object.keys(companyData).sort();

  if (companyKeys.length === 0) continue;

  console.log(`\n${company}:`);
  console.log('-'.repeat(40));

  for (const key of companyKeys) {
    const bar = '█'.repeat(Math.min(companyData[key], 20));
    console.log(`  ${key}: ${String(companyData[key]).padEnd(3)} ${bar}`);
  }
}

// Format distribution over time
console.log('\n=== FORMAT DISTRIBUTION OVER TIME ===\n');

const byFormatYearMonth = {};
for (const r of results) {
  if (r.year && r.month && r.format !== 'Unknown' && r.format !== 'Error') {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    if (!byFormatYearMonth[key]) {
      byFormatYearMonth[key] = { 'SNF': 0, 'KEV Hybrid': 0, 'KEV Mini': 0 };
    }
    byFormatYearMonth[key][r.format] = (byFormatYearMonth[key][r.format] || 0) + 1;
  }
}

console.log('Month      | SNF | Hybrid | Mini');
console.log('-'.repeat(45));

for (const key of sortedKeys) {
  const data = byFormatYearMonth[key] || { 'SNF': 0, 'KEV Hybrid': 0, 'KEV Mini': 0 };
  console.log(`${key}   | ${String(data['SNF'] || 0).padEnd(3)} | ${String(data['KEV Hybrid'] || 0).padEnd(6)} | ${data['KEV Mini'] || 0}`);
}
