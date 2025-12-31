import * as XLSX from 'xlsx';

/**
 * Excel Full Parser for Historical Scorecard Import
 *
 * Parses multi-sheet Excel files containing full item-level clinical audit data.
 * Each system has its own sheet with item-level details (chartsMet, sampleSize, notes).
 */

// Sheet name patterns for each system
const SYSTEM_SHEET_PATTERNS = {
  1: ['change of condition', '1.', 'system 1'],
  2: ['accidents', 'falls', 'incidents', '2.', 'system 2'],
  3: ['skin', '3.', 'system 3'],
  4: ['med', 'medication', 'weight', '4.', 'system 4'],
  5: ['infection', '5.', 'system 5'],
  6: ['transfer', 'discharge', '6.', 'system 6'],
  7: ['abuse', 'grievance', 'self-report', '7.', 'system 7'],
};

// Month name mapping
const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

// System names for display
const SYSTEM_NAMES = {
  1: 'Change of Condition',
  2: 'Accidents, Falls, Incidents',
  3: 'Skin',
  4: 'Med Management & Weight Loss',
  5: 'Infection Control',
  6: 'Transfer/Discharge',
  7: 'Abuse/Self Report/Grievance Review',
};

/**
 * Normalize text for comparison
 */
function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Find system sheet by patterns
 */
function findSystemSheet(sheetNames, systemNumber) {
  const patterns = SYSTEM_SHEET_PATTERNS[systemNumber];
  if (!patterns) return null;

  for (const sheetName of sheetNames) {
    const lowerName = sheetName.toLowerCase();
    for (const pattern of patterns) {
      if (lowerName.includes(pattern)) {
        return sheetName;
      }
    }
  }
  return null;
}

/**
 * Extract facility name from overview sheet
 */
function extractFacilityName(workbook) {
  const overviewNames = ['Clinical Systems Overview', 'Overview', 'Summary', 'Cover'];

  for (const name of overviewNames) {
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });
      for (let row = 0; row < Math.min(10, data.length); row++) {
        const rowData = data[row];
        if (!rowData) continue;

        for (let col = 0; col < rowData.length; col++) {
          const cell = String(rowData[col] || '').toLowerCase();
          if (cell.includes('facility') && cell.includes('name')) {
            const nextCell = rowData[col + 1];
            if (nextCell && typeof nextCell === 'string' && nextCell.trim()) {
              return nextCell.trim();
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Extract month from sheet
 */
function extractMonth(sheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });

  for (let row = 0; row < Math.min(5, data.length); row++) {
    const rowData = data[row];
    if (!rowData) continue;

    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').toLowerCase();

      if (cell.includes('month')) {
        const monthCell = String(rowData[col + 1] || '').toLowerCase().trim();
        if (monthCell) {
          const month = MONTH_MAP[monthCell] || MONTH_MAP[monthCell.slice(0, 3)];
          if (month) return month;
        }
      }
    }
  }

  return null;
}

/**
 * Parse a single system sheet
 */
function parseSystemSheet(sheet, systemNumber) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const items = [];

  // Find header row
  let headerRow = -1;
  let colMap = {};

  for (let row = 0; row < Math.min(10, data.length); row++) {
    const rowData = data[row];
    if (!rowData) continue;

    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').toLowerCase();
      if (cell.includes('category') || (cell.includes('max') && cell.includes('point'))) {
        headerRow = row;
        for (let c = 0; c < rowData.length; c++) {
          const header = String(rowData[c] || '').toLowerCase();
          if (header.includes('category')) colMap.category = c;
          else if (header.includes('max') && header.includes('point')) colMap.maxPoints = c;
          else if (header.includes('met') || header === '# met') colMap.chartsMet = c;
          else if (header.includes('sample')) colMap.sampleSize = c;
          else if (header.includes('point') && !header.includes('max')) colMap.points = c;
          else if (header.includes('note')) colMap.notes = c;
        }
        break;
      }
    }
    if (headerRow >= 0) break;
  }

  if (headerRow < 0) {
    colMap = { category: 0, maxPoints: 1, chartsMet: 2, sampleSize: 3, points: 4, notes: 5 };
    headerRow = 2;
  }

  let itemIndex = 0;

  for (let row = headerRow + 1; row < data.length; row++) {
    const rowData = data[row];
    if (!rowData || rowData.length < 3) continue;

    const category = String(rowData[colMap.category] || '').trim();
    const maxPointsRaw = rowData[colMap.maxPoints];
    const chartsMetRaw = rowData[colMap.chartsMet];
    const sampleSizeRaw = String(rowData[colMap.sampleSize] || '');
    const pointsRaw = rowData[colMap.points];
    const notes = String(rowData[colMap.notes] || '').trim();

    if (!category) continue;
    const maxPoints = parseFloat(maxPointsRaw);
    if (isNaN(maxPoints) || maxPoints === 0) continue;

    const isBinary =
      sampleSizeRaw.toLowerCase().includes('y=1') ||
      sampleSizeRaw.toLowerCase().includes('n=0') ||
      (sampleSizeRaw === '1' && maxPoints >= 5);

    let chartsMet = 0;
    let sampleSize = 1;

    if (isBinary) {
      chartsMet =
        chartsMetRaw === 1 ||
        chartsMetRaw === '1' ||
        String(chartsMetRaw).toLowerCase() === 'y' ||
        String(chartsMetRaw).toLowerCase() === 'yes'
          ? 1
          : 0;
      sampleSize = 1;
    } else {
      chartsMet = parseInt(chartsMetRaw) || 0;
      sampleSize = parseInt(sampleSizeRaw) || 3;
    }

    const pointsEarned = sampleSize > 0 ? (maxPoints / sampleSize) * chartsMet : 0;

    items.push({
      itemNumber: String(itemIndex + 1),
      criteriaText: category,
      maxPoints,
      chartsMet,
      sampleSize,
      pointsEarned: Math.round(pointsEarned * 100) / 100,
      notes,
    });

    itemIndex++;
  }

  return {
    systemNumber,
    systemName: SYSTEM_NAMES[systemNumber],
    items,
    totalPointsEarned: items.reduce((sum, item) => sum + item.pointsEarned, 0),
  };
}

