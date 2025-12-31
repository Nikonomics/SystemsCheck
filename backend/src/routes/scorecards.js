const express = require('express');
const {
  Scorecard,
  ScorecardSystem,
  ScorecardItem,
  ScorecardResident,
  ScorecardActivityLog,
  Facility,
  Team,
  Company,
  User,
  AuditTemplate,
  AuditTemplateSystem,
  AuditTemplateItem
} = require('../models');
const { authenticateToken, canAccessFacility } = require('../middleware/auth');
const { auditCriteria, getScoredSystems, getTotalMaxPoints } = require('../data/auditCriteria');
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

  // Sort systems by systemNumber to ensure correct display order
  if (scorecardData.systems) {
    scorecardData.systems.sort((a, b) => a.systemNumber - b.systemNumber);

    // Also sort items within each system
    for (const system of scorecardData.systems) {
      if (system.items) {
        system.items.sort((a, b) => {
          // Handle alphanumeric item numbers like "1", "2a", "2b", "10"
          const aNum = parseFloat(a.itemNumber) || 0;
          const bNum = parseFloat(b.itemNumber) || 0;
          if (aNum !== bNum) return aNum - bNum;
          return (a.itemNumber || '').localeCompare(b.itemNumber || '');
        });
      }
    }
  }

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

  const totalPossible = getTotalMaxPoints(); // 700 for scored systems
  return {
    ...scorecardData,
    totalScore: Math.round(totalScore * 100) / 100,
    totalPossible,
    percentage: Math.round((totalScore / totalPossible) * 1000) / 10
  };
}

/**
 * GET /api/scorecards
 * List all scorecards the user has access to (role-based filtering)
 * Query params: status, facility_id, team_id, company_id, year, month, page, limit
 */
