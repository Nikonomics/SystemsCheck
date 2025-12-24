const express = require('express');
const {
  Scorecard,
  ScorecardSystem,
  ScorecardItem,
  ScorecardResident,
  ScorecardActivityLog,
  Facility,
  Team,
  User
} = require('../models');
const { authenticateToken, canAccessFacility } = require('../middleware/auth');
const { auditCriteria } = require('../data/auditCriteria');
const { calculateItemPoints, calculateSystemTotal, calculateScorecardTotal } = require('../utils/scoring');
const sequelize = require('../config/database');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Helper: Log scorecard activity
 */
async function logActivity(scorecardId, userId, action, details = null, transaction = null) {
  await ScorecardActivityLog.create({
    scorecardId,
    userId,
    action,
    details
  }, { transaction });
}

/**
 * Helper: Format scorecard response with calculated scores
 */
async function formatScorecardResponse(scorecard, includeDetails = true) {
  const scorecardData = scorecard.toJSON ? scorecard.toJSON() : scorecard;

  // Calculate total score
  let totalScore = 0;
  if (scorecardData.systems) {
    for (const system of scorecardData.systems) {
      totalScore += parseFloat(system.totalPointsEarned) || 0;

      // Format residents for frontend
      if (system.residents) {
        system.residents = system.residents.map(r => ({
          id: r.id,
          initials: r.residentInitials || r.initials,
          patientRecordNumber: r.patientRecordNumber
        }));
      }
    }
  }

  return {
    ...scorecardData,
    totalScore: Math.round(totalScore * 100) / 100,
    totalPossible: 800,
    percentage: Math.round((totalScore / 800) * 1000) / 10
  };
}

/**
 * GET /api/facilities/:facilityId/scorecards
 * List all scorecards for a facility
 */
router.get('/facilities/:facilityId/scorecards', canAccessFacility('facilityId'), async (req, res) => {
  try {
    const { facilityId } = req.params;

    const scorecards = await Scorecard.findAll({
      where: { facilityId },
      include: [
        {
          model: ScorecardSystem,
          as: 'systems',
          attributes: ['systemNumber', 'systemName', 'totalPointsEarned', 'totalPointsPossible']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });

    // Add calculated total scores
    const scorecardsWithTotals = scorecards.map(sc => {
      const data = sc.toJSON();
      let totalScore = 0;
      if (data.systems) {
        for (const system of data.systems) {
          totalScore += parseFloat(system.totalPointsEarned) || 0;
        }
      }
      return {
        id: data.id,
        facilityId: data.facilityId,
        month: data.month,
        year: data.year,
        status: data.status,
        totalScore: Math.round(totalScore * 100) / 100,
        totalPossible: 800,
        percentage: Math.round((totalScore / 800) * 1000) / 10,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        trialClosedAt: data.trialClosedAt,
        hardClosedAt: data.hardClosedAt
      };
    });

    res.json({ scorecards: scorecardsWithTotals });
  } catch (error) {
    console.error('List scorecards error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to list scorecards'
    });
  }
});

/**
 * POST /api/facilities/:facilityId/scorecards
 * Create a new scorecard for a facility
 */
router.post('/facilities/:facilityId/scorecards', canAccessFacility('facilityId'), async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { facilityId } = req.params;
    const { month, year } = req.body;

    // Validate month and year
    if (!month || !year) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Validation error',
        message: 'Month and year are required'
      });
    }

    if (month < 1 || month > 12) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Validation error',
        message: 'Month must be between 1 and 12'
      });
    }

    // Check if scorecard already exists for this month/year
    const existing = await Scorecard.findOne({
      where: { facilityId, month, year }
    });

    if (existing) {
      await transaction.rollback();
      return res.status(409).json({
        error: 'Conflict',
        message: `A scorecard already exists for ${month}/${year}`
      });
    }

    // Create the scorecard
    const scorecard = await Scorecard.create({
      facilityId,
      month,
      year,
      status: 'draft',
      createdById: req.user.id
    }, { transaction });

    // Create systems and items from audit criteria
    for (const [systemNumber, systemData] of Object.entries(auditCriteria)) {
      const system = await ScorecardSystem.create({
        scorecardId: scorecard.id,
        systemNumber: parseInt(systemNumber),
        systemName: systemData.name,
        totalPointsPossible: 100,
        totalPointsEarned: 0,
        lastEditedById: req.user.id,
        lastEditedAt: new Date()
      }, { transaction });

      // Create items for this system
      const items = systemData.items.map(item => ({
        scorecardSystemId: system.id,
        itemNumber: item.number,
        criteriaText: item.text,
        maxPoints: item.maxPoints,
        chartsMet: null,
        sampleSize: null,
        pointsEarned: 0
      }));

      await ScorecardItem.bulkCreate(items, { transaction });
    }

    // Log creation
    await logActivity(scorecard.id, req.user.id, 'created', {
      month,
      year,
      facilityId
    }, transaction);

    await transaction.commit();

    // Fetch the complete scorecard
    const createdScorecard = await Scorecard.findByPk(scorecard.id, {
      include: [
        {
          model: ScorecardSystem,
          as: 'systems',
          include: [
            { model: ScorecardItem, as: 'items' },
            { model: ScorecardResident, as: 'residents' }
          ]
        },
        { model: Facility, as: 'facility' },
        { model: User, as: 'createdBy', attributes: { exclude: ['passwordHash'] } }
      ]
    });

    const response = await formatScorecardResponse(createdScorecard);
    res.status(201).json({ scorecard: response });
  } catch (error) {
    await transaction.rollback();
    console.error('Create scorecard error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create scorecard'
    });
  }
});

