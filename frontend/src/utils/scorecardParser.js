import * as XLSX from 'xlsx';
import { parseExcelFullFile, validateParsedData as validateSnfData } from './excelFullParser';
import { parseKevFile, validateKevData, isKevFormat } from './kevParser';

/**
 * Unified Scorecard Parser
 *
 * Auto-detects file format and routes to the appropriate parser.
 * Supports SNF Clinical Systems Review and KEV Score Cards formats.
 */

/**
 * Detect the format of an Excel file
 * @param {File} file - The Excel file
 * @returns {Promise<string>} The format type ('snf', 'kev', or 'unknown')
 */
export async function detectFormat(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        // Check for KEV format
        if (isKevFormat(sheetNames)) {
          resolve('kev');
          return;
        }

        // Check for SNF Clinical Systems Review format
        if (
          sheetNames.includes('Clinical Systems Overview') ||
          sheetNames.some((s) => s.includes('1. Change of Condition'))
        ) {
          resolve('snf');
          return;
        }

        resolve('unknown');
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse any scorecard file (auto-detects format)
 * @param {File} file - The Excel file to parse
 * @param {Object} options - Optional overrides for facility/date
 * @returns {Promise<Object>} Parsed scorecard data with format info
 */
export async function parseAnyFile(file, options = {}) {
  const format = await detectFormat(file);

  if (format === 'kev') {
    const parsed = await parseKevFile(file, options);
    // Normalize to common structure
    return {
      ...parsed,
      format: 'kev',
      // Map categories to systems for display compatibility
      systems: parsed.categories.map((cat, idx) => ({
        systemNumber: idx + 1,
        systemName: cat.categoryName,
        items: cat.items,
        totalPointsEarned: cat.totalPointsEarned,
      })),
    };
  }

  if (format === 'snf') {
    const parsed = await parseExcelFullFile(file, options);
    return {
      ...parsed,
      format: 'snf',
      totalMaxPoints: 700,
      scorePercentage: Math.round((parsed.totalScore / 700) * 100),
    };
  }

  throw new Error(`Unknown scorecard format in file: ${file.name}`);
}

/**
 * Parse multiple files with auto-detection
 * @param {FileList|File[]} files - The files to parse
 * @param {Object} options - Optional overrides
 * @returns {Promise<Array>} Array of parsed results
 */
export async function parseMultipleFilesAuto(files, options = {}) {
  const results = [];

  for (const file of files) {
    try {
      const parsed = await parseAnyFile(file, options);
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
 * Validate parsed data (works for both formats)
 */
export function validateParsedDataAuto(parsed) {
  if (parsed.format === 'kev') {
    return validateKevData(parsed);
  }
  return validateSnfData(parsed);
}

export { detectFormat as default };
