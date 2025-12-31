/**
 * Excel Parser for Historical Scorecard Import
 *
 * Parses multi-sheet Excel files containing clinical audit data
 * and maps items to the auditCriteria definitions.
 */

const XLSX = require('xlsx');
const { auditCriteria } = require('../data/auditCriteria');

// Sheet name patterns for each system
const SYSTEM_SHEET_PATTERNS = {
  1: ['change of condition', '1.', 'system 1'],
  2: ['accidents', 'falls', 'incidents', '2.', 'system 2'],
  3: ['skin', '3.', 'system 3'],
  4: ['med', 'medication', 'weight', '4.', 'system 4'],
  5: ['infection', '5.', 'system 5'],
  6: ['transfer', 'discharge', '6.', 'system 6'],
  7: ['abuse', 'grievance', 'self-report', '7.', 'system 7']
};

// Month name mapping
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
 * Calculate text similarity using Jaccard index on word sets
 */
function calculateSimilarity(text1, text2) {
  const words1 = new Set(normalizeText(text1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeText(text2).split(' ').filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find the best matching audit item for Excel row text
 */
function findBestMatch(excelText, systemNumber) {
  const system = auditCriteria.find(s => s.systemNumber === systemNumber);
  if (!system || !system.items) return { match: null, confidence: 0 };

  let bestMatch = null;
  let bestScore = 0;

  for (const item of system.items) {
    const score = calculateSimilarity(excelText, item.text);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return { match: bestMatch, confidence: bestScore };
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
  // Try common overview sheet names
  const overviewNames = ['Clinical Systems Overview', 'Overview', 'Summary', 'Cover'];

  for (const name of overviewNames) {
    const sheet = workbook.Sheets[name];
    if (sheet) {
      // Look for facility name in first few rows
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });
      for (let row = 0; row < Math.min(10, data.length); row++) {
        const rowData = data[row];
        if (!rowData) continue;

        for (let col = 0; col < rowData.length; col++) {
          const cell = String(rowData[col] || '').toLowerCase();
          if (cell.includes('facility') && cell.includes('name')) {
            // Check next cell or cell below for the value
            const nextCell = rowData[col + 1];
            if (nextCell && typeof nextCell === 'string' && nextCell.trim()) {
              return nextCell.trim();
            }
          }
        }
      }
    }
  }

  // Fallback: try to extract from filename if passed
  return null;
}

/**
 * Extract month and year from sheet
 */
function extractMonthYear(sheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });

  // Look for "Month:" pattern in first few rows
  for (let row = 0; row < Math.min(5, data.length); row++) {
    const rowData = data[row];
    if (!rowData) continue;

    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').toLowerCase();

      // Check for "Month: XXX" pattern
      if (cell.includes('month')) {
        // Check next cell for month value
        const monthCell = String(rowData[col + 1] || '').toLowerCase().trim();
        if (monthCell) {
          const month = MONTH_MAP[monthCell] || MONTH_MAP[monthCell.slice(0, 3)];
          if (month) {
            return { month, year: null }; // Year typically from filename or separate
          }
        }
      }
    }
  }

  return { month: null, year: null };
}

/**
 * Parse a single system sheet
 */
