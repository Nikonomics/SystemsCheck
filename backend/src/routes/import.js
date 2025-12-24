const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { Scorecard, ScorecardSystem, Facility } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

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

module.exports = router;
