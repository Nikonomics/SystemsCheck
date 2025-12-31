const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Uploads directory for KEV historical files
const KEV_UPLOADS_DIR = path.join(__dirname, '../../uploads/kev-historical');

// Ensure uploads directory exists
if (!fs.existsSync(KEV_UPLOADS_DIR)) {
  fs.mkdirSync(KEV_UPLOADS_DIR, { recursive: true });
}
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Scorecard, ScorecardSystem, ScorecardItem, Facility, User, ImportBatch, KevHistorical, KevHistoricalCategory } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { parseExcelFile, validateParsedData, normalizeText } = require('../utils/excelParser');
const { parseKevFile, validateKevData, isKevFormat } = require('../utils/kevParser');
const { parseKevCoverSheet, validateCoverSheetData, detectKevFormat } = require('../utils/kevCoverSheetParser');
const { extractDate, extractDateFromSources, inferMissingYear, validateDate } = require('../utils/dateExtractor');
const { auditCriteria } = require('../data/auditCriteria');
const XLSX = require('xlsx');

/**
 * Extract core facility name (before common suffixes)
 */
function extractCoreName(name) {
  return String(name || '')
    .toLowerCase()
    // Expand common abbreviations
    .replace(/\bmt\.?\s*/gi, 'mount ')
    .replace(/\bst\.?\s*/gi, 'saint ')
    .replace(/\bcda\b/gi, 'coeur dalene')
    // Remove common suffixes
    .replace(/\s*(health\s*(and|&)\s*rehabilitation|of\s*cascadia|transitional\s*care|care\s*center|retirement\s*living|snf|alf|ilf|-\s*(snf|alf|ilf))\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate word overlap score between two strings
 */
function wordMatchScore(str1, str2) {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let matches = 0;
  for (const word of words1) {
    if (words2.has(word)) matches++;
  }

  return matches / Math.min(words1.size, words2.size);
}

/**
 * Find best matching facility for a given name
 */
function findBestFacilityMatch(excelName, facilityMap) {
  if (!excelName) return { id: null, name: null, score: 0 };

  const normalizedExcel = normalizeText(excelName);
  const coreExcel = extractCoreName(excelName);

  let bestMatch = { id: null, name: null, score: 0 };

  for (const [dbName, id] of facilityMap.entries()) {
    const normalizedDb = normalizeText(dbName);
    const coreDb = extractCoreName(dbName);

    // Exact match after normalization
    if (normalizedDb === normalizedExcel) {
      return { id, name: dbName, score: 1 };
    }

    // Core name exact match (e.g., "Colville" matches "Colville Health & Rehabilitation of Cascadia")
    if (coreDb === coreExcel && coreExcel.length >= 4) {
      return { id, name: dbName, score: 0.95 };
    }

    // Core name contains match
    if (coreDb.includes(coreExcel) && coreExcel.length >= 4) {
      const score = 0.8 + (coreExcel.length / coreDb.length) * 0.1;
      if (score > bestMatch.score) {
        bestMatch = { id, name: dbName, score };
      }
    } else if (coreExcel.includes(coreDb) && coreDb.length >= 4) {
      const score = 0.7 + (coreDb.length / coreExcel.length) * 0.1;
      if (score > bestMatch.score) {
        bestMatch = { id, name: dbName, score };
      }
    }

    // Word overlap scoring as fallback
    const wordScore = wordMatchScore(coreExcel, coreDb);
    if (wordScore > 0.5 && wordScore > bestMatch.score) {
      bestMatch = { id, name: dbName, score: wordScore };
    }
  }

  // Only return match if score is high enough
  return bestMatch.score >= 0.5 ? bestMatch : { id: null, name: null, score: 0 };
}

/**
 * Detect file format and parse accordingly
 */
function parseAnyFormat(buffer, options = {}) {
  // Read workbook to detect format
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  // Check for KEV format
  if (isKevFormat(sheetNames)) {
    const parsed = parseKevFile(buffer, options);
    // Normalize KEV format to match SNF structure for import
    return {
      ...parsed,
      format: 'kev',
      // Map categories to systems for compatibility
      systems: parsed.categories.map((cat, idx) => ({
        systemNumber: idx + 1,
        systemName: cat.categoryName,
        items: cat.items,
        totalPointsEarned: cat.totalPointsEarned
      }))
    };
  }

  // Check for SNF Clinical Systems Review format
  if (sheetNames.includes('Clinical Systems Overview') ||
      sheetNames.some(s => s.includes('1. Change of Condition'))) {
    const parsed = parseExcelFile(buffer, options);
    return { ...parsed, format: 'snf' };
  }

  // Unknown format
  throw new Error(`Unknown scorecard format. Sheets: ${sheetNames.slice(0, 5).join(', ')}`);
}

/**
 * Validate parsed data regardless of format
 */
function validateAnyFormat(parsed, facilityMap) {
  if (parsed.format === 'kev') {
    return validateKevData(parsed);
  }
  return validateParsedData(parsed, facilityMap);
}

// Configure multer for memory storage (files up to 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.ms-excel.sheet.macroEnabled.12' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.xlsm')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls, .xlsm) are allowed'));
    }
  }
});

// All routes require admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

/**
 * POST /api/import/historical
 * Import historical scorecard data
 */