/**
 * Parse a complete Excel file containing full scorecard data
 * @param {File} file - The Excel file to parse
 * @param {Object} options - Optional overrides for facility/date
 * @returns {Promise<Object>} Parsed scorecard data
 */
export async function parseExcelFullFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        let facilityName = options.facilityName || extractFacilityName(workbook);
        let month = options.month;
        let year = options.year;

        const systems = [];
        let firstMonthFound = null;

        for (let sysNum = 1; sysNum <= 7; sysNum++) {
          const sheetName = findSystemSheet(workbook.SheetNames, sysNum);
          if (!sheetName) {
            console.warn(`Sheet for system ${sysNum} not found`);
            continue;
          }

          const sheet = workbook.Sheets[sheetName];

          if (!month && !firstMonthFound) {
            const extracted = extractMonth(sheet);
            if (extracted) {
              firstMonthFound = extracted;
            }
          }

          const systemData = parseSystemSheet(sheet, sysNum);
          if (systemData) {
            systems.push(systemData);
          }
        }

        if (!month && firstMonthFound) {
          month = firstMonthFound;
        }

        const totalScore = systems.reduce((sum, sys) => sum + sys.totalPointsEarned, 0);

        resolve({
          facilityName,
          month,
          year,
          systems,
          totalScore: Math.round(totalScore * 100) / 100,
          sheetNames: workbook.SheetNames,
          filename: file.name,
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse multiple Excel files
 * @param {FileList|File[]} files - The files to parse
 * @param {Object} options - Optional overrides
 * @returns {Promise<Array>} Array of parsed results
 */
export async function parseMultipleFiles(files, options = {}) {
  const results = [];

  for (const file of files) {
    try {
      const parsed = await parseExcelFullFile(file, options);
      results.push({ ...parsed, status: 'success' });
    } catch (error) {
      results.push({
        filename: file.name,
        status: 'error',
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Validate parsed data against expected format
 * @param {Object} parsed - Parsed scorecard data
 * @returns {Object} Validation result
 */
export function validateParsedData(parsed) {
  const errors = [];
  const warnings = [];

  if (!parsed.facilityName) {
    errors.push('Facility name not found in file');
  }

  if (!parsed.month || parsed.month < 1 || parsed.month > 12) {
    errors.push(`Invalid or missing month: ${parsed.month}`);
  }

  if (!parsed.year) {
    warnings.push('Year not found - will need to be specified');
  }

  if (parsed.systems.length < 7) {
    warnings.push(`Only ${parsed.systems.length} of 7 systems found`);
  }

  // Expected item counts per system
  const expectedCounts = { 1: 8, 2: 15, 3: 8, 4: 16, 5: 10, 6: 10, 7: 8 };

  for (const system of parsed.systems) {
    const expected = expectedCounts[system.systemNumber] || 10;
    if (Math.abs(system.items.length - expected) > 2) {
      warnings.push(
        `System ${system.systemNumber}: Found ${system.items.length} items, expected ~${expected}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export { SYSTEM_NAMES, MONTH_MAP };