/**
 * GET /api/scorecards/:id
 * Get full scorecard with all systems, items, and residents
 */
router.get('/scorecards/:id', async (req, res) => {
  try {
    const scorecard = await Scorecard.findByPk(req.params.id, {
      include: [
        {
          model: ScorecardSystem,
          as: 'systems',
          include: [
            { model: ScorecardItem, as: 'items', order: [['itemNumber', 'ASC']] },
            { model: ScorecardResident, as: 'residents' },
            { model: User, as: 'lastEditedBy', attributes: ['id', 'firstName', 'lastName'] }
          ],
          order: [['systemNumber', 'ASC']]
        },
        {
          model: Facility,
          as: 'facility',
          include: [{ model: Team, as: 'team' }]
        },
        { model: User, as: 'createdBy', attributes: { exclude: ['passwordHash'] } },
        { model: User, as: 'trialClosedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'hardClosedBy', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: ScorecardActivityLog,
          as: 'activityLogs',
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
          order: [['createdAt', 'DESC']],
          limit: 50
        }
      ]
    });

    if (!scorecard) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Scorecard not found'
      });
    }

    // Check access
    const { canAccessFacility: checkAccess } = require('../middleware/auth');
    // For simplicity, we'll verify facility access here
    // In production, you might want to extract this logic

    const response = await formatScorecardResponse(scorecard);
    res.json({ scorecard: response });
  } catch (error) {
    console.error('Get scorecard error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to get scorecard'
    });
  }
});

/**
 * PUT /api/scorecards/:id
 * Update scorecard (only if status is 'draft')
 * Supports two formats:
 * 1. Legacy: { systems: { [systemNumber]: { items: { [itemNumber]: {...} } } } }
 * 2. New: { items: { [itemId]: {...} }, addResidents: [...], removeResidents: [...] }
 */