router.post('/historical', async (req, res) => {
  const { scorecards } = req.body;

  if (!scorecards || !Array.isArray(scorecards) || scorecards.length === 0) {
    return res.status(400).json({ message: 'No scorecard data provided' });
  }

  const transaction = await sequelize.transaction();
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get all facilities for name matching
    const facilities = await Facility.findAll({
      attributes: ['id', 'name'],
      where: { isActive: true }
    });
    const facilityMap = new Map(
      facilities.map(f => [f.name.toLowerCase().trim(), f.id])
    );

    for (let i = 0; i < scorecards.length; i++) {
      const row = scorecards[i];
      const rowNum = i + 1;

      try {
        // Validate facility
        const facilityId = facilityMap.get(row.facilityName?.toLowerCase().trim());
        if (!facilityId) {
          results.failed++;
          results.errors.push({ row: rowNum, error: `Facility not found: ${row.facilityName}` });
          continue;
        }

        // Validate month/year
        const month = parseInt(row.month);
        const year = parseInt(row.year);
        if (isNaN(month) || month < 1 || month > 12) {
          results.failed++;
          results.errors.push({ row: rowNum, error: `Invalid month: ${row.month}` });
          continue;
        }
        if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
          results.failed++;
          results.errors.push({ row: rowNum, error: `Invalid year: ${row.year}` });
          continue;
        }

        // Validate date is in the past
        const scorecardDate = new Date(year, month - 1, 1);
        const today = new Date();
        today.setDate(1);
        today.setHours(0, 0, 0, 0);
        if (scorecardDate >= today) {
          results.failed++;
          results.errors.push({ row: rowNum, error: 'Date must be in the past' });
          continue;
        }

        // Validate scores
        const scores = {
          system1: parseFloat(row.system1Score) || 0,
          system2: parseFloat(row.system2Score) || 0,
          system3: parseFloat(row.system3Score) || 0,
          system4: parseFloat(row.system4Score) || 0,
          system5: parseFloat(row.system5Score) || 0,
          system6: parseFloat(row.system6Score) || 0,
          system7: parseFloat(row.system7Score) || 0,
          system8: parseFloat(row.system8Score) || 0,
        };

        for (const [key, value] of Object.entries(scores)) {
          if (value < 0 || value > 100) {
            results.failed++;
            results.errors.push({ row: rowNum, error: `${key} score must be between 0 and 100` });
            continue;
          }
        }

        // Calculate total
        const calculatedTotal = Object.values(scores).reduce((sum, s) => sum + s, 0);
        const providedTotal = parseFloat(row.totalScore);

        // Allow slight floating point differences
        if (!isNaN(providedTotal) && Math.abs(calculatedTotal - providedTotal) > 0.1) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: `Total mismatch: provided ${providedTotal}, calculated ${calculatedTotal}`
          });
          continue;
        }

        // Check for duplicate
        const existing = await Scorecard.findOne({
          where: {
            facilityId,
            scorecardDate,
          }
        });

        if (existing) {
          results.failed++;
          results.errors.push({
            row: rowNum,
            error: `Scorecard already exists for ${row.facilityName} - ${month}/${year}`
          });
          continue;
        }

        // Create scorecard
        const scorecard = await Scorecard.create({
          facilityId,
          scorecardDate,
          status: 'hard_close',
          submittedById: req.user.id,
          submittedAt: new Date(),
          createdById: req.user.id,
          notes: 'Historical import',
        }, { transaction });

        // Create scorecard_systems records
        const systemNames = [
          'Change of Condition',
          'Accidents, Falls, Incidents',
          'Skin',
          'Medication Management & Weight Loss',
          'Infection Control',
          'Transfer/Discharge',
          'Abuse Self-Report Grievances',
          'Observations & Interviews'
        ];

        for (let sysNum = 1; sysNum <= 8; sysNum++) {
          await ScorecardSystem.create({
            scorecardId: scorecard.id,
            systemNumber: sysNum,
            systemName: systemNames[sysNum - 1],
            score: scores[`system${sysNum}`],
            maxScore: 100,
            isComplete: true,
          }, { transaction });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ row: rowNum, error: error.message });
      }
    }

    await transaction.commit();
    res.json(results);
  } catch (error) {
    await transaction.rollback();
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
});

/**
 * POST /api/import/validate
 * Validate scorecard data before import
 */
router.post('/validate', async (req, res) => {
  const { scorecards } = req.body;

  if (!scorecards || !Array.isArray(scorecards)) {
    return res.status(400).json({ message: 'No scorecard data provided' });
  }

  // Get all facilities for name matching
  const facilities = await Facility.findAll({
    attributes: ['id', 'name'],
    where: { isActive: true }
  });
  const facilityMap = new Map(
    facilities.map(f => [f.name.toLowerCase().trim(), f.id])
  );

  // Get existing scorecards to check for duplicates
  const existingDates = await Scorecard.findAll({
    attributes: ['facilityId', 'scorecardDate'],
    raw: true
  });
  const existingSet = new Set(
    existingDates.map(s => `${s.facilityId}-${new Date(s.scorecardDate).toISOString().slice(0, 7)}`)
  );

  const results = scorecards.map((row, index) => {
    const errors = [];
    const rowNum = index + 1;

    // Validate facility
    const facilityId = facilityMap.get(row.facilityName?.toLowerCase().trim());
    if (!facilityId) {
      errors.push(`Facility not found: "${row.facilityName}"`);
    }

    // Validate month/year
    const month = parseInt(row.month);
    const year = parseInt(row.year);

    if (isNaN(month) || month < 1 || month > 12) {
      errors.push(`Invalid month: ${row.month}`);
    }
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
      errors.push(`Invalid year: ${row.year}`);
    }

    // Validate date is in the past
    if (!isNaN(month) && !isNaN(year)) {
      const scorecardDate = new Date(year, month - 1, 1);
      const today = new Date();
      today.setDate(1);
      today.setHours(0, 0, 0, 0);
      if (scorecardDate >= today) {
        errors.push('Date must be in the past');
      }

      // Check for duplicate
      if (facilityId) {
        const key = `${facilityId}-${year}-${String(month).padStart(2, '0')}`;
        if (existingSet.has(key)) {
          errors.push('Scorecard already exists for this facility/month');
        }
      }
    }

    // Validate scores
    const scores = [];
    for (let i = 1; i <= 8; i++) {
      const score = parseFloat(row[`system${i}Score`]);
      if (isNaN(score)) {
        errors.push(`System ${i} score is not a number`);
        scores.push(0);
      } else if (score < 0 || score > 100) {
        errors.push(`System ${i} score must be 0-100`);
        scores.push(score);
      } else {
        scores.push(score);
      }
    }

    // Validate total
    const calculatedTotal = scores.reduce((sum, s) => sum + s, 0);
    const providedTotal = parseFloat(row.totalScore);
    if (!isNaN(providedTotal) && Math.abs(calculatedTotal - providedTotal) > 0.1) {
      errors.push(`Total mismatch: provided ${providedTotal}, calculated ${calculatedTotal.toFixed(1)}`);
    }

    return {
      row: rowNum,
      facilityName: row.facilityName,
      month: row.month,
      year: row.year,
      totalScore: calculatedTotal.toFixed(1),
      isValid: errors.length === 0,
      errors
    };
  });

  res.json({
    total: results.length,
    valid: results.filter(r => r.isValid).length,
    invalid: results.filter(r => !r.isValid).length,
    rows: results
  });
});