function parseSystemSheet(sheet, systemNumber) {
  const auditSystem = auditCriteria.find(s => s.systemNumber === systemNumber);
  if (!auditSystem) return null;

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const items = [];

  // Find header row (contains "Category" or "Max Points")
  let headerRow = -1;
  let colMap = {};

  for (let row = 0; row < Math.min(10, data.length); row++) {
    const rowData = data[row];
    if (!rowData) continue;

    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').toLowerCase();
      if (cell.includes('category') || cell.includes('max') && cell.includes('point')) {
        headerRow = row;
        // Map columns
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
    // Default column layout if header not found
    colMap = { category: 0, maxPoints: 1, chartsMet: 2, sampleSize: 3, points: 4, notes: 5 };
    headerRow = 2; // Typical row after month selector
  }

  // Track position for fallback mapping
  let itemIndex = 0;

  // Parse data rows
  for (let row = headerRow + 1; row < data.length; row++) {
    const rowData = data[row];
    if (!rowData || rowData.length < 3) continue;

    const category = String(rowData[colMap.category] || '').trim();
    const maxPointsRaw = rowData[colMap.maxPoints];
    const chartsMetRaw = rowData[colMap.chartsMet];
    const sampleSizeRaw = String(rowData[colMap.sampleSize] || '');
    const pointsRaw = rowData[colMap.points];
    const notes = String(rowData[colMap.notes] || '').trim();

    // Skip empty rows and section headers (no maxPoints)
    if (!category) continue;
    const maxPoints = parseFloat(maxPointsRaw);
    if (isNaN(maxPoints) || maxPoints === 0) continue;

    // Determine if binary item
    const isBinary = sampleSizeRaw.toLowerCase().includes('y=1') ||
                     sampleSizeRaw.toLowerCase().includes('n=0') ||
                     sampleSizeRaw === '1' && maxPoints >= 5;

    // Parse values
    let chartsMet = 0;
    let sampleSize = 1;

    if (isBinary) {
      // Binary: 1 = yes/pass, 0 = no/fail
      chartsMet = (chartsMetRaw === 1 || chartsMetRaw === '1' ||
                   String(chartsMetRaw).toLowerCase() === 'y' ||
                   String(chartsMetRaw).toLowerCase() === 'yes') ? 1 : 0;
      sampleSize = 1;
    } else {
      // Sample-based
      chartsMet = parseInt(chartsMetRaw) || 0;
      sampleSize = parseInt(sampleSizeRaw) || 3;
    }

    // Calculate points
    const pointsEarned = sampleSize > 0 ? (maxPoints / sampleSize) * chartsMet : 0;

    // Try to match to audit criteria item
    const { match, confidence } = findBestMatch(category, systemNumber);

    // Use matched item number or fallback to position
    let itemNumber;
    if (match && confidence >= 0.5) {
      itemNumber = match.number;
    } else if (auditSystem.items[itemIndex]) {
      itemNumber = auditSystem.items[itemIndex].number;
    } else {
      itemNumber = String(itemIndex + 1);
    }

    items.push({
      itemNumber,
      criteriaText: category,
      maxPoints,
      chartsMet,
      sampleSize,
      pointsEarned: Math.round(pointsEarned * 100) / 100,
      notes,
      matchConfidence: confidence,
      matchedTo: match?.number || null
    });

    itemIndex++;
  }

  return {
    systemNumber,
    systemName: auditSystem.name,
    items,
    totalPointsEarned: items.reduce((sum, item) => sum + item.pointsEarned, 0)
  };
}

/**
 * Parse a complete Excel file containing scorecard data
 * @param {Buffer} buffer - The Excel file buffer
 * @param {object} options - Optional overrides for facility/date
 * @returns {object} Parsed scorecard data
 */
function parseExcelFile(buffer, options = {}) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Extract metadata
  let facilityName = options.facilityName || extractFacilityName(workbook);
  let month = options.month;
  let year = options.year;

  // Parse each system sheet
  const systems = [];
  let firstMonthFound = null;

  for (let sysNum = 1; sysNum <= 7; sysNum++) {
    const sheetName = findSystemSheet(workbook.SheetNames, sysNum);
    if (!sheetName) {
      console.warn(`Sheet for system ${sysNum} not found`);
      continue;
    }

    const sheet = workbook.Sheets[sheetName];

    // Try to get month from sheet if not provided
    if (!month && !firstMonthFound) {
      const extracted = extractMonthYear(sheet);
      if (extracted.month) {
        firstMonthFound = extracted.month;
      }
    }

    const systemData = parseSystemSheet(sheet, sysNum);
    if (systemData) {
      systems.push(systemData);
    }
  }

  // Use extracted month if not provided
  if (!month && firstMonthFound) {
    month = firstMonthFound;
  }

  // Calculate total score
  const totalScore = systems.reduce((sum, sys) => sum + sys.totalPointsEarned, 0);

  return {
    facilityName,
    month,
    year,
    systems,
    totalScore: Math.round(totalScore * 100) / 100,
    sheetNames: workbook.SheetNames
  };
}

/**
 * Validate parsed scorecard data
 * @param {object} parsed - Parsed scorecard data
 * @param {Map} facilityMap - Map of facility names to IDs
 * @returns {object} Validation result with errors and warnings
 */
function validateParsedData(parsed, facilityMap) {
  const errors = [];
  const warnings = [];

  // Facility validation
  if (!parsed.facilityName) {
    errors.push('Facility name not found in file');
  } else {
    const normalizedName = normalizeText(parsed.facilityName);
    let found = false;
    for (const [name, id] of facilityMap.entries()) {
      if (normalizeText(name) === normalizedName ||
          normalizeText(name).includes(normalizedName) ||
          normalizedName.includes(normalizeText(name))) {
        found = true;
        break;
      }
    }
    if (!found) {
      errors.push(`Facility "${parsed.facilityName}" not found in database`);
    }
  }

  // Date validation
  if (!parsed.month || parsed.month < 1 || parsed.month > 12) {
    errors.push(`Invalid or missing month: ${parsed.month}`);
  }
  if (!parsed.year || parsed.year < 2000 || parsed.year > new Date().getFullYear()) {
    warnings.push(`Year not found or invalid: ${parsed.year}. Will need to be specified.`);
  }

  // Systems validation
  if (parsed.systems.length < 7) {
    warnings.push(`Only ${parsed.systems.length} of 7 systems found`);
  }

  for (const system of parsed.systems) {
    const expectedSystem = auditCriteria.find(s => s.systemNumber === system.systemNumber);
    if (!expectedSystem) continue;

    const expectedItems = expectedSystem.items.length;
    if (system.items.length !== expectedItems) {
      warnings.push(
        `System ${system.systemNumber}: Found ${system.items.length} items, expected ${expectedItems}`
      );
    }

    // Check for low confidence matches
    const lowConfidence = system.items.filter(i => i.matchConfidence < 0.5);
    if (lowConfidence.length > 0) {
      warnings.push(
        `System ${system.systemNumber}: ${lowConfidence.length} items with low match confidence`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  parseExcelFile,
  parseSystemSheet,
  validateParsedData,
  extractFacilityName,
  extractMonthYear,
  findSystemSheet,
  normalizeText,
  calculateSimilarity,
  findBestMatch,
  MONTH_MAP
};
