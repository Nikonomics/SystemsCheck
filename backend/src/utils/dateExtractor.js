/**
 * Smart Date Extractor
 *
 * Extracts month and year from various formats found in scorecard files:
 * - "January 2025", "Jan 2025"
 * - "9.2025", "09/2025"
 * - "OCT'25", "Oct-25"
 * - "101425" (MMDDYY), "1025" (MMYY)
 * - "4th quarter 2025", "Q4 2025"
 * - "December25CDA" (month + 2-digit year in filename)
 */

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

// Quarter to month mapping (use middle month of quarter)
const QUARTER_MAP = {
  '1': 2, 'q1': 2, '1st': 2, 'first': 2,
  '2': 5, 'q2': 5, '2nd': 5, 'second': 5,
  '3': 8, 'q3': 8, '3rd': 8, 'third': 8,
  '4': 11, 'q4': 11, '4th': 11, 'fourth': 11
};

/**
 * Extract month and year from a text string
 * @param {string} text - The text to parse (filename, cell content, etc.)
 * @returns {{ month: number|null, year: number|null }}
 */
function extractDate(text) {
  if (!text) return { month: null, year: null };

  const original = text;
  const lower = String(text).toLowerCase().trim();

  let month = null;
  let year = null;

  // Strategy 1: Full 4-digit year (2024, 2025, etc.)
  const year4Match = lower.match(/20(2[0-9])/);
  if (year4Match) {
    year = parseInt('20' + year4Match[1]);
  }

  // Strategy 2: Month name (January, Jan, etc.)
  for (const [monthName, monthNum] of Object.entries(MONTH_MAP)) {
    // Match month name with word boundary or followed by numbers/special chars
    const monthRegex = new RegExp(`\\b${monthName}\\b|${monthName}(?=[^a-z]|$)`, 'i');
    if (monthRegex.test(lower)) {
      month = monthNum;
      break;
    }
  }

  // Strategy 3: Abbreviated year with month (OCT'25, Oct-25, Oct25)
  if (!year) {
    const abbrevYearMatch = lower.match(/[a-z]{3,9}['\-\s]?(2[0-9])\b/);
    if (abbrevYearMatch) {
      year = 2000 + parseInt(abbrevYearMatch[1]);
    }
  }

  // Strategy 4: Month.Year format (9.2025, 09/2025, 9-2025)
  if (!month) {
    const monthDotYearMatch = lower.match(/\b(1[0-2]|0?[1-9])[\.\/-](20[2-9][0-9])\b/);
    if (monthDotYearMatch) {
      month = parseInt(monthDotYearMatch[1]);
      year = parseInt(monthDotYearMatch[2]);
    }
  }

  // Strategy 5: MMDDYY or MMDDYYYY embedded (e.g., "101425" = 10/14/25, "10142025")
  if (!month || !year) {
    // MMDDYYYY format (8 digits)
    const mmddyyyyMatch = lower.match(/\b(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])(20[2-9][0-9])\b/);
    if (mmddyyyyMatch) {
      month = month || parseInt(mmddyyyyMatch[1]);
      year = year || parseInt(mmddyyyyMatch[3]);
    }

    // MMDDYY format (6 digits)
    const mmddyyMatch = lower.match(/\b(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])(2[0-9])\b/);
    if (mmddyyMatch) {
      month = month || parseInt(mmddyyMatch[1]);
      year = year || 2000 + parseInt(mmddyyMatch[3]);
    }
  }

  // Strategy 6: MMYY format (e.g., "1025" = Oct 2025) - only if 4 digits and valid
  if (!month || !year) {
    // With word boundary
    const mmyyMatch = lower.match(/\b(0[1-9]|1[0-2])(2[0-9])\b/);
    if (mmyyMatch) {
      const potentialMonth = parseInt(mmyyMatch[1]);
      const potentialYear = 2000 + parseInt(mmyyMatch[2]);
      month = month || potentialMonth;
      year = year || potentialYear;
    }

    // Without word boundary (e.g., "1025CDA" at start of filename)
    if (!month || !year) {
      const mmyyStartMatch = lower.match(/^(0[1-9]|1[0-2])(2[0-9])[a-z]/);
      if (mmyyStartMatch) {
        month = month || parseInt(mmyyStartMatch[1]);
        year = year || 2000 + parseInt(mmyyStartMatch[2]);
      }
    }
  }

  // Strategy 6b: MM-YY format (e.g., "10-25" = Oct 2025)
  if (!month || !year) {
    const mmDashYyMatch = lower.match(/\b(0?[1-9]|1[0-2])[\-](2[0-9])\b/);
    if (mmDashYyMatch) {
      month = month || parseInt(mmDashYyMatch[1]);
      year = year || 2000 + parseInt(mmDashYyMatch[2]);
    }
  }

  // Strategy 7: Quarter references (4th quarter, Q4, etc.)
  if (!month) {
    const quarterMatch = lower.match(/\b(1st|2nd|3rd|4th|first|second|third|fourth|q[1-4])\s*(quarter|qtr)?\b/i);
    if (quarterMatch) {
      const quarterKey = quarterMatch[1].toLowerCase();
      month = QUARTER_MAP[quarterKey] || null;
    }
  }

  // Strategy 8: Just "25" at end of month name (December25, Nov25)
  if (!year && month) {
    const monthYearMatch = lower.match(/[a-z]{3,9}(2[0-9])(?![0-9])/);
    if (monthYearMatch) {
      year = 2000 + parseInt(monthYearMatch[1]);
    }
  }

  // Strategy 9: Standalone 2-digit year near month context ('25, -25)
  if (!year && month) {
    const standaloneYearMatch = lower.match(/[''\-\s](2[0-9])(?![0-9])/);
    if (standaloneYearMatch) {
      year = 2000 + parseInt(standaloneYearMatch[1]);
    }
  }

  return { month, year };
}