/**
 * GET /api/import/template
 * Get template data for Excel download
 */
router.get('/template', async (req, res) => {
  const facilities = await Facility.findAll({
    attributes: ['name'],
    where: { isActive: true },
    order: [['name', 'ASC']]
  });

  res.json({
    columns: [
      'Facility Name',
      'Month',
      'Year',
      'System 1 Score',
      'System 2 Score',
      'System 3 Score',
      'System 4 Score',
      'System 5 Score',
      'System 6 Score',
      'System 7 Score',
      'System 8 Score',
      'Total Score'
    ],
    systemNames: [
      'Change of Condition',
      'Accidents, Falls, Incidents',
      'Skin',
      'Medication Management & Weight Loss',
      'Infection Control',
      'Transfer/Discharge',
      'Abuse Self-Report Grievances',
      'Observations & Interviews'
    ],
    facilities: facilities.map(f => f.name),
    sampleRow: {
      facilityName: facilities[0]?.name || 'Example Facility',
      month: 6,
      year: 2024,
      system1Score: 85,
      system2Score: 90,
      system3Score: 88,
      system4Score: 92,
      system5Score: 95,
      system6Score: 87,
      system7Score: 100,
      system8Score: 91,
      totalScore: 728
    }
  });
});

// ============================================================================
// FULL ITEM-LEVEL HISTORICAL IMPORT
// ============================================================================

/**
 * POST /api/import/historical-full/validate
 * Validate Excel files with full item-level data before import
 *
 * Supports manual date overrides via JSON body:
 * {
 *   "dateOverrides": {
 *     "filename.xlsx": { "month": 10, "year": 2025 }
 *   }
 * }
 */
router.post('/historical-full/validate', upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Parse manual date overrides from request body
    let dateOverrides = {};
    if (req.body.dateOverrides) {
      try {
        dateOverrides = typeof req.body.dateOverrides === 'string'
          ? JSON.parse(req.body.dateOverrides)
          : req.body.dateOverrides;
      } catch (e) {
        console.warn('Could not parse dateOverrides:', e.message);
      }
    }

    // Get all facilities for validation
    const facilities = await Facility.findAll({
      attributes: ['id', 'name'],
      where: { isActive: true }
    });
    const facilityMap = new Map(facilities.map(f => [f.name, f.id]));

    // Get existing scorecards to check for duplicates
    const existingScorecards = await Scorecard.findAll({
      attributes: ['facilityId', 'month', 'year'],
      raw: true
    });
    const existingSet = new Set(
      existingScorecards.map(s => `${s.facilityId}-${s.month}-${s.year}`)
    );

    const validationResults = [];

    for (const file of req.files) {
      try {
        // Parse Excel file (auto-detects format)
        const parsed = parseAnyFormat(file.buffer, {});

        // Check for manual date override for this file
        const override = dateOverrides[file.originalname] || {};

        // Try to extract date from filename if not in parsed data
        let extractedMonth = parsed.month;
        let extractedYear = parsed.year;
        let dateSource = 'file';
        let dateInferred = false;

        // Use improved date extraction from filename
        if (!extractedMonth || !extractedYear) {
          const dateFromFilename = extractDate(file.originalname);
          extractedMonth = extractedMonth || dateFromFilename.month;
          extractedYear = extractedYear || dateFromFilename.year;
          if (dateFromFilename.month || dateFromFilename.year) {
            dateSource = 'filename';
          }
        }

        // Infer missing year if we have month
        if (extractedMonth && !extractedYear) {
          const inferred = inferMissingYear(extractedMonth, extractedYear);
          extractedYear = inferred.year;
          dateInferred = inferred.inferred;
        }

        // Apply manual overrides (highest priority)
        const finalMonth = override.month || extractedMonth;
        const finalYear = override.year || extractedYear;
        if (override.month || override.year) {
          dateSource = 'manual';
        }

        // Find matching facility using improved matching
        const facilityMatch = findBestFacilityMatch(parsed.facilityName, facilityMap);
        const matchedFacilityId = facilityMatch.id;
        const matchedFacilityName = facilityMatch.name;

        // Validate the date
        const dateValidation = validateDate(finalMonth, finalYear);

        // Check for duplicate
        const isDuplicate = matchedFacilityId && finalMonth && finalYear &&
          existingSet.has(`${matchedFacilityId}-${finalMonth}-${finalYear}`);

        // Validate parsed data
        const validation = validateAnyFormat(parsed, facilityMap);

        // Add date-related errors/warnings
        if (!finalMonth) {
          validation.errors.push('Month could not be determined - please specify manually');
        }
        if (!finalYear) {
          validation.errors.push('Year could not be determined - please specify manually');
        }
        if (dateValidation.error) {
          validation.errors.push(dateValidation.error);
        }
        if (dateInferred) {
          validation.warnings.push(`Year inferred as ${finalYear} (not found in file)`);
        }

        if (isDuplicate) {
          validation.errors.push(`Scorecard already exists for ${matchedFacilityName} - ${finalMonth}/${finalYear}`);
          validation.isValid = false;
        }

        const isValid = validation.isValid && matchedFacilityId && finalMonth && finalYear && !dateValidation.error;

        validationResults.push({
          filename: file.originalname,
          format: parsed.format,
          kevType: parsed.kevType || null,
          facilityName: parsed.facilityName,
          matchedFacility: matchedFacilityName,
          matchScore: facilityMatch.score,
          facilityId: matchedFacilityId,
          month: finalMonth,
          year: finalYear,
          dateSource,
          dateInferred,
          needsDateOverride: !finalMonth || !finalYear,
          isValid,
          errors: validation.errors,
          warnings: validation.warnings,
          totalScore: parsed.totalScore,
          totalMaxPoints: parsed.totalMaxPoints || 700,
          scorePercentage: parsed.scorePercentage || Math.round((parsed.totalScore / 700) * 100),
          systems: parsed.systems ? parsed.systems.map(s => ({
            systemNumber: s.systemNumber,
            systemName: s.systemName,
            itemCount: s.items.length,
            expectedCount: parsed.format === 'kev' ? s.items.length : (auditCriteria.find(a => a.systemNumber === s.systemNumber)?.items?.length || 0),
            totalPointsEarned: s.totalPointsEarned,
            lowConfidenceItems: parsed.format === 'kev' ? 0 : s.items.filter(i => i.matchConfidence < 0.5).length
          })) : []
        });
      } catch (error) {
        validationResults.push({
          filename: file.originalname,
          isValid: false,
          errors: [`Parse error: ${error.message}`],
          warnings: [],
          needsDateOverride: true
        });
      }
    }

    res.json({
      total: validationResults.length,
      valid: validationResults.filter(r => r.isValid).length,
      invalid: validationResults.filter(r => !r.isValid).length,
      needsDateOverride: validationResults.filter(r => r.needsDateOverride).length,
      results: validationResults
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ message: 'Validation failed', error: error.message });
  }
});

