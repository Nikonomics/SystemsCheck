const express = require('express');
const { Op } = require('sequelize');
const { Company, Team, Facility, Scorecard } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const sequelize = require('../config/database');

const router = express.Router();

// All routes require authentication (admin and corporate roles have access)
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'corporate'));

// ============================================
// COMPANIES
// ============================================

/**
 * GET /api/organization/companies
 * List all companies with counts
 */
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [{
        model: Team,
        as: 'teams',
        attributes: ['id'],
        include: [{
          model: Facility,
          as: 'facilities',
          attributes: ['id'],
          where: { isActive: true },
          required: false,
        }],
      }],
      order: [['name', 'ASC']],
    });

    const formattedCompanies = companies.map(c => ({
      id: c.id,
      name: c.name,
      teamCount: c.teams?.length || 0,
      facilityCount: c.teams?.reduce((sum, t) => sum + (t.facilities?.length || 0), 0) || 0,
      createdAt: c.createdAt,
    }));

    res.json({ companies: formattedCompanies });
  } catch (error) {
    console.error('List companies error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to list companies' });
  }
});

/**
 * GET /api/organization/companies/:id
 * Get a single company
 */
router.get('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [{
        model: Team,
        as: 'teams',
        include: [{
          model: Facility,
          as: 'facilities',
          where: { isActive: true },
          required: false,
        }],
      }],
    });

    if (!company) {
      return res.status(404).json({ error: 'Not found', message: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to get company' });
  }
});

/**
 * POST /api/organization/companies
 * Create a new company
 */
router.post('/companies', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Company name is required'
      });
    }

    // Check for duplicate name
    const existing = await Company.findOne({
      where: { name: { [Op.iLike]: name.trim() } }
    });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A company with this name already exists'
      });
    }

    const company = await Company.create({ name: name.trim() });

    res.status(201).json({ company });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to create company' });
  }
});

/**
 * PUT /api/organization/companies/:id
 * Update a company
 */
router.put('/companies/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ error: 'Not found', message: 'Company not found' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Company name is required'
      });
    }

    // Check for duplicate name
    const existing = await Company.findOne({
      where: {
        name: { [Op.iLike]: name.trim() },
        id: { [Op.ne]: company.id }
      }
    });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A company with this name already exists'
      });
    }

    company.name = name.trim();
    await company.save();

    res.json({ company });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to update company' });
  }
});

/**
 * DELETE /api/organization/companies/:id
 * Delete a company (only if no teams)
 */
router.delete('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [{ model: Team, as: 'teams' }]
    });

    if (!company) {
      return res.status(404).json({ error: 'Not found', message: 'Company not found' });
    }

    if (company.teams?.length > 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Cannot delete company with existing teams. Remove teams first.'
      });
    }

    await company.destroy();

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to delete company' });
  }
});

// ============================================
// TEAMS
// ============================================

/**
 * GET /api/organization/teams
 * List all teams with filters
 */
router.get('/teams', async (req, res) => {
  try {
    const { company_id } = req.query;
    const whereClause = {};

    if (company_id) {
      whereClause.companyId = parseInt(company_id);
    }

    const teams = await Team.findAll({
      where: whereClause,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        {
          model: Facility,
          as: 'facilities',
          attributes: ['id'],
          where: { isActive: true },
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    const formattedTeams = teams.map(t => ({
      id: t.id,
      name: t.name,
      company: t.company,
      facilityCount: t.facilities?.length || 0,
      createdAt: t.createdAt,
    }));

    res.json({ teams: formattedTeams });
  } catch (error) {
    console.error('List teams error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to list teams' });
  }
});

/**
 * GET /api/organization/teams/:id
 * Get a single team
 */
router.get('/teams/:id', async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        { model: Company, as: 'company' },
        {
          model: Facility,
          as: 'facilities',
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ error: 'Not found', message: 'Team not found' });
    }

    res.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to get team' });
  }
});

/**
 * POST /api/organization/teams
 * Create a new team
 */
router.post('/teams', async (req, res) => {
  try {
    const { name, companyId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Team name is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Company is required'
      });
    }

    // Verify company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid company ID'
      });
    }

    const team = await Team.create({
      name: name.trim(),
      companyId: parseInt(companyId),
    });

    const createdTeam = await Team.findByPk(team.id, {
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    });

    res.status(201).json({ team: createdTeam });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to create team' });
  }
});

/**
 * PUT /api/organization/teams/:id
 * Update a team
 */
router.put('/teams/:id', async (req, res) => {
  try {
    const { name, companyId } = req.body;
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ error: 'Not found', message: 'Team not found' });
    }

    if (name) {
      team.name = name.trim();
    }

    if (companyId) {
      // Verify company exists
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid company ID'
        });
      }
      team.companyId = parseInt(companyId);
    }

    await team.save();

    const updatedTeam = await Team.findByPk(team.id, {
      include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    });

    res.json({ team: updatedTeam });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to update team' });
  }
});

/**
 * DELETE /api/organization/teams/:id
 * Delete a team (only if no facilities)
 */
router.delete('/teams/:id', async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [{
        model: Facility,
        as: 'facilities',
        where: { isActive: true },
        required: false,
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Not found', message: 'Team not found' });
    }

    if (team.facilities?.length > 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Cannot delete team with existing facilities. Remove or reassign facilities first.'
      });
    }

    await team.destroy();

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to delete team' });
  }
});

