/**
 * KEV Cover Sheet Parser (Simplified)
 *
 * Extracts only cover sheet data through row 15:
 * - Facility Name
 * - Review Period
 * - Date of Completion
 * - Audit Completed By
 * - Quality Areas table (category, possible, met, percentage)
 * - Total Quality Review Score
 * - Overall Score
 */

const XLSX = require('xlsx');
const { extractDate, inferMissingYear } = require('./dateExtractor');

// Quality area names to look for
const QUALITY_AREAS = [
  'Abuse & Grievances',
  'Accidents & Incidents',
  'Infection Prevention & Control',
  'Skin Integrity & Wounds'
];

/**
 * Detect KEV format from workbook
 * @param {Object} workbook - XLSX workbook
 * @returns {string|null} - 'KEV Mini', 'KEV Hybrid', or null
 */
function detectKevFormat(workbook) {
  const sheets = workbook.SheetNames;

  if (sheets.includes('KEV Score Cards Cover Sheet')) {
    return 'KEV Mini';
  }

  if (sheets.includes('Cover Sheet') && sheets.includes('Abuse & Grievances')) {
    return 'KEV Hybrid';
  }

  return null;
}

/**
 * Parse a numeric value from cell, handling various formats
 * @param {*} value - Cell value
 * @returns {number|null}
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;

  const str = String(value).trim();
  // Remove % sign and parse
  const cleaned = str.replace(/%/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extract cover sheet data from KEV Hybrid format
 * @param {Object} sheet - XLSX sheet
 * @param {string} filename - Original filename
 * @returns {Object}
 */
function parseHybridCoverSheet(sheet, filename) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const result = {
    format: 'KEV Hybrid',
    facilityName: null,
    reviewPeriod: null,
    dateOfCompletion: null,
    auditCompletedBy: null,
    qualityAreas: [],
    totalPossible: null,
    totalMet: null,
    totalPercentage: null,
    overallScore: null,
    month: null,
    year: null,
    dateSource: null
  };

  // Parse through first 20 rows to find all fields
  for (let row = 0; row < Math.min(20, data.length); row++) {
    const rowData = data[row];
    if (!rowData || rowData.length === 0) continue;

    // Check each cell for label patterns
    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').trim();
      const cellLower = cell.toLowerCase();
      const nextCell = rowData[col + 1];

      // Facility Name
      if (cellLower.includes('facility') && !result.facilityName) {
        if (nextCell) {
          result.facilityName = String(nextCell).trim();
        }
      }

      // Review Period
      if (cellLower.includes('review period') && !result.reviewPeriod) {
        if (nextCell) {
          result.reviewPeriod = String(nextCell).trim();
        }
      }

      // Date of Completion
      if (cellLower.includes('date of completion') && !result.dateOfCompletion) {
        if (nextCell) {
          // Handle Excel date serial numbers
          if (typeof nextCell === 'number' && nextCell > 40000) {
            const date = XLSX.SSF.parse_date_code(nextCell);
            result.dateOfCompletion = `${date.m}/${date.d}/${date.y}`;
          } else {
            result.dateOfCompletion = String(nextCell).trim();
          }
        }
      }

      // Audit Completed By
      if ((cellLower.includes('audit completed by') || cellLower.includes('completed by')) && !result.auditCompletedBy) {
        if (nextCell) {
          result.auditCompletedBy = String(nextCell).trim();
        }
      }

      // Quality Areas table rows
      for (const area of QUALITY_AREAS) {
        if (cellLower === area.toLowerCase()) {
          // Found a quality area row
          // Format: Category | Possible | Met | %
          const possible = parseNumber(rowData[col + 1]);
          const met = parseNumber(rowData[col + 2]);
          const percentage = parseNumber(rowData[col + 3]);

          if (possible !== null) {
            result.qualityAreas.push({
              category: area,
              possibleScore: possible,
              metScore: met,
              percentage: percentage
            });
          }
          break;
        }
      }

      // Total Quality Review Score
      if (cellLower.includes('total quality review') || cellLower.includes('total score')) {
        const possible = parseNumber(rowData[col + 1]);
        const met = parseNumber(rowData[col + 2]);
        const percentage = parseNumber(rowData[col + 3]);

        if (possible !== null && result.totalPossible === null) {
          result.totalPossible = possible;
          result.totalMet = met;
          result.totalPercentage = percentage;
        }
      }

      // Overall Score (usually just a percentage)
      if (cellLower.includes('overall score') && result.overallScore === null) {
        // Could be in same cell as percentage or next cell
        const pct = parseNumber(rowData[col + 1]) || parseNumber(rowData[col + 2]);
        if (pct !== null) {
          result.overallScore = pct;
        }
      }
    }
  }

  // Extract date from review period or filename
  const dateResult = extractDate(result.reviewPeriod || filename);
  result.month = dateResult.month;
  result.year = dateResult.year;
  result.dateSource = result.reviewPeriod ? 'reviewPeriod' : 'filename';

  // Infer year if missing
  if (result.month && !result.year) {
    const inferred = inferMissingYear(result.month, null);
    result.year = inferred.year;
    result.dateSource = 'inferred';
  }

  return result;
}