/**
 * POST /api/import/historical-full
 * Import Excel files with full item-level data
 *
 * Supports manual date overrides via JSON body:
 * {
 *   "dateOverrides": {
 *     "filename.xlsx": { "month": 10, "year": 2025 }
 *   }
 * }
 */
router.post('/historical-full', upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Parse manual date overrides from request body
    let dateOverrides = {};
    if (req.body.dateOverrides) {
      try {
        dateOverrides = typeof req.body.dateOverrides === 'string'
          ? JSON.parse(req.body.dateOverrides)
          : req.body.dateOverrides;
      } catch (e) {
        console.warn('Could not parse dateOverrides:', e.message);
      }
    }

    const defaultYear = req.body.year ? parseInt(req.body.year) : null;

    // Create import batch
    const batch = await ImportBatch.create({
      status: 'processing',
      importType: 'historical_full',
      totalFiles: req.files.length,
      createdById: req.user.id
    });

    // Get facilities map (original names as keys for better matching)
    const facilities = await Facility.findAll({
      attributes: ['id', 'name'],
      where: { isActive: true }
    });
    const facilityMap = new Map(facilities.map(f => [f.name, f.id]));

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      scorecardIds: []
    };

    // Process files in chunks
    const CHUNK_SIZE = 10;

    for (let i = 0; i < req.files.length; i += CHUNK_SIZE) {
      const chunk = req.files.slice(i, i + CHUNK_SIZE);
      const transaction = await sequelize.transaction();

      try {
        for (const file of chunk) {
          try {
            const parsed = parseAnyFormat(file.buffer, {});

            // Check for manual date override for this file
            const override = dateOverrides[file.originalname] || {};

            // Try to extract date from filename if not in parsed data
            let extractedMonth = parsed.month;
            let extractedYear = parsed.year;

            if (!extractedMonth || !extractedYear) {
              const dateFromFilename = extractDate(file.originalname);
              extractedMonth = extractedMonth || dateFromFilename.month;
              extractedYear = extractedYear || dateFromFilename.year;
            }

            // Infer missing year if we have month
            if (extractedMonth && !extractedYear) {
              const inferred = inferMissingYear(extractedMonth, extractedYear);
              extractedYear = inferred.year;
            }

            // Apply manual overrides (highest priority), then fallback to defaultYear
            const finalMonth = override.month || extractedMonth;
            const finalYear = override.year || extractedYear || defaultYear;

            // Find facility using improved matching
            const facilityMatch = findBestFacilityMatch(parsed.facilityName, facilityMap);
            const facilityId = facilityMatch.id;

            if (!facilityId) {
              results.failed++;
              results.errors.push({
                filename: file.originalname,
                error: `Facility not found: ${parsed.facilityName}`
              });
              continue;
            }

            if (!finalMonth || !finalYear) {
              results.failed++;
              results.errors.push({
                filename: file.originalname,
                error: `Missing date: month=${finalMonth}, year=${finalYear}. Please provide date override.`
              });
              continue;
            }

            // Check for duplicate
            const existing = await Scorecard.findOne({
              where: {
                facilityId,
                month: finalMonth,
                year: finalYear
              },
              transaction
            });

            if (existing) {
              results.failed++;
              results.errors.push({
                filename: file.originalname,
                error: `Duplicate: ${parsed.facilityName} ${finalMonth}/${finalYear}`
              });
              continue;
            }

            // Create scorecard
            const scorecard = await Scorecard.create({
              facilityId,
              month: finalMonth,
              year: finalYear,
              status: 'hard_close',
              totalScore: parsed.totalScore,
              createdById: req.user.id,
              hardClosedAt: new Date(),
              hardClosedById: req.user.id,
              importBatchId: batch.id
            }, { transaction });

            // Create systems and items
            for (const systemData of parsed.systems) {
              const system = await ScorecardSystem.create({
                scorecardId: scorecard.id,
                systemNumber: systemData.systemNumber,
                systemName: systemData.systemName,
                totalPointsPossible: 100,
                totalPointsEarned: systemData.totalPointsEarned,
                completedById: req.user.id,
                completedAt: new Date()
              }, { transaction });

              // Create items
              for (const itemData of systemData.items) {
                await ScorecardItem.create({
                  scorecardSystemId: system.id,
                  itemNumber: itemData.itemNumber,
                  criteriaText: itemData.criteriaText,
                  maxPoints: itemData.maxPoints,
                  chartsMet: itemData.chartsMet,
                  sampleSize: itemData.sampleSize,
                  pointsEarned: itemData.pointsEarned,
                  notes: itemData.notes || null
                }, { transaction });
              }
            }

            results.success++;
            results.scorecardIds.push(scorecard.id);
          } catch (fileError) {
            results.failed++;
            results.errors.push({
              filename: file.originalname,
              error: fileError.message
            });
          }
        }

        await transaction.commit();

        // Update batch progress
        await batch.update({
          processedFiles: Math.min(i + CHUNK_SIZE, req.files.length),
          successCount: results.success,
          failedCount: results.failed
        });

      } catch (chunkError) {
        await transaction.rollback();
        // Mark all files in failed chunk
        chunk.forEach(f => {
          if (!results.errors.find(e => e.filename === f.originalname)) {
            results.failed++;
            results.errors.push({
              filename: f.originalname,
              error: `Transaction failed: ${chunkError.message}`
            });
          }
        });
      }
    }

    // Finalize batch
    await batch.update({
      status: results.failed === 0 ? 'completed' : 'completed_with_errors',
      completedAt: new Date(),
      scorecardIds: results.scorecardIds,
      errorLog: results.errors
    });

    res.json({
      batchId: batch.batchId,
      ...results
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
});