// ============================================
// FACILITIES (Admin CRUD)
// ============================================

/**
 * GET /api/organization/facilities
 * List all facilities with filters
 */
router.get('/facilities', async (req, res) => {
  try {
    const { company_id, team_id, search, status } = req.query;
    const whereClause = {};
    const teamWhere = {};

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    if (team_id) {
      whereClause.teamId = parseInt(team_id);
    }

    if (company_id) {
      teamWhere.companyId = parseInt(company_id);
    }

    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const facilities = await Facility.findAll({
      where: whereClause,
      include: [{
        model: Team,
        as: 'team',
        where: Object.keys(teamWhere).length > 0 ? teamWhere : undefined,
        include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      }],
      order: [['name', 'ASC']],
    });

    res.json({ facilities });
  } catch (error) {
    console.error('List facilities error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to list facilities' });
  }
});

/**
 * GET /api/organization/facilities/:id
 * Get a single facility
 */
router.get('/facilities/:id', async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id, {
      include: [{
        model: Team,
        as: 'team',
        include: [{ model: Company, as: 'company' }],
      }],
    });

    if (!facility) {
      return res.status(404).json({ error: 'Not found', message: 'Facility not found' });
    }

    res.json({ facility });
  } catch (error) {
    console.error('Get facility error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to get facility' });
  }
});

/**
 * POST /api/organization/facilities
 * Create a new facility
 */
router.post('/facilities', async (req, res) => {
  try {
    const { name, facilityType, teamId, address, city, state, zipCode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Facility name is required'
      });
    }

    if (!teamId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Team is required'
      });
    }

    // Verify team exists
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid team ID'
      });
    }

    const validTypes = ['SNF', 'ALF', 'ILF'];
    if (facilityType && !validTypes.includes(facilityType)) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Facility type must be one of: ${validTypes.join(', ')}`
      });
    }

    const facility = await Facility.create({
      name: name.trim(),
      facilityType: facilityType || 'SNF',
      teamId: parseInt(teamId),
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zipCode: zipCode?.trim() || null,
      isActive: true,
    });

    const createdFacility = await Facility.findByPk(facility.id, {
      include: [{
        model: Team,
        as: 'team',
        include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      }],
    });

    res.status(201).json({ facility: createdFacility });
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to create facility' });
  }
});

/**
 * PUT /api/organization/facilities/:id
 * Update a facility
 */
router.put('/facilities/:id', async (req, res) => {
  try {
    const { name, facilityType, teamId, address, city, state, zipCode, isActive } = req.body;
    const facility = await Facility.findByPk(req.params.id);

    if (!facility) {
      return res.status(404).json({ error: 'Not found', message: 'Facility not found' });
    }

    if (name) {
      facility.name = name.trim();
    }

    if (facilityType) {
      const validTypes = ['SNF', 'ALF', 'ILF'];
      if (!validTypes.includes(facilityType)) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Facility type must be one of: ${validTypes.join(', ')}`
        });
      }
      facility.facilityType = facilityType;
    }

    if (teamId) {
      // Verify team exists
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid team ID'
        });
      }
      facility.teamId = parseInt(teamId);
    }

    if (address !== undefined) facility.address = address?.trim() || null;
    if (city !== undefined) facility.city = city?.trim() || null;
    if (state !== undefined) facility.state = state?.trim() || null;
    if (zipCode !== undefined) facility.zipCode = zipCode?.trim() || null;
    if (typeof isActive === 'boolean') facility.isActive = isActive;

    await facility.save();

    const updatedFacility = await Facility.findByPk(facility.id, {
      include: [{
        model: Team,
        as: 'team',
        include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
      }],
    });

    res.json({ facility: updatedFacility });
  } catch (error) {
    console.error('Update facility error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to update facility' });
  }
});

/**
 * DELETE /api/organization/facilities/:id
 * Soft delete a facility
 */
router.delete('/facilities/:id', async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);

    if (!facility) {
      return res.status(404).json({ error: 'Not found', message: 'Facility not found' });
    }

    // Soft delete
    facility.isActive = false;
    await facility.save();

    res.json({ message: 'Facility deactivated successfully' });
  } catch (error) {
    console.error('Delete facility error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to delete facility' });
  }
});

// ============================================
// SETTINGS / EXPORTS
// ============================================

/**
 * GET /api/organization/export/scorecards
 * Export all scorecards as CSV data
 */
router.get('/export/scorecards', async (req, res) => {
  try {
    const scorecards = await Scorecard.findAll({
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['name'],
        include: [{
          model: Team,
          as: 'team',
          attributes: ['name'],
          include: [{
            model: Company,
            as: 'company',
            attributes: ['name'],
          }],
        }],
      }],
      where: { status: 'hard_close' },
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    const csvData = scorecards.map(sc => ({
      facility: sc.facility?.name,
      team: sc.facility?.team?.name,
      company: sc.facility?.team?.company?.name,
      month: sc.month,
      year: sc.year,
      totalScore: sc.totalScore,
      status: sc.status,
      hardClosedAt: sc.hardClosedAt,
    }));

    res.json({ data: csvData });
  } catch (error) {
    console.error('Export scorecards error:', error);
    res.status(500).json({ error: 'Server error', message: 'Failed to export data' });
  }
});

module.exports = router;