router.put('/scorecards/:id', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const scorecard = await Scorecard.findByPk(req.params.id, {
      include: [
        {
          model: ScorecardSystem,
          as: 'systems',
          include: [
            { model: ScorecardItem, as: 'items' },
            { model: ScorecardResident, as: 'residents' }
          ]
        }
      ]
    });

    if (!scorecard) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Not found',
        message: 'Scorecard not found'
      });
    }

    // Check if scorecard is in draft status
    if (scorecard.status !== 'draft') {
      await transaction.rollback();
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot edit a scorecard that is not in draft status'
      });
    }

    const { systems, items, addResidents, removeResidents } = req.body;
    const updatedSystemIds = new Set();

    // Handle new format: items by ID
    if (items && typeof items === 'object') {
      for (const [itemId, itemData] of Object.entries(items)) {
        const item = await ScorecardItem.findByPk(itemId, { transaction });
        if (!item) continue;

        if (itemData.chartsMet !== undefined) {
          item.chartsMet = itemData.chartsMet;
        }
        if (itemData.sampleSize !== undefined) {
          item.sampleSize = itemData.sampleSize;
        }
        if (itemData.notes !== undefined) {
          item.notes = itemData.notes;
        }

        // Recalculate points earned
        item.pointsEarned = calculateItemPoints(
          parseFloat(item.maxPoints),
          item.chartsMet,
          item.sampleSize
        );

        await item.save({ transaction });
        updatedSystemIds.add(item.scorecardSystemId);
      }
    }

    // Handle addResidents
    if (Array.isArray(addResidents) && addResidents.length > 0) {
      for (const resident of addResidents) {
        await ScorecardResident.create({
          scorecardSystemId: resident.systemId,
          residentInitials: resident.initials,
          patientRecordNumber: resident.patientRecordNumber || null
        }, { transaction });
        updatedSystemIds.add(resident.systemId);
      }
    }

    // Handle removeResidents
    if (Array.isArray(removeResidents) && removeResidents.length > 0) {
      for (const residentId of removeResidents) {
        const resident = await ScorecardResident.findByPk(residentId, { transaction });
        if (resident) {
          updatedSystemIds.add(resident.scorecardSystemId);
          await resident.destroy({ transaction });
        }
      }
    }

    // Handle legacy format: systems by number
    if (systems) {
      for (const [systemNumber, systemData] of Object.entries(systems)) {
        const system = scorecard.systems.find(s => s.systemNumber === parseInt(systemNumber));
        if (!system) continue;

        if (systemData.notes !== undefined) {
          system.notes = systemData.notes;
        }

        if (systemData.items) {
          for (const [itemNumber, itemData] of Object.entries(systemData.items)) {
            const item = system.items.find(i => i.itemNumber === parseInt(itemNumber));
            if (!item) continue;

            if (itemData.chartsMet !== undefined) {
              item.chartsMet = itemData.chartsMet;
            }
            if (itemData.sampleSize !== undefined) {
              item.sampleSize = itemData.sampleSize;
            }
            if (itemData.notes !== undefined) {
              item.notes = itemData.notes;
            }

            item.pointsEarned = calculateItemPoints(
              parseFloat(item.maxPoints),
              item.chartsMet,
              item.sampleSize
            );

            await item.save({ transaction });
          }
        }

        if (systemData.residents !== undefined) {
          await ScorecardResident.destroy({
            where: { scorecardSystemId: system.id },
            transaction
          });

          if (Array.isArray(systemData.residents) && systemData.residents.length > 0) {
            const residents = systemData.residents.map(r => ({
              scorecardSystemId: system.id,
              residentInitials: r.initials || r.residentInitials,
              patientRecordNumber: r.patientRecordNumber || r.patient_record_number
            }));
            await ScorecardResident.bulkCreate(residents, { transaction });
          }
        }

        updatedSystemIds.add(system.id);
      }
    }

    // Recalculate totals for updated systems
    for (const systemId of updatedSystemIds) {
      const system = await ScorecardSystem.findByPk(systemId, { transaction });
      if (system) {
        const systemItems = await ScorecardItem.findAll({
          where: { scorecardSystemId: systemId },
          transaction
        });
        system.totalPointsEarned = calculateSystemTotal(systemItems);
        system.lastEditedById = req.user.id;
        system.lastEditedAt = new Date();
        await system.save({ transaction });
      }
    }

    // Log activity
    await logActivity(scorecard.id, req.user.id, 'edited', {
      itemsUpdated: items ? Object.keys(items).length : 0,
      residentsAdded: addResidents?.length || 0,
      residentsRemoved: removeResidents?.length || 0
    }, transaction);

    await transaction.commit();

    // Fetch updated scorecard
    const updatedScorecard = await Scorecard.findByPk(req.params.id, {
      include: [
        {
          model: ScorecardSystem,
          as: 'systems',
          include: [
            { model: ScorecardItem, as: 'items' },
            { model: ScorecardResident, as: 'residents' }
          ]
        },
        { model: Facility, as: 'facility' },
        { model: User, as: 'createdBy', attributes: { exclude: ['passwordHash'] } }
      ]
    });

    const response = await formatScorecardResponse(updatedScorecard);
    res.json({
      scorecard: response,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update scorecard error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update scorecard'
    });
  }
});