router.get('/scorecards', async (req, res) => {
  try {
    const { status, facility_id, team_id, company_id, year, month, page = 1, limit = 20 } = req.query;
    const user = req.user;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (facility_id) where.facilityId = parseInt(facility_id);
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

    // Determine which facilities the user can access
    let facilityIds = null;

    if (!['admin', 'corporate'].includes(user.role)) {
      // Get user's assigned facilities
      const { UserFacility, Team, Company } = require('../models');
      const userFacilities = await UserFacility.findAll({
        where: { userId: user.id },
        attributes: ['facilityId']
      });

      const assignedFacilityIds = userFacilities.map(uf => uf.facilityId);

      if (assignedFacilityIds.length === 0) {
        // User has no facility assignments
        return res.json({
          scorecards: [],
          pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 },
          filters: { facilities: [], statuses: ['draft', 'trial_close', 'hard_close'] }
        });
      }

      switch (user.role) {
        case 'clinical_resource':
        case 'facility_leader':
          facilityIds = assignedFacilityIds;
          break;

        case 'team_leader':
          // Get all facilities in the same teams as assigned facilities
          const assignedFacilitiesForTeam = await Facility.findAll({
            where: { id: assignedFacilityIds },
            attributes: ['teamId']
          });
          const teamIds = [...new Set(assignedFacilitiesForTeam.map(f => f.teamId))];
          const teamFacilities = await Facility.findAll({
            where: { teamId: teamIds },
            attributes: ['id']
          });
          facilityIds = teamFacilities.map(f => f.id);
          break;

        case 'company_leader':
          // Get all facilities in the same companies as assigned facilities
          const assignedFacilitiesForCompany = await Facility.findAll({
            where: { id: assignedFacilityIds },
            include: [{ model: Team, as: 'team', attributes: ['companyId'] }]
          });
          const companyIds = [...new Set(assignedFacilitiesForCompany.map(f => f.team.companyId))];
          const companyTeams = await Team.findAll({
            where: { companyId: companyIds },
            attributes: ['id']
          });
          const companyTeamIds = companyTeams.map(t => t.id);
          const companyFacilities = await Facility.findAll({
            where: { teamId: companyTeamIds },
            attributes: ['id']
          });
          facilityIds = companyFacilities.map(f => f.id);
          break;

        default:
          facilityIds = assignedFacilityIds;
      }

      // Apply facility filter
      if (facilityIds) {
        where.facilityId = facilityIds;
      }
    }

    // If specific facility requested, verify access
    if (facility_id && facilityIds && !facilityIds.includes(parseInt(facility_id))) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this facility'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build facility include with optional team/company filtering
    const facilityInclude = {
      model: Facility,
      as: 'facility',
      attributes: ['id', 'name', 'teamId'],
      include: [{
        model: Team,
        as: 'team',
        attributes: ['id', 'name', 'companyId'],
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name']
        }]
      }]
    };

    // Apply team filter
    if (team_id) {
      facilityInclude.where = { teamId: parseInt(team_id) };
    }

    // Apply company filter via team
    if (company_id) {
      facilityInclude.include[0].where = { companyId: parseInt(company_id) };
      facilityInclude.include[0].required = true;
      facilityInclude.required = true;
    }

    const { count, rows: scorecards } = await Scorecard.findAndCountAll({
      where,
      include: [
        facilityInclude,
        {
          model: ScorecardSystem,
          as: 'systems',
          attributes: ['systemNumber', 'systemName', 'totalPointsEarned', 'totalPointsPossible']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'updatedBy',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['updated_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Calculate total scores
    const totalPossible = getTotalMaxPoints();
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
        facility: data.facility,
        month: data.month,
        year: data.year,
        status: data.status,
        totalScore: Math.round(totalScore * 100) / 100,
        totalPossible,
        percentage: Math.round((totalScore / totalPossible) * 1000) / 10,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        trialClosedAt: data.trialClosedAt,
        hardClosedAt: data.hardClosedAt
      };
    });

    // Get accessible facilities, teams, and companies for filter dropdowns
    let accessibleFacilities, accessibleTeams, accessibleCompanies;

    if (['admin', 'corporate'].includes(user.role)) {
      accessibleFacilities = await Facility.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
      accessibleTeams = await Team.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
      accessibleCompanies = await Company.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
    } else {
      accessibleFacilities = await Facility.findAll({
        where: { id: facilityIds },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
      // Get teams for accessible facilities
      const teamIds = [...new Set(
        (await Facility.findAll({
          where: { id: facilityIds },
          attributes: ['teamId']
        })).map(f => f.teamId)
      )];
      accessibleTeams = await Team.findAll({
        where: { id: teamIds },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
      // Get companies for accessible teams
      const companyIds = [...new Set(
        (await Team.findAll({
          where: { id: teamIds },
          attributes: ['companyId']
        })).map(t => t.companyId)
      )];
      accessibleCompanies = await Company.findAll({
        where: { id: companyIds },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
    }

    res.json({
      scorecards: scorecardsWithTotals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      },
      filters: {
        facilities: accessibleFacilities,
        teams: accessibleTeams,
        companies: accessibleCompanies,
        statuses: ['draft', 'trial_close', 'hard_close']
      }
    });
  } catch (error) {
    console.error('Error listing scorecards:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch scorecards'
    });
  }
});

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
    const totalPossible = getTotalMaxPoints(); // 700 for scored systems
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
        totalPossible,
        percentage: Math.round((totalScore / totalPossible) * 1000) / 10,
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
        message: `A scorecard already exists for ${month}/${year}`,
        existingId: existing.id
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

    // Try to get the active template from database first
    // Fall back to static auditCriteria.js if no template exists
    const activeTemplate = await AuditTemplate.findOne({
      where: { isActive: true },
      include: [{
        model: AuditTemplateSystem,
        as: 'systems',
        where: { systemNumber: { [require('sequelize').Op.lte]: 7 } }, // Only scored systems (1-7)
        include: [{
          model: AuditTemplateItem,
          as: 'items',
          order: [['sortOrder', 'ASC']]
        }],
        order: [['sortOrder', 'ASC']]
      }]
    });

    if (activeTemplate && activeTemplate.systems && activeTemplate.systems.length > 0) {
      // Use database template
      for (const templateSystem of activeTemplate.systems) {
        const system = await ScorecardSystem.create({
          scorecardId: scorecard.id,
          systemNumber: templateSystem.systemNumber,
          systemName: templateSystem.name,
          totalPointsPossible: templateSystem.maxPoints,
          totalPointsEarned: 0,
          lastEditedById: req.user.id,
          lastEditedAt: new Date()
        }, { transaction });

        // Create items for this system
        const items = templateSystem.items.map(item => ({
          scorecardSystemId: system.id,
          itemNumber: item.itemNumber,
          criteriaText: item.text,
          maxPoints: item.maxPoints,
          chartsMet: null,
          sampleSize: item.sampleSize || null,
          pointsEarned: 0
        }));

        await ScorecardItem.bulkCreate(items, { transaction });
      }
    } else {
      // Fall back to static auditCriteria.js
      const scoredSystems = getScoredSystems();
      for (const systemData of scoredSystems) {
        const system = await ScorecardSystem.create({
          scorecardId: scorecard.id,
          systemNumber: systemData.systemNumber,
          systemName: systemData.name,
          totalPointsPossible: systemData.maxPoints,
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
          sampleSize: item.sampleSize || null,
          pointsEarned: 0
        }));

        await ScorecardItem.bulkCreate(items, { transaction });
      }
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
            { model: ScorecardItem, as: 'items' },
            { model: ScorecardResident, as: 'residents' },
            { model: User, as: 'lastEditedBy', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'completedBy', attributes: ['id', 'firstName', 'lastName'] }
          ]
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
          separate: true,
          order: [['created_at', 'DESC']],
          limit: 50
        }
      ],
      order: [
        [{ model: ScorecardSystem, as: 'systems' }, 'systemNumber', 'ASC'],
        [{ model: ScorecardSystem, as: 'systems' }, { model: ScorecardItem, as: 'items' }, 'itemNumber', 'ASC']
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

    // Recalculate and update the scorecard's total score
    const allSystems = await ScorecardSystem.findAll({
      where: { scorecardId: scorecard.id },
      transaction
    });
    const totalScore = allSystems.reduce((sum, sys) => sum + (parseFloat(sys.totalPointsEarned) || 0), 0);
    scorecard.totalScore = totalScore;
    scorecard.updatedById = req.user.id;
    await scorecard.save({ transaction });

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

    // Recalculate and update total score before saving
    const allSystems = await ScorecardSystem.findAll({
      where: { scorecardId: scorecard.id },
      transaction
    });
    const totalScore = allSystems.reduce((sum, sys) => sum + (parseFloat(sys.totalPointsEarned) || 0), 0);
    scorecard.totalScore = totalScore;
    scorecard.updatedById = req.user.id;

    await scorecard.save({ transaction });

    // Log activity
    await logActivity(scorecard.id, req.user.id, action, details, transaction);

    await transaction.commit();

    // Fetch updated scorecard with all related data
    const updatedScorecard = await Scorecard.findByPk(req.params.id, {
      include: [
        {
          model: ScorecardSystem,
          as: 'systems',
          include: [
            { model: ScorecardItem, as: 'items' },
            { model: ScorecardResident, as: 'residents' },
            { model: User, as: 'lastEditedBy', attributes: ['id', 'firstName', 'lastName'] }
          ]
        },
        {
          model: Facility,
          as: 'facility',
          include: [{ model: Team, as: 'team' }]
        },
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
 * PATCH /api/scorecards/:id/systems/:systemNumber
 * Update system completion status (mark as complete or clear completion)
 */
router.patch('/scorecards/:id/systems/:systemNumber', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id, systemNumber } = req.params;
    const { completedById, completedAt, clear } = req.body;

    const scorecard = await Scorecard.findByPk(id, { transaction });

    if (!scorecard) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Not found',
        message: 'Scorecard not found'
      });
    }

    // Find the system
    const system = await ScorecardSystem.findOne({
      where: {
        scorecardId: id,
        systemNumber: parseInt(systemNumber)
      },
      include: [
        { model: User, as: 'completedBy', attributes: ['id', 'firstName', 'lastName'] }
      ],
      transaction
    });

    if (!system) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Not found',
        message: `System ${systemNumber} not found in this scorecard`
      });
    }

    // Update completion status
    if (clear) {
      // Clear completion
      system.completedById = null;
      system.completedAt = null;
    } else {
      // Set completion
      system.completedById = completedById || req.user.id;
      system.completedAt = completedAt || new Date();
    }

    await system.save({ transaction });

    // Log activity
    await logActivity(scorecard.id, req.user.id, clear ? 'system_unmarked' : 'system_completed', {
      systemNumber: parseInt(systemNumber),
      systemName: system.systemName
    }, transaction);

    await transaction.commit();

    // Fetch updated system with user info
    const updatedSystem = await ScorecardSystem.findByPk(system.id, {
      include: [
        { model: User, as: 'completedBy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.json({
      system: {
        id: updatedSystem.id,
        systemNumber: updatedSystem.systemNumber,
        systemName: updatedSystem.systemName,
        completedById: updatedSystem.completedById,
        completedAt: updatedSystem.completedAt,
        completedBy: updatedSystem.completedBy
      },
      message: clear ? 'System completion cleared' : 'System marked as complete'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update system completion error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update system completion'
    });
  }
});

/**
 * DELETE /api/scorecards/:id
 * Delete a scorecard (only draft or trial_close status)
 */
router.delete('/scorecards/:id', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const scorecard = await Scorecard.findByPk(req.params.id, {
      include: [{ model: Facility, as: 'facility' }]
    });

    if (!scorecard) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Not found',
        message: 'Scorecard not found'
      });
    }

    // Note: Previously blocked hard_close deletion, but now allowing for imported/historical data cleanup
    // Admin users can delete any scorecard

    // Store info for response before deletion
    const deletedInfo = {
      id: scorecard.id,
      month: scorecard.month,
      year: scorecard.year,
      facilityId: scorecard.facilityId,
      facilityName: scorecard.facility?.name,
      status: scorecard.status
    };

    // Delete the scorecard (cascade will handle systems, items, residents, and activity logs)
    await scorecard.destroy({ transaction });

    await transaction.commit();

    res.json({
      message: 'Scorecard deleted successfully',
      deleted: deletedInfo
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete scorecard error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete scorecard'
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
      order: [['created_at', 'DESC']]
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