/**
 * Extract cover sheet data from KEV Mini format
 * @param {Object} sheet - XLSX sheet
 * @param {string} filename - Original filename
 * @returns {Object}
 */
function parseMiniCoverSheet(sheet, filename) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const result = {
    format: 'KEV Mini',
    facilityName: null,
    reviewPeriod: null,
    dateOfCompletion: null,
    auditCompletedBy: null,
    qualityAreas: [],
    totalPossible: null,
    totalMet: null,
    totalPercentage: null,
    overallScore: null,
    month: null,
    year: null,
    dateSource: null
  };

  // KEV Mini has a slightly different structure
  // Parse through first 25 rows
  for (let row = 0; row < Math.min(25, data.length); row++) {
    const rowData = data[row];
    if (!rowData || rowData.length === 0) continue;

    for (let col = 0; col < rowData.length; col++) {
      const cell = String(rowData[col] || '').trim();
      const cellLower = cell.toLowerCase();
      const nextCell = rowData[col + 1];

      // Facility Name
      if (cellLower.includes('facility') && !result.facilityName) {
        if (nextCell) {
          result.facilityName = String(nextCell).trim();
        }
      }

      // Review Period / Month
      if ((cellLower.includes('review period') || cellLower.includes('month:') || cellLower === 'month') && !result.reviewPeriod) {
        if (nextCell) {
          result.reviewPeriod = String(nextCell).trim();
        }
      }

      // Date of Completion
      if (cellLower.includes('date of completion') && !result.dateOfCompletion) {
        if (nextCell) {
          if (typeof nextCell === 'number' && nextCell > 40000) {
            const date = XLSX.SSF.parse_date_code(nextCell);
            result.dateOfCompletion = `${date.m}/${date.d}/${date.y}`;
          } else {
            result.dateOfCompletion = String(nextCell).trim();
          }
        }
      }

      // Audit Completed By
      if ((cellLower.includes('audit completed by') || cellLower.includes('completed by')) && !result.auditCompletedBy) {
        if (nextCell) {
          result.auditCompletedBy = String(nextCell).trim();
        }
      }

      // Quality Areas - Mini format may have different column layout
      for (const area of QUALITY_AREAS) {
        if (cellLower === area.toLowerCase()) {
          // Try different column patterns
          let possible = null, met = null, percentage = null;

          // Pattern 1: Category | Possible | Met | %
          possible = parseNumber(rowData[col + 1]);
          met = parseNumber(rowData[col + 2]);
          percentage = parseNumber(rowData[col + 3]);

          // Pattern 2: May have gaps
          if (possible === null) {
            // Scan remaining cells in row
            const remaining = rowData.slice(col + 1).filter(c => parseNumber(c) !== null);
            if (remaining.length >= 2) {
              possible = parseNumber(remaining[0]);
              met = parseNumber(remaining[1]);
              percentage = remaining.length > 2 ? parseNumber(remaining[2]) : null;
            }
          }

          if (possible !== null) {
            result.qualityAreas.push({
              category: area,
              possibleScore: possible,
              metScore: met,
              percentage: percentage
            });
          }
          break;
        }
      }

      // Total row
      if (cellLower.includes('total') && !cellLower.includes('overall')) {
        const remaining = rowData.slice(col + 1).filter(c => parseNumber(c) !== null);
        if (remaining.length >= 2 && result.totalPossible === null) {
          result.totalPossible = parseNumber(remaining[0]);
          result.totalMet = parseNumber(remaining[1]);
          result.totalPercentage = remaining.length > 2 ? parseNumber(remaining[2]) : null;
        }
      }

      // Overall Score
      if (cellLower.includes('overall') && result.overallScore === null) {
        const pct = parseNumber(rowData[col + 1]) || parseNumber(rowData[col + 2]);
        if (pct !== null) {
          result.overallScore = pct;
        }
      }
    }
  }

  // Extract date
  const dateResult = extractDate(result.reviewPeriod || filename);
  result.month = dateResult.month;
  result.year = dateResult.year;
  result.dateSource = result.reviewPeriod ? 'reviewPeriod' : 'filename';

  if (result.month && !result.year) {
    const inferred = inferMissingYear(result.month, null);
    result.year = inferred.year;
    result.dateSource = 'inferred';
  }

  return result;
}

