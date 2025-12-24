const express = require('express');
const { Op, Sequelize } = require('sequelize');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  Facility,
  Team,
  Company,
  Scorecard,
  UserFacility,
} = require('../models');

/**
 * GET /api/facilities
 * List facilities with filtering and role-based access
 * Query params: search, company_id, team_id, facility_type, page, limit
 */
router.get('/facilities', authenticateToken, async (req, res) => {
  try {
    const { search, company_id, team_id, facility_type, page = 1, limit = 20 } = req.query;
    const user = req.user;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = { isActive: true };

    // Search by facility name
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    // Filter by facility type
    if (facility_type) {
      where.facilityType = facility_type;
    }

    // Build team filter based on company or direct team_id
    const teamWhere = {};
    if (company_id) {
      teamWhere.companyId = parseInt(company_id);
    }
    if (team_id) {
      where.teamId = parseInt(team_id);
    }

    // Role-based access filtering
    let facilityIds = null;

    if (user.role === 'clinical_resource') {
      // Only assigned facilities
      const assignments = await UserFacility.findAll({
        where: { userId: user.id },
        attributes: ['facilityId'],
      });
      facilityIds = assignments.map(a => a.facilityId);
      if (facilityIds.length === 0) {
        return res.json({
          facilities: [],
          pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 },
        });
      }
    } else if (user.role === 'team_leader') {
      // Facilities in user's team
      teamWhere.id = user.teamId;
    } else if (user.role === 'company_leader') {
      // Facilities in user's company
      const teams = await Team.findAll({
        where: { companyId: user.companyId },
        attributes: ['id'],
      });
      const teamIds = teams.map(t => t.id);
      where.teamId = { [Op.in]: teamIds };
    }
    // admin and corporate can see all facilities

    if (facilityIds) {
      where.id = { [Op.in]: facilityIds };
    }

    // Get current month/year for latest scorecard check
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Fetch facilities with team and company
    const { rows: facilities, count: total } = await Facility.findAndCountAll({
      where,
      include: [
        {
          model: Team,
          as: 'team',
          where: Object.keys(teamWhere).length > 0 ? teamWhere : undefined,
          include: [
            {
              model: Company,
              as: 'company',
            },
          ],
        },
      ],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset,
      distinct: true,
    });

    // Get latest scorecard for each facility (current month)
    const facilityIdsToQuery = facilities.map(f => f.id);
    const latestScorecards = await Scorecard.findAll({
      where: {
        facilityId: { [Op.in]: facilityIdsToQuery },
        month: currentMonth,
        year: currentYear,
      },
      attributes: ['id', 'facilityId', 'month', 'year', 'status', 'totalScore'],
    });

    const scorecardMap = {};
    latestScorecards.forEach(sc => {
      scorecardMap[sc.facilityId] = {
        id: sc.id,
        month: sc.month,
        year: sc.year,
        status: sc.status,
        totalScore: sc.totalScore,
      };
    });

    // Format response
    const formattedFacilities = facilities.map(f => ({
      id: f.id,
      name: f.name,
      facilityType: f.facilityType,
      address: f.address,
      city: f.city,
      state: f.state,
      zipCode: f.zipCode,
      team: {
        id: f.team.id,
        name: f.team.name,
      },
      company: {
        id: f.team.company.id,
        name: f.team.company.name,
      },
      latestScorecard: scorecardMap[f.id] || null,
    }));

    res.json({
      facilities: formattedFacilities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/facilities/filters
 * Get filter options (companies and teams) for the facility list
 */
router.get('/facilities/filters', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let companyWhere = {};
    let teamWhere = {};

    // Role-based filtering for available options
    if (user.role === 'team_leader') {
      teamWhere.id = user.teamId;
      companyWhere.id = user.companyId;
    } else if (user.role === 'company_leader') {
      companyWhere.id = user.companyId;
    }
    // admin and corporate can see all

    const companies = await Company.findAll({
      where: Object.keys(companyWhere).length > 0 ? companyWhere : undefined,
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    const teams = await Team.findAll({
      where: Object.keys(teamWhere).length > 0 ? teamWhere : undefined,
      attributes: ['id', 'name', 'companyId'],
      order: [['name', 'ASC']],
    });

    res.json({
      companies,
      teams,
      facilityTypes: ['SNF', 'ALF', 'ILF'],
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/facilities/:id
 * Get single facility with team, company, and scorecard summary
 */
router.get('/facilities/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const facility = await Facility.findByPk(id, {
      include: [
        {
          model: Team,
          as: 'team',
          include: [
            {
              model: Company,
              as: 'company',
            },
          ],
        },
      ],
    });

    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Check access based on role
    if (user.role === 'clinical_resource') {
      const assignment = await UserFacility.findOne({
        where: { userId: user.id, facilityId: id },
      });
      if (!assignment) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (user.role === 'team_leader') {
      if (facility.team.id !== user.teamId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (user.role === 'company_leader') {
      if (facility.team.companyId !== user.companyId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get scorecard stats for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const scorecards = await Scorecard.findAll({
      where: {
        facilityId: id,
        [Op.or]: [
          {
            year: { [Op.gt]: twelveMonthsAgo.getFullYear() },
          },
          {
            year: twelveMonthsAgo.getFullYear(),
            month: { [Op.gte]: twelveMonthsAgo.getMonth() + 1 },
          },
        ],
      },
      attributes: ['id', 'month', 'year', 'status', 'totalScore', 'updatedAt'],
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    // Calculate stats
    const completedScorecards = scorecards.filter(s => s.status === 'hard_close');
    const scores = completedScorecards.map(s => parseFloat(s.totalScore) || 0);

    const stats = {
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null,
      highestScore: scores.length > 0 ? Math.max(...scores) : null,
      lowestScore: scores.length > 0 ? Math.min(...scores) : null,
      completionRate: scorecards.length > 0 ? Math.round((completedScorecards.length / 12) * 100) : 0,
      totalScorecards: scorecards.length,
      completedCount: completedScorecards.length,
    };

    // Check if current month has a scorecard
    const now = new Date();
    const currentMonthScorecard = scorecards.find(
      s => s.month === now.getMonth() + 1 && s.year === now.getFullYear()
    );

    res.json({
      facility: {
        id: facility.id,
        name: facility.name,
        facilityType: facility.facilityType,
        address: facility.address,
        city: facility.city,
        state: facility.state,
        zipCode: facility.zipCode,
        team: {
          id: facility.team.id,
          name: facility.team.name,
        },
        company: {
          id: facility.team.company.id,
          name: facility.team.company.name,
        },
      },
      stats,
      currentMonthScorecard: currentMonthScorecard ? {
        id: currentMonthScorecard.id,
        status: currentMonthScorecard.status,
        totalScore: currentMonthScorecard.totalScore,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/facilities/:id/scorecards
 * Get paginated scorecard history for a facility
 */
router.get('/facilities/:id/scorecards', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Verify facility exists and user has access (simplified check)
    const facility = await Facility.findByPk(id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const { rows: scorecards, count: total } = await Scorecard.findAndCountAll({
      where: { facilityId: id },
      attributes: ['id', 'month', 'year', 'status', 'totalScore', 'updatedAt'],
      order: [['year', 'DESC'], ['month', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      scorecards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching scorecard history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/facilities/:id/trend
 * Get score trend data for charts (last 12 months)
 */
router.get('/facilities/:id/trend', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const facility = await Facility.findByPk(id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Get last 12 months of scorecards
    const scorecards = await Scorecard.findAll({
      where: { facilityId: id },
      attributes: ['month', 'year', 'status', 'totalScore'],
      order: [['year', 'ASC'], ['month', 'ASC']],
      limit: 12,
    });

    // Format for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const trendData = scorecards.map(sc => ({
      month: `${monthNames[sc.month - 1]} ${sc.year}`,
      score: parseFloat(sc.totalScore) || 0,
      status: sc.status,
    }));

    res.json({ trendData });
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