/**
 * POST /api/import/rollback/:batchId
 * Rollback an import batch
 */
router.post('/rollback/:batchId', async (req, res) => {
  try {
    const batch = await ImportBatch.findOne({
      where: { batchId: req.params.batchId }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (batch.status === 'rolled_back') {
      return res.status(400).json({ message: 'Batch already rolled back' });
    }

    const transaction = await sequelize.transaction();

    try {
      // Delete all scorecards from this batch (cascades to systems, items)
      const deletedCount = await Scorecard.destroy({
        where: { importBatchId: batch.id },
        transaction
      });

      await batch.update({
        status: 'rolled_back'
      }, { transaction });

      await transaction.commit();

      res.json({
        message: 'Batch rolled back successfully',
        deletedCount
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({ message: 'Rollback failed', error: error.message });
  }
});

/**
 * GET /api/import/history
 * Get import batch history
 */
router.get('/history', async (req, res) => {
  try {
    const batches = await ImportBatch.findAll({
      order: [['created_at', 'DESC']],
      limit: 50,
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    res.json({ batches });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
});

/**
 * GET /api/import/batch/:batchId
 * Get status of a specific import batch
 */
router.get('/batch/:batchId', async (req, res) => {
  try {
    const batch = await ImportBatch.findOne({
      where: { batchId: req.params.batchId },
      include: [{
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ batch });
  } catch (error) {
    console.error('Batch fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch batch', error: error.message });
  }
});

// ============================================================================
// KEV HISTORICAL IMPORT (Cover Sheet Only)
// ============================================================================

/**
 * POST /api/import/kev-historical/validate
 * Validate KEV Excel files for cover sheet data extraction
 */
router.post('/kev-historical/validate', upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Parse manual date overrides from request body
    let dateOverrides = {};
    if (req.body.dateOverrides) {
      try {
        dateOverrides = typeof req.body.dateOverrides === 'string'
          ? JSON.parse(req.body.dateOverrides)
          : req.body.dateOverrides;
      } catch (e) {
        console.warn('Could not parse dateOverrides:', e.message);
      }
    }

    // Get all facilities for validation
    const facilities = await Facility.findAll({
      attributes: ['id', 'name'],
      where: { isActive: true }
    });
    const facilityMap = new Map(facilities.map(f => [f.name, f.id]));

    // Get existing KEV historical to check for duplicates
    const existingKev = await KevHistorical.findAll({
      attributes: ['facilityId', 'month', 'year'],
      raw: true
    });
    const existingSet = new Set(
      existingKev.map(k => `${k.facilityId}-${k.month}-${k.year}`)
    );

    // Parse facility overrides (when user manually selects a facility)
    let facilityOverrides = {};
    if (req.body.facilityOverrides) {
      try {
        facilityOverrides = typeof req.body.facilityOverrides === 'string'
          ? JSON.parse(req.body.facilityOverrides)
          : req.body.facilityOverrides;
      } catch (e) {
        console.warn('Could not parse facilityOverrides:', e.message);
      }
    }

    // Track intra-batch duplicates (files within same upload that target same facility+month+year)
    const batchSet = new Set();

    const validationResults = [];

    for (const file of req.files) {
      try {
        // Parse KEV cover sheet
        const parsed = parseKevCoverSheet(file.buffer, file.originalname);

        if (!parsed.success) {
          validationResults.push({
            filename: file.originalname,
            isValid: false,
            errors: [parsed.error || 'Failed to parse file'],
            warnings: [],
            needsFacility: false
          });
          continue;
        }

        // Check for manual date override for this file
        const override = dateOverrides[file.originalname] || {};

        // Apply manual overrides
        let finalMonth = override.month || parsed.month;
        let finalYear = override.year || parsed.year;
        let dateSource = parsed.dateSource;

        if (override.month || override.year) {
          dateSource = 'manual';
        }

        // Validate the data
        const validation = validateCoverSheetData(parsed);

        // Check for facility override first, then try auto-matching
        const facilityOverride = facilityOverrides[file.originalname];
        let matchedFacilityId = null;
        let matchedFacilityName = null;
        let facilityMatchScore = 0;

        if (facilityOverride) {
          // User manually selected a facility
          matchedFacilityId = facilityOverride.id;
          matchedFacilityName = facilityOverride.name;
          facilityMatchScore = 1; // Manual = exact match
        } else {
          // Auto-match facility
          const facilityMatch = findBestFacilityMatch(parsed.facilityName, facilityMap);
          matchedFacilityId = facilityMatch.id;
          matchedFacilityName = facilityMatch.name;
          facilityMatchScore = facilityMatch.score;
        }

        const needsFacility = !matchedFacilityId;

        if (needsFacility) {
          validation.errors.push(`Facility not found: "${parsed.facilityName || 'null'}"`);
          validation.isValid = false;
        }

        // Check for duplicate in database
        const isDuplicateInDb = matchedFacilityId && finalMonth && finalYear &&
          existingSet.has(`${matchedFacilityId}-${finalMonth}-${finalYear}`);

        if (isDuplicateInDb) {
          validation.errors.push(`KEV scorecard already exists for ${matchedFacilityName} - ${finalMonth}/${finalYear}`);
          validation.isValid = false;
        }

        // Check for duplicate within this batch (intra-batch)
        const batchKey = `${matchedFacilityId}-${finalMonth}-${finalYear}`;
        const isDuplicateInBatch = matchedFacilityId && finalMonth && finalYear && batchSet.has(batchKey);

        if (isDuplicateInBatch && !isDuplicateInDb) {
          validation.errors.push(`Duplicate in upload batch: another file targets ${matchedFacilityName} - ${finalMonth}/${finalYear}`);
          validation.isValid = false;
        }

        // Add to batch set for future duplicate detection
        if (matchedFacilityId && finalMonth && finalYear) {
          batchSet.add(batchKey);
        }

        // Add date validation
        if (!finalMonth) {
          validation.errors.push('Missing facility name');
          validation.isValid = false;
        }
        if (!finalYear) {
          validation.errors.push('Year could not be determined - please specify manually');
          validation.isValid = false;
        }

        validationResults.push({
          filename: file.originalname,
          format: parsed.format,
          facilityName: parsed.facilityName,
          matchedFacility: matchedFacilityName,
          matchScore: facilityMatchScore,
          facilityId: matchedFacilityId,
          needsFacility,
          reviewPeriod: parsed.reviewPeriod,
          dateOfCompletion: parsed.dateOfCompletion,
          auditCompletedBy: parsed.auditCompletedBy,
          month: finalMonth,
          year: finalYear,
          dateSource,
          needsDateOverride: !finalMonth || !finalYear,
          qualityAreas: parsed.qualityAreas,
          totalPossible: parsed.totalPossible,
          totalMet: parsed.totalMet,
          totalPercentage: parsed.totalPercentage,
          overallScore: parsed.overallScore,
          isValid: validation.isValid && matchedFacilityId && finalMonth && finalYear,
          errors: validation.errors,
          warnings: validation.warnings
        });
      } catch (error) {
        validationResults.push({
          filename: file.originalname,
          isValid: false,
          errors: [`Parse error: ${error.message}`],
          warnings: [],
          needsDateOverride: true,
          needsFacility: false
        });
      }
    }

    // Return facilities list for dropdown selection
    const facilitiesList = facilities.map(f => ({ id: f.id, name: f.name })).sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      total: validationResults.length,
      valid: validationResults.filter(r => r.isValid).length,
      invalid: validationResults.filter(r => !r.isValid).length,
      needsDateOverride: validationResults.filter(r => r.needsDateOverride).length,
      needsFacility: validationResults.filter(r => r.needsFacility).length,
      results: validationResults,
      facilities: facilitiesList
    });
  } catch (error) {
    console.error('KEV validation error:', error);
    res.status(500).json({ message: 'Validation failed', error: error.message });
  }
});

/**
 * POST /api/import/kev-historical
 * Import KEV historical cover sheet data
 */
router.post('/kev-historical', upload.array('files', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Parse manual date overrides from request body
    let dateOverrides = {};
    if (req.body.dateOverrides) {
      try {
        dateOverrides = typeof req.body.dateOverrides === 'string'
          ? JSON.parse(req.body.dateOverrides)
          : req.body.dateOverrides;
      } catch (e) {
        console.warn('Could not parse dateOverrides:', e.message);
      }
    }

    // Parse facility overrides from request body
    let facilityOverrides = {};
    if (req.body.facilityOverrides) {
      try {
        facilityOverrides = typeof req.body.facilityOverrides === 'string'
          ? JSON.parse(req.body.facilityOverrides)
          : req.body.facilityOverrides;
      } catch (e) {
        console.warn('Could not parse facilityOverrides:', e.message);
      }
    }

    // Parse selected files list (if user de-selected some files)
    let selectedFiles = null;
    if (req.body.selectedFiles) {
      try {
        selectedFiles = typeof req.body.selectedFiles === 'string'
          ? JSON.parse(req.body.selectedFiles)
          : req.body.selectedFiles;
      } catch (e) {
        console.warn('Could not parse selectedFiles:', e.message);
      }
    }

    // Create import batch
    const batch = await ImportBatch.create({
      status: 'processing',
      importType: 'kev_historical',
      totalFiles: req.files.length,
      createdById: req.user.id
    });

    // Get facilities map
    const facilities = await Facility.findAll({
      attributes: ['id', 'name'],
      where: { isActive: true }
    });
    const facilityMap = new Map(facilities.map(f => [f.name, f.id]));

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      kevHistoricalIds: []
    };

    // Filter files if selectedFiles list is provided
    const filesToProcess = selectedFiles
      ? req.files.filter(f => selectedFiles.includes(f.originalname))
      : req.files;

    // Process files in chunks
    const CHUNK_SIZE = 10;

    for (let i = 0; i < filesToProcess.length; i += CHUNK_SIZE) {
      const chunk = filesToProcess.slice(i, i + CHUNK_SIZE);
      const transaction = await sequelize.transaction();

      try {
        for (const file of chunk) {
          try {
            const parsed = parseKevCoverSheet(file.buffer, file.originalname);

            if (!parsed.success) {
              results.failed++;
              results.errors.push({
                filename: file.originalname,
                error: parsed.error || 'Failed to parse file'
              });
              continue;
            }

            // Apply date overrides
            const override = dateOverrides[file.originalname] || {};
            const finalMonth = override.month || parsed.month;
            const finalYear = override.year || parsed.year;

            // Check for facility override first, then auto-match
            const facilityOverride = facilityOverrides[file.originalname];
            let facilityId = null;

            if (facilityOverride) {
              facilityId = facilityOverride.id;
            } else {
              const facilityMatch = findBestFacilityMatch(parsed.facilityName, facilityMap);
              facilityId = facilityMatch.id;
            }

            if (!facilityId) {
              results.failed++;
              results.errors.push({
                filename: file.originalname,
                error: `Facility not found: ${parsed.facilityName}`
              });
              continue;
            }

            if (!finalMonth || !finalYear) {
              results.failed++;
              results.errors.push({
                filename: file.originalname,
                error: `Missing date: month=${finalMonth}, year=${finalYear}`
              });
              continue;
            }

            // Check for duplicate
            const existing = await KevHistorical.findOne({
              where: {
                facilityId,
                month: finalMonth,
                year: finalYear
              },
              transaction
            });

            if (existing) {
              results.failed++;
              results.errors.push({
                filename: file.originalname,
                error: `Duplicate: ${parsed.facilityName} ${finalMonth}/${finalYear}`
              });
              continue;
            }

            // Save file to disk
            const fileExt = path.extname(file.originalname);
            const safeFilename = `${facilityId}-${finalYear}-${String(finalMonth).padStart(2, '0')}-${Date.now()}${fileExt}`;
            const filePath = path.join(KEV_UPLOADS_DIR, safeFilename);

            fs.writeFileSync(filePath, file.buffer);

            // Create KEV historical record
            const kevHistorical = await KevHistorical.create({
              facilityId,
              month: finalMonth,
              year: finalYear,
              format: parsed.format,
              facilityName: parsed.facilityName,
              reviewPeriod: parsed.reviewPeriod,
              dateOfCompletion: parsed.dateOfCompletion,
              auditCompletedBy: parsed.auditCompletedBy,
              totalPossible: parsed.totalPossible,
              totalMet: parsed.totalMet,
              totalPercentage: parsed.totalPercentage,
              overallScore: parsed.overallScore,
              originalFilename: file.originalname,
              filePath: safeFilename,  // Store relative filename, not full path
              importBatchId: batch.id,
              importedById: req.user.id
            }, { transaction });

            // Create category records
            for (let idx = 0; idx < parsed.qualityAreas.length; idx++) {
              const area = parsed.qualityAreas[idx];
              await KevHistoricalCategory.create({
                kevHistoricalId: kevHistorical.id,
                categoryName: area.category,
                possibleScore: area.possibleScore,
                metScore: area.metScore,
                percentage: area.percentage,
                sortOrder: idx
              }, { transaction });
            }

            results.success++;
            results.kevHistoricalIds.push(kevHistorical.id);
          } catch (fileError) {
            results.failed++;
            results.errors.push({
              filename: file.originalname,
              error: fileError.message
            });
          }
        }

        await transaction.commit();

        // Update batch progress
        await batch.update({
          processedFiles: Math.min(i + CHUNK_SIZE, req.files.length),
          successCount: results.success,
          failedCount: results.failed
        });

      } catch (chunkError) {
        await transaction.rollback();
        chunk.forEach(f => {
          if (!results.errors.find(e => e.filename === f.originalname)) {
            results.failed++;
            results.errors.push({
              filename: f.originalname,
              error: `Transaction failed: ${chunkError.message}`
            });
          }
        });
      }
    }

    // Finalize batch
    await batch.update({
      status: results.failed === 0 ? 'completed' : 'completed_with_errors',
      completedAt: new Date(),
      errorLog: results.errors
    });

    res.json({
      batchId: batch.batchId,
      ...results
    });

  } catch (error) {
    console.error('KEV import error:', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
});

/**
 * POST /api/import/kev-historical/rollback/:batchId
 * Rollback a KEV historical import batch
 */
router.post('/kev-historical/rollback/:batchId', async (req, res) => {
  try {
    const batch = await ImportBatch.findOne({
      where: { batchId: req.params.batchId }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (batch.importType !== 'kev_historical') {
      return res.status(400).json({ message: 'Batch is not a KEV historical import' });
    }

    if (batch.status === 'rolled_back') {
      return res.status(400).json({ message: 'Batch already rolled back' });
    }

    const transaction = await sequelize.transaction();

    try {
      // Get file paths before deleting records
      const recordsToDelete = await KevHistorical.findAll({
        where: { importBatchId: batch.id },
        attributes: ['filePath'],
        transaction
      });

      // Delete all KEV historical records from this batch (cascades to categories)
      const deletedCount = await KevHistorical.destroy({
        where: { importBatchId: batch.id },
        transaction
      });

      await batch.update({
        status: 'rolled_back'
      }, { transaction });

      await transaction.commit();

      // Delete files from disk after successful database commit
      let filesDeleted = 0;
      for (const record of recordsToDelete) {
        if (record.filePath) {
          const filePath = path.join(KEV_UPLOADS_DIR, record.filePath);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              filesDeleted++;
            }
          } catch (fileErr) {
            console.warn(`Could not delete file ${filePath}:`, fileErr.message);
          }
        }
      }

      res.json({
        message: 'Batch rolled back successfully',
        deletedCount,
        filesDeleted
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('KEV rollback error:', error);
    res.status(500).json({ message: 'Rollback failed', error: error.message });
  }
});

/**
 * GET /api/import/kev-historical
 * Get KEV historical data for trending
 */
router.get('/kev-historical', async (req, res) => {
  try {
    const { facilityId, startDate, endDate } = req.query;

    const where = {};

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (startDate || endDate) {
      // Filter by date range
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date();

      where[Op.and] = [
        sequelize.literal(`(year * 100 + month) >= ${start.getFullYear() * 100 + (start.getMonth() + 1)}`),
        sequelize.literal(`(year * 100 + month) <= ${end.getFullYear() * 100 + (end.getMonth() + 1)}`)
      ];
    }

    const kevHistoricals = await KevHistorical.findAll({
      where,
      include: [
        {
          model: Facility,
          as: 'facility',
          attributes: ['id', 'name']
        },
        {
          model: KevHistoricalCategory,
          as: 'categories',
          attributes: ['categoryName', 'possibleScore', 'metScore', 'percentage', 'sortOrder']
        }
      ],
      order: [
        ['year', 'ASC'],
        ['month', 'ASC'],
        [{ model: KevHistoricalCategory, as: 'categories' }, 'sortOrder', 'ASC']
      ]
    });

    res.json({ data: kevHistoricals });
  } catch (error) {
    console.error('KEV historical fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch KEV historical data', error: error.message });
  }
});

/**
 * GET /api/import/kev-historical/summary
 * Get summary of KEV historical data by facility
 */
router.get('/kev-historical/summary', async (req, res) => {
  try {
    const summary = await KevHistorical.findAll({
      attributes: [
        'facilityId',
        [sequelize.fn('COUNT', sequelize.col('KevHistorical.id')), 'recordCount'],
        [sequelize.fn('MIN', sequelize.literal('year * 100 + month')), 'earliestPeriod'],
        [sequelize.fn('MAX', sequelize.literal('year * 100 + month')), 'latestPeriod'],
        [sequelize.fn('AVG', sequelize.col('overall_score')), 'avgScore']
      ],
      include: [
        {
          model: Facility,
          as: 'facility',
          attributes: ['id', 'name']
        }
      ],
      group: ['facilityId', 'facility.id', 'facility.name'],
      raw: true,
      nest: true
    });

    // Format the results
    const formatted = summary.map(s => ({
      facilityId: s.facilityId,
      facilityName: s.facility.name,
      recordCount: parseInt(s.recordCount),
      earliestPeriod: {
        year: Math.floor(s.earliestPeriod / 100),
        month: s.earliestPeriod % 100
      },
      latestPeriod: {
        year: Math.floor(s.latestPeriod / 100),
        month: s.latestPeriod % 100
      },
      avgScore: parseFloat(s.avgScore).toFixed(1)
    }));

    res.json({ data: formatted });
  } catch (error) {
    console.error('KEV summary fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch summary', error: error.message });
  }
});

/**
 * GET /api/import/kev-historical/:id/download
 * Download the original KEV scorecard file
 */
router.get('/kev-historical/:id/download', async (req, res) => {
  try {
    const kevHistorical = await KevHistorical.findByPk(req.params.id);

    if (!kevHistorical) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (!kevHistorical.filePath) {
      return res.status(404).json({ message: 'File not available for this record' });
    }

    const filePath = path.join(KEV_UPLOADS_DIR, kevHistorical.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    // Set headers for download with original filename
    res.setHeader('Content-Disposition', `attachment; filename="${kevHistorical.originalFilename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('KEV download error:', error);
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
});

/**
 * DELETE /api/import/kev-historical/:id
 * Delete a single KEV historical record
 */
router.delete('/kev-historical/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const kevHistorical = await KevHistorical.findByPk(req.params.id);

    if (!kevHistorical) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Delete the file from disk if it exists
    if (kevHistorical.filePath) {
      const filePath = path.join(KEV_UPLOADS_DIR, kevHistorical.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the record (categories will cascade delete)
    await kevHistorical.destroy();

    res.json({ message: 'KEV historical record deleted successfully' });
  } catch (error) {
    console.error('KEV delete error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

/**
 * GET /api/import/kev-historical/facility/:facilityId
 * Get KEV historical data for a specific facility (for facility detail page)
 */
router.get('/kev-historical/facility/:facilityId', async (req, res) => {
  try {
    const kevHistoricals = await KevHistorical.findAll({
      where: { facilityId: req.params.facilityId },
      include: [
        {
          model: KevHistoricalCategory,
          as: 'categories',
          attributes: ['categoryName', 'possibleScore', 'metScore', 'percentage', 'sortOrder']
        }
      ],
      order: [
        ['year', 'DESC'],
        ['month', 'DESC'],
        [{ model: KevHistoricalCategory, as: 'categories' }, 'sortOrder', 'ASC']
      ]
    });

    res.json({ data: kevHistoricals });
  } catch (error) {
    console.error('KEV facility fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch data', error: error.message });
  }
});

module.exports = router;