/**
 * Extract date from multiple sources with priority
 * @param {Object} options
 * @param {string} options.filename - The filename
 * @param {string} options.reviewPeriod - Review period from cover sheet
 * @param {string} options.cellContent - Any other cell content with date info
 * @returns {{ month: number|null, year: number|null, source: string }}
 */
function extractDateFromSources({ filename, reviewPeriod, cellContent }) {
  // Priority 1: Review period from cover sheet (most reliable)
  if (reviewPeriod) {
    const result = extractDate(reviewPeriod);
    if (result.month && result.year) {
      return { ...result, source: 'reviewPeriod' };
    }
  }

  // Priority 2: Other cell content
  if (cellContent) {
    const result = extractDate(cellContent);
    if (result.month && result.year) {
      return { ...result, source: 'cellContent' };
    }
  }

  // Priority 3: Filename
  if (filename) {
    const result = extractDate(filename);
    if (result.month || result.year) {
      return { ...result, source: 'filename' };
    }
  }

  // Combine partial results
  const fromReviewPeriod = reviewPeriod ? extractDate(reviewPeriod) : {};
  const fromCell = cellContent ? extractDate(cellContent) : {};
  const fromFilename = filename ? extractDate(filename) : {};

  return {
    month: fromReviewPeriod.month || fromCell.month || fromFilename.month || null,
    year: fromReviewPeriod.year || fromCell.year || fromFilename.year || null,
    source: 'combined'
  };
}

/**
 * Infer missing year when only month is available
 * Uses current year, or previous year if month is in the future
 * @param {number|null} month
 * @param {number|null} year
 * @returns {{ month: number|null, year: number|null, inferred: boolean }}
 */
function inferMissingYear(month, year) {
  if (year || !month) {
    return { month, year, inferred: false };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // If month is in the future for this year, assume previous year
  if (month > currentMonth) {
    return { month, year: currentYear - 1, inferred: true };
  }

  return { month, year: currentYear, inferred: true };
}

/**
 * Validate and normalize a date
 * @param {number} month
 * @param {number} year
 * @returns {{ isValid: boolean, month: number|null, year: number|null, error: string|null }}
 */
function validateDate(month, year) {
  const errors = [];

  if (month !== null && (month < 1 || month > 12)) {
    errors.push(`Invalid month: ${month}`);
    month = null;
  }

  if (year !== null && (year < 2020 || year > 2030)) {
    errors.push(`Year out of range: ${year}`);
    year = null;
  }

  // Check if date is in the future (allow current month)
  if (month && year) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      errors.push(`Date is in the future: ${month}/${year}`);
    }
  }

  return {
    isValid: errors.length === 0 && month !== null && year !== null,
    month,
    year,
    error: errors.length > 0 ? errors.join('; ') : null
  };
}

module.exports = {
  extractDate,
  extractDateFromSources,
  inferMissingYear,
  validateDate,
  MONTH_MAP,
  QUARTER_MAP
};