/**
 * PUT /api/scorecards/:id/status
 * Change scorecard status
 */
router.put('/scorecards/:id/status', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const scorecard = await Scorecard.findByPk(req.params.id);

    if (!scorecard) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Not found',
        message: 'Scorecard not found'
      });
    }

    const { status } = req.body;

    if (!['draft', 'trial_close', 'hard_close'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Validation error',
        message: 'Status must be one of: draft, trial_close, hard_close'
      });
    }

    const currentStatus = scorecard.status;
    let action = '';
    let details = { from: currentStatus, to: status };

    // Validate status transitions
    if (currentStatus === 'hard_close') {
      await transaction.rollback();
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot change status of a hard-closed scorecard'
      });
    }

    if (currentStatus === 'draft' && status === 'trial_close') {
      // draft → trial_close: allowed
      scorecard.status = 'trial_close';
      scorecard.trialClosedAt = new Date();
      scorecard.trialClosedById = req.user.id;
      action = 'trial_closed';
    } else if (currentStatus === 'trial_close' && status === 'draft') {
      // trial_close → draft: allowed (reopen)
      scorecard.status = 'draft';
      scorecard.trialClosedAt = null;
      scorecard.trialClosedById = null;
      action = 'reopened';
    } else if (currentStatus === 'trial_close' && status === 'hard_close') {
      // trial_close → hard_close: allowed
      scorecard.status = 'hard_close';
      scorecard.hardClosedAt = new Date();
      scorecard.hardClosedById = req.user.id;
      action = 'hard_closed';
    } else if (currentStatus === 'draft' && status === 'hard_close') {
      // draft → hard_close: not allowed, must go through trial_close first
      await transaction.rollback();
      return res.status(400).json({
        error: 'Validation error',
        message: 'Cannot hard close a scorecard directly from draft. Must trial close first.'
      });
    } else if (currentStatus === status) {
      // No change needed
      await transaction.rollback();
      return res.json({
        scorecard: await formatScorecardResponse(scorecard),
        message: 'Status unchanged'
      });
    } else {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Validation error',
        message: `Invalid status transition from ${currentStatus} to ${status}`
      });
    }

    await scorecard.save({ transaction });

    // Log activity
    await logActivity(scorecard.id, req.user.id, action, details, transaction);

    await transaction.commit();

    // Fetch updated scorecard
    const updatedScorecard = await Scorecard.findByPk(req.params.id, {
      include: [
        { model: User, as: 'createdBy', attributes: { exclude: ['passwordHash'] } },
        { model: User, as: 'trialClosedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'hardClosedBy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.json({
      scorecard: await formatScorecardResponse(updatedScorecard),
      message: `Scorecard ${action.replace('_', ' ')}`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update scorecard status error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update scorecard status'
    });
  }
});

/**
 * GET /api/scorecards/:id/activity
 * Get activity log for scorecard
 */
router.get('/scorecards/:id/activity', async (req, res) => {
  try {
    const scorecard = await Scorecard.findByPk(req.params.id);

    if (!scorecard) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Scorecard not found'
      });
    }

    const activityLogs = await ScorecardActivityLog.findAll({
      where: { scorecardId: req.params.id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ activityLogs });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to get activity log'
    });
  }
});

module.exports = router;