/**
 * Parse KEV cover sheet from file buffer
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @returns {Object}
 */
function parseKevCoverSheet(buffer, filename) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const format = detectKevFormat(workbook);

  if (!format) {
    return {
      success: false,
      error: 'Not a recognized KEV format',
      format: null
    };
  }

  let coverSheet;
  if (format === 'KEV Mini') {
    coverSheet = workbook.Sheets['KEV Score Cards Cover Sheet'];
  } else {
    coverSheet = workbook.Sheets['Cover Sheet'];
  }

  if (!coverSheet) {
    return {
      success: false,
      error: 'Cover sheet not found',
      format
    };
  }

  try {
    let result;
    if (format === 'KEV Mini') {
      result = parseMiniCoverSheet(coverSheet, filename);
    } else {
      result = parseHybridCoverSheet(coverSheet, filename);
    }

    // Normalize percentages (Excel stores them as decimals like 0.78 for 78%)
    // Convert to whole percentages if they're less than 1
    for (const area of result.qualityAreas) {
      if (area.percentage !== null && area.percentage > 0 && area.percentage < 1) {
        area.percentage = Math.round(area.percentage * 100 * 100) / 100;
      }
    }

    if (result.totalPercentage !== null && result.totalPercentage > 0 && result.totalPercentage < 1) {
      result.totalPercentage = Math.round(result.totalPercentage * 100 * 100) / 100;
    }

    if (result.overallScore !== null && result.overallScore > 0 && result.overallScore < 1) {
      result.overallScore = Math.round(result.overallScore * 100 * 100) / 100;
    }

    // Calculate overall score if not found but we have totals
    if (result.overallScore === null && result.totalPossible && result.totalMet) {
      result.overallScore = Math.round((result.totalMet / result.totalPossible) * 100 * 100) / 100;
    }

    // Calculate percentage if missing
    if (result.totalPercentage === null && result.totalPossible && result.totalMet) {
      result.totalPercentage = Math.round((result.totalMet / result.totalPossible) * 100 * 100) / 100;
    }

    return {
      success: true,
      ...result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      format
    };
  }
}

/**
 * Validate extracted data
 * @param {Object} data - Parsed cover sheet data
 * @returns {Object} - { isValid, errors, warnings }
 */
function validateCoverSheetData(data) {
  const errors = [];
  const warnings = [];

  if (!data.facilityName) {
    errors.push('Missing facility name');
  }

  if (!data.month) {
    errors.push('Could not extract month');
  }

  if (!data.year) {
    warnings.push('Could not extract year - will need manual entry');
  }

  if (data.qualityAreas.length === 0) {
    errors.push('No quality area scores found');
  } else if (data.qualityAreas.length < 4) {
    warnings.push(`Only ${data.qualityAreas.length} of 4 quality areas found`);
  }

  if (data.totalPossible === null) {
    warnings.push('Total possible score not found');
  }

  if (data.totalMet === null) {
    warnings.push('Total met score not found');
  }

  // Validate score ranges
  for (const area of data.qualityAreas) {
    if (area.metScore > area.possibleScore) {
      errors.push(`${area.category}: met score (${area.metScore}) > possible (${area.possibleScore})`);
    }
  }

  if (data.totalMet > data.totalPossible) {
    errors.push(`Total met (${data.totalMet}) > total possible (${data.totalPossible})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  parseKevCoverSheet,
  validateCoverSheetData,
  detectKevFormat
};
