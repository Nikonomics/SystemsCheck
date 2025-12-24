import * as XLSX from 'xlsx';

/**
 * Parse an Excel file and extract scorecard data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Array>} Array of scorecard objects
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }

        // Get headers from first row
        const headers = jsonData[0].map((h) => String(h).toLowerCase().trim());

        // Map column indices
        const columnMap = {
          facilityName: findColumnIndex(headers, ['facility name', 'facility', 'name']),
          month: findColumnIndex(headers, ['month']),
          year: findColumnIndex(headers, ['year']),
          system1Score: findColumnIndex(headers, ['system 1 score', 'system 1', 'change of condition']),
          system2Score: findColumnIndex(headers, ['system 2 score', 'system 2', 'accidents', 'falls']),
          system3Score: findColumnIndex(headers, ['system 3 score', 'system 3', 'skin']),
          system4Score: findColumnIndex(headers, ['system 4 score', 'system 4', 'medication']),
          system5Score: findColumnIndex(headers, ['system 5 score', 'system 5', 'infection']),
          system6Score: findColumnIndex(headers, ['system 6 score', 'system 6', 'transfer', 'discharge']),
          system7Score: findColumnIndex(headers, ['system 7 score', 'system 7', 'abuse', 'grievance']),
          system8Score: findColumnIndex(headers, ['system 8 score', 'system 8', 'observation', 'interview']),
          totalScore: findColumnIndex(headers, ['total score', 'total', 'overall']),
        };

        // Check required columns
        const required = ['facilityName', 'month', 'year'];
        const missing = required.filter((key) => columnMap[key] === -1);
        if (missing.length > 0) {
          reject(new Error(`Missing required columns: ${missing.join(', ')}`));
          return;
        }

        // Parse data rows
        const scorecards = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];

          // Skip empty rows
          if (!row || row.length === 0 || !row[columnMap.facilityName]) {
            continue;
          }

          scorecards.push({
            facilityName: String(row[columnMap.facilityName] || '').trim(),
            month: row[columnMap.month],
            year: row[columnMap.year],
            system1Score: parseScore(row[columnMap.system1Score]),
            system2Score: parseScore(row[columnMap.system2Score]),
            system3Score: parseScore(row[columnMap.system3Score]),
            system4Score: parseScore(row[columnMap.system4Score]),
            system5Score: parseScore(row[columnMap.system5Score]),
            system6Score: parseScore(row[columnMap.system6Score]),
            system7Score: parseScore(row[columnMap.system7Score]),
            system8Score: parseScore(row[columnMap.system8Score]),
            totalScore: parseScore(row[columnMap.totalScore]),
          });
        }

        resolve(scorecards);
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
 * Find column index by matching against possible header names
 */
function findColumnIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const index = headers.findIndex((h) => h.includes(name.toLowerCase()));
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Parse a score value, handling various formats
 */
function parseScore(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Generate and download an Excel template file
 * @param {Object} templateData - Data from the API containing columns, facilities, sample
 */
export function downloadTemplate(templateData) {
  const { columns, systemNames, facilities, sampleRow } = templateData;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Main data sheet
  const wsData = [
    columns,
    [
      sampleRow.facilityName,
      sampleRow.month,
      sampleRow.year,
      sampleRow.system1Score,
      sampleRow.system2Score,
      sampleRow.system3Score,
      sampleRow.system4Score,
      sampleRow.system5Score,
      sampleRow.system6Score,
      sampleRow.system7Score,
      sampleRow.system8Score,
      sampleRow.totalScore,
    ],
  ];

  const ws = XLSX.utils.aoa_to_a(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Historical Data');

  // Instructions sheet
  const instructionsData = [
    ['Historical Data Import Template'],
    [''],
    ['Instructions:'],
    ['1. Enter one row per facility per month'],
    ['2. Facility Name must match exactly (see Facilities sheet for valid names)'],
    ['3. Month should be 1-12'],
    ['4. Year should be the 4-digit year (e.g., 2024)'],
    ['5. Each system score should be 0-100'],
    ['6. Total Score is optional (will be calculated if omitted)'],
    [''],
    ['System Names:'],
    ...systemNames.map((name, i) => [`System ${i + 1}: ${name}`]),
  ];
  const wsInstructions = XLSX.utils.aoa_to_a(instructionsData);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Facilities list sheet
  const facilitiesData = [['Valid Facility Names'], ...facilities.map((f) => [f])];
  const wsFacilities = XLSX.utils.aoa_to_a(facilitiesData);
  XLSX.utils.book_append_sheet(wb, wsFacilities, 'Facilities');

  // Download
  XLSX.writeFile(wb, 'SystemsCheck_Import_Template.xlsx');
}

/**
 * Convert array of arrays to worksheet
 * Note: XLSX.utils.aoa_to_sheet is the correct function name
 */
XLSX.utils.aoa_to_a = function (data) {
  return XLSX.utils.aoa_to_sheet(data);
};
