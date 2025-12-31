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

            for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
              if (nextCell.includes(monthName)) {
                month = monthNum;
                break;
              }
            }

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
          ...dateInfo
        });
      }
    }
  } catch (e) {}
}

scanDir('/Users/nikolashulewsky/Desktop/Score Cards');

// Find all SNF files
const snfFiles = results.filter(r => r.format === 'SNF');

console.log(`=== ALL SNF FILES (${snfFiles.length} total) ===\n`);

const snfWithDate = snfFiles.filter(r => r.month && r.year);
const snfNoDate = snfFiles.filter(r => !r.month || !r.year);

console.log(`SNF with dates: ${snfWithDate.length}`);
console.log(`SNF without dates: ${snfNoDate.length}\n`);

console.log('=== SNF FILES WITHOUT DATES ===\n');
for (const f of snfNoDate) {
  console.log(`File: ${f.file}`);
  console.log(`  Month: ${f.month}, Year: ${f.year}`);
  console.log(`  Path: ${f.path}\n`);
}

console.log('\n=== SNF FILES WITH DATES ===\n');
for (const f of snfWithDate) {
  console.log(`${f.year}-${String(f.month).padStart(2, '0')}: ${f.file}`);
}

// Also check files with no dates by format
console.log('\n=== ALL FILES WITHOUT DATES BY FORMAT ===\n');
const noDateFiles = results.filter(r => !r.month || !r.year);
const byFormat = {};
for (const f of noDateFiles) {
  byFormat[f.format] = (byFormat[f.format] || 0) + 1;
}
for (const [format, count] of Object.entries(byFormat)) {
  console.log(`${format}: ${count} files without dates`);
}
