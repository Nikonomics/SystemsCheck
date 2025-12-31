import * as XLSX from 'xlsx';

/**
 * KEV Scorecard Parser (Frontend)
 *
 * Parses KEV Score Cards (Mini and Hybrid formats) for preview before upload.
 */

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

const CATEGORY_SHEETS = {
  mini: {
    'Abuse & Griev': { name: 'Abuse & Grievances', maxPoints: 150 },
    'Accidents & Incidents': { name: 'Accidents & Incidents', maxPoints: 200 },
    'Inf Prev & Cont': { name: 'Infection Prevention & Control', maxPoints: 200 },
    'Skin Integrity & Wounds': { name: 'Skin Integrity & Wounds', maxPoints: 200 },
  },
  hybrid: {
    'Abuse & Grievances': { name: 'Abuse & Grievances', maxPoints: 50 },
    'Accidents & Incidents': { name: 'Accidents & Incidents', maxPoints: 60 },
    'Infection Prevention & Control': { name: 'Infection Prevention & Control', maxPoints: 130 },
    'Skin Integrity & Wounds': { name: 'Skin Integrity & Wounds', maxPoints: 130 },
  },
};

function detectKevFormat(sheetNames) {
  if (sheetNames.includes('KEV Score Cards Cover Sheet')) {
    return 'mini';
  } else if (sheetNames.includes('Cover Sheet') && sheetNames.includes('Abuse & Grievances')) {
    return 'hybrid';
  }
  return null;
}

function extractCoverInfo(workbook, format) {
  const coverSheetName = format === 'mini' ? 'KEV Score Cards Cover Sheet' : 'Cover Sheet';
  const sheet = workbook.Sheets[coverSheetName];
  if (!sheet) return { facilityName: null, month: null, year: null, categoryScores: {} };

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let facilityName = null;
  let reviewPeriod = null;
  const categoryScores = {};

  for (let row = 0; row < Math.min(20, data.length); row++) {
    const rowData = data[row];
    if (!rowData) continue;

    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').toLowerCase();

      if (cell.includes('facility name')) {
        facilityName = String(rowData[col + 1] || '').trim();
      }

      if (cell.includes('review period')) {
        reviewPeriod = String(rowData[col + 1] || '').trim();
      }

      // Extract category scores from cover sheet table
      // Format: Quality Area | Total Possible Score | Total Met Score | Score
      // Only extract if we have valid numeric values (skip header rows)
      const maxPts = parseFloat(rowData[col + 1]);
      const metPts = parseFloat(rowData[col + 2]);
      const pct = parseFloat(rowData[col + 3]);

      if (!isNaN(maxPts) && !isNaN(metPts) && maxPts > 0) {
        if (cell.includes('abuse') && cell.includes('grievance') && !categoryScores['Abuse & Grievances']) {
          categoryScores['Abuse & Grievances'] = {
            maxPoints: maxPts,
            metScore: metPts,
            percentage: pct || 0,
          };
        }
        if (cell.includes('accident') && cell.includes('incident') && !categoryScores['Accidents & Incidents']) {
          categoryScores['Accidents & Incidents'] = {
            maxPoints: maxPts,
            metScore: metPts,
            percentage: pct || 0,
          };
        }
        if (cell.includes('infection') && cell.includes('prevention') && !categoryScores['Infection Prevention & Control']) {
          categoryScores['Infection Prevention & Control'] = {
            maxPoints: maxPts,
            metScore: metPts,
            percentage: pct || 0,
          };
        }
        if (cell.includes('skin') && cell.includes('integrity') && !categoryScores['Skin Integrity & Wounds']) {
          categoryScores['Skin Integrity & Wounds'] = {
            maxPoints: maxPts,
            metScore: metPts,
            percentage: pct || 0,
          };
        }
        if (cell.includes('total') && cell.includes('quality') && cell.includes('review') && !categoryScores['Total']) {
          categoryScores['Total'] = {
            maxPoints: maxPts,
            metScore: metPts,
            percentage: pct || 0,
          };
        }
      }
    }
  }

  let month = null;
  let year = null;

  if (reviewPeriod) {
    const lower = reviewPeriod.toLowerCase();

    for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
      if (lower.includes(monthName)) {
        month = monthNum;
        break;
      }
    }

    const yearMatch = reviewPeriod.match(/20\d{2}/);
    if (yearMatch) {
      year = parseInt(yearMatch[0]);
    }
  }

  return { facilityName, month, year, reviewPeriod, categoryScores };
}

function parseScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).trim().toLowerCase();
  if (str === 'n/a' || str === 'na' || str === '-') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseCategorySheet(sheet, categoryName) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const items = [];

  let maxScoreCol = -1;
  let scoreStartCol = -1;

  for (let row = 0; row < Math.min(15, data.length); row++) {
    const rowData = data[row];
    if (!rowData) continue;

    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').toLowerCase();
      if (cell.includes('max score')) {
        maxScoreCol = col;
        scoreStartCol = col + 1;
        break;
      }
    }
    if (maxScoreCol >= 0) break;
  }

  if (maxScoreCol < 0) {
    maxScoreCol = 4;
    scoreStartCol = 5;
  }

  for (let row = 0; row < data.length; row++) {
    const rowData = data[row];
    if (!rowData || rowData.length < maxScoreCol + 1) continue;

    const firstCell = String(rowData[0] || '').trim();
    const itemMatch = firstCell.match(/^(\d+)\)/);

    if (itemMatch) {
      const itemNumber = itemMatch[1];
      const criteriaText = firstCell.replace(/^\d+\)\s*/, '').trim();
      const maxPoints = parseScore(rowData[maxScoreCol]);

      if (maxPoints === null || maxPoints === 0) continue;

      const scores = [];
      for (let col = scoreStartCol; col < rowData.length && col < scoreStartCol + 5; col++) {
        const score = parseScore(rowData[col]);
        if (score !== null) {
          scores.push(score);
        }
      }

      let pointsEarned = 0;
      let chartsMet = 0;
      let sampleSize = 0;

      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        pointsEarned = (avgScore / 4) * maxPoints;
        chartsMet = Math.round(avgScore * scores.length);
        sampleSize = scores.length * 4;
      }

      items.push({
        itemNumber,
        criteriaText: criteriaText.substring(0, 200),
        maxPoints,
        chartsMet,
        sampleSize,
        pointsEarned: Math.round(pointsEarned * 100) / 100,
        rawScores: scores,
        notes: '',
      });
    }
  }

  return {
    categoryName,
    items,
    totalPointsEarned: items.reduce((sum, item) => sum + item.pointsEarned, 0),
    totalMaxPoints: items.reduce((sum, item) => sum + item.maxPoints, 0),
  };
}

/**
 * Check if a file is KEV format
 */
export function isKevFormat(sheetNames) {
  return detectKevFormat(sheetNames) !== null;
}

/**
 * Parse a KEV scorecard Excel file
 */
export async function parseKevFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const format = detectKevFormat(workbook.SheetNames);
        if (!format) {
          reject(new Error('Not a recognized KEV scorecard format'));
          return;
        }

        const coverInfo = extractCoverInfo(workbook, format);
        const facilityName = options.facilityName || coverInfo.facilityName;
        const month = options.month || coverInfo.month;
        const year = options.year || coverInfo.year;

        const categoryMappings = CATEGORY_SHEETS[format];
        const categories = [];

        for (const [sheetName, config] of Object.entries(categoryMappings)) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;

          const categoryData = parseCategorySheet(sheet, config.name);

          // Use cover sheet scores if available (more accurate than parsing items)
          const coverScore = coverInfo.categoryScores[config.name];
          if (coverScore && coverScore.metScore > 0) {
            categoryData.totalPointsEarned = coverScore.metScore;
            categoryData.totalMaxPoints = coverScore.maxPoints;
            categoryData.percentage = coverScore.percentage;
          }

          categories.push(categoryData);
        }

        // Use cover sheet total if available, otherwise calculate
        let totalScore, totalMaxPoints, scorePercentage;

        if (coverInfo.categoryScores['Total'] && coverInfo.categoryScores['Total'].metScore > 0) {
          totalScore = coverInfo.categoryScores['Total'].metScore;
          totalMaxPoints = coverInfo.categoryScores['Total'].maxPoints;
          scorePercentage = Math.round(coverInfo.categoryScores['Total'].percentage * 100);
        } else {
          totalScore = categories.reduce((sum, cat) => sum + cat.totalPointsEarned, 0);
          totalMaxPoints = categories.reduce((sum, cat) => sum + cat.totalMaxPoints, 0) || (format === 'mini' ? 750 : 370);
          scorePercentage = Math.round((totalScore / totalMaxPoints) * 100);
        }

        resolve({
          format: 'kev',
          kevType: format,
          facilityName,
          month,
          year,
          reviewPeriod: coverInfo.reviewPeriod,
          categories,
          totalScore: Math.round(totalScore * 100) / 100,
          totalMaxPoints,
          scorePercentage,
          sheetNames: workbook.SheetNames,
          filename: file.name,
        });
      } catch (error) {
        reject(new Error(`Failed to parse KEV file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate KEV parsed data
 */
export function validateKevData(parsed) {
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

  if (parsed.categories.length < 4) {
    warnings.push(`Only ${parsed.categories.length} of 4 categories found`);
  }

  for (const category of parsed.categories) {
    if (category.items.length === 0) {
      warnings.push(`Category "${category.categoryName}" has no scored items`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export { MONTH_MAP };
