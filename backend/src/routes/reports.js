const express = require('express');
const { Op, Sequelize } = require('sequelize');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const sequelize = require('../config/database');
const {
  Facility,
  Team,
  Company,
  Scorecard,
  ScorecardSystem,
  ScorecardItem,
  UserFacility,
  User,
  KevHistorical,
} = require('../models');

// Helper to get date range filter
function getDateRangeFilter(dateRange) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let monthsBack = 6; // default
  if (dateRange === '3') monthsBack = 3;
  else if (dateRange === '12') monthsBack = 12;
  else if (dateRange === 'custom') monthsBack = 12; // fallback for custom

  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - monthsBack);

  return {
    startMonth: startDate.getMonth() + 1,
    startYear: startDate.getFullYear(),
    currentMonth,
    currentYear,
    monthsBack,
  };
}

// Helper to calculate score from items
function calculateScoreFromItems(items) {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    if (!item.sampleSize || item.sampleSize <= 0) return sum;
    if (item.chartsMet === null || item.chartsMet === undefined) return sum;
    const points = (item.maxPoints / item.sampleSize) * item.chartsMet;
    return sum + Math.min(points, item.maxPoints);
  }, 0);
}

/**
 * Helper to get completed months for facilities including both scorecards and KEV historical
 * Returns a Set of unique "facilityId-month-year" keys representing completed audits
 */
async function getCompletedAudits(facilityIds, dateFilter) {
  const completedSet = new Set();

  // Get completed scorecards
  const scorecards = await Scorecard.findAll({
    where: {
      facilityId: { [Op.in]: facilityIds },
      status: 'hard_close',
      [Op.or]: [
        { year: { [Op.gt]: dateFilter.startYear } },
        {
          year: dateFilter.startYear,
          month: { [Op.gte]: dateFilter.startMonth },
        },
      ],
    },
    attributes: ['facilityId', 'month', 'year'],
  });

  scorecards.forEach(sc => {
    completedSet.add(`${sc.facilityId}-${sc.month}-${sc.year}`);
  });

  // Get KEV historical records
  const kevRecords = await KevHistorical.findAll({
    where: {
      facilityId: { [Op.in]: facilityIds },
      [Op.or]: [
        { year: { [Op.gt]: dateFilter.startYear } },
        {
          year: dateFilter.startYear,
          month: { [Op.gte]: dateFilter.startMonth },
        },
      ],
    },
    attributes: ['facilityId', 'month', 'year'],
  });

  kevRecords.forEach(kev => {
    completedSet.add(`${kev.facilityId}-${kev.month}-${kev.year}`);
  });

  return completedSet;
}

/**
 * Helper to count unique completed months per facility
 * Returns object { facilityId: count } for completed months
 */
async function getCompletedMonthCounts(facilityIds, dateFilter) {
  const completedSet = await getCompletedAudits(facilityIds, dateFilter);
  const counts = {};

  facilityIds.forEach(id => { counts[id] = 0; });

  completedSet.forEach(key => {
    const facilityId = parseInt(key.split('-')[0]);
    if (counts[facilityId] !== undefined) {
      counts[facilityId]++;
    }
  });

  return counts;
}

// Helper to get user's team/company from their assigned facilities
async function getUserTeamAndCompany(userId) {
  const assignments = await UserFacility.findAll({
    where: { userId },
    attributes: ['facilityId'],
  });

  if (assignments.length === 0) {
    return { teamId: null, companyId: null, team: null, company: null };
  }

  const facilityIds = assignments.map(a => a.facilityId);
  const facility = await Facility.findOne({
    where: { id: { [Op.in]: facilityIds } },
    include: [{
      model: Team,
      as: 'team',
      include: [{ model: Company, as: 'company' }],
    }],
  });

  if (!facility || !facility.team) {
    return { teamId: null, companyId: null, team: null, company: null };
  }

  return {
    teamId: facility.team.id,
    companyId: facility.team.company?.id || null,
    team: facility.team,
    company: facility.team.company,
  };
}

/**
 * GET /api/reports/states
 * Get list of states that have facilities (for filter dropdown)
 */
router.get('/reports/states', authenticateToken, async (req, res) => {
  try {
    const states = await Facility.findAll({
      where: {
        isActive: true,
        state: { [Op.ne]: null }
      },
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('state')), 'state']],
      order: [['state', 'ASC']],
      raw: true
    });

    // Get facility count per state
    const stateCounts = await Facility.findAll({
      where: {
        isActive: true,
        state: { [Op.ne]: null }
      },
      attributes: [
        'state',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['state'],
      order: [['state', 'ASC']],
      raw: true
    });

    const stateList = states.map(s => {
      const countInfo = stateCounts.find(c => c.state === s.state);
      return {
        code: s.state,
        count: countInfo ? parseInt(countInfo.count) : 0
      };
    });

    res.json({ states: stateList });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/reports/dashboard
 * Returns role-appropriate dashboard data
 */
router.get('/reports/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let dashboardData = {};

    if (user.role === 'clinical_resource' || user.role === 'facility_leader') {
      // Get assigned facilities
      const assignments = await UserFacility.findAll({
        where: { userId: user.id },
        attributes: ['facilityId'],
      });
      const facilityIds = assignments.map(a => a.facilityId);

      const facilities = await Facility.findAll({
        where: { id: { [Op.in]: facilityIds }, isActive: true },
        include: [
          {
            model: Team,
            as: 'team',
            include: [{ model: Company, as: 'company' }],
          },
        ],
        order: [['name', 'ASC']],
      });

      // Get current month scorecards for these facilities
      const scorecards = await Scorecard.findAll({
        where: {
          facilityId: { [Op.in]: facilityIds },
          month: currentMonth,
          year: currentYear,
        },
        attributes: ['id', 'facilityId', 'status', 'totalScore', 'updatedAt'],
        include: [{
          model: ScorecardSystem,
          as: 'systems',
          attributes: ['totalPointsEarned'],
        }],
      });

      const scorecardMap = {};
      scorecards.forEach(sc => {
        // Calculate score from systems if totalScore is 0 or null
        let calculatedScore = parseFloat(sc.totalScore) || 0;
        if (calculatedScore === 0 && sc.systems && sc.systems.length > 0) {
          calculatedScore = sc.systems.reduce((sum, sys) => sum + (parseFloat(sys.totalPointsEarned) || 0), 0);
        }
        scorecardMap[sc.facilityId] = {
          id: sc.id,
          facilityId: sc.facilityId,
          status: sc.status,
          totalScore: calculatedScore,
          updatedAt: sc.updatedAt,
        };
      });

      // Format facilities with scorecard status
      const myFacilities = facilities.map(f => ({
        id: f.id,
        name: f.name,
        facilityType: f.facilityType,
        team: f.team?.name,
        company: f.team?.company?.name,
        currentScorecard: scorecardMap[f.id] ? {
          id: scorecardMap[f.id].id,
          status: scorecardMap[f.id].status,
          totalScore: parseFloat(scorecardMap[f.id].totalScore) || 0,
        } : null,
      }));

      // Get facilities without completed scorecard this month
      const dueThisMonth = myFacilities.filter(
        f => !f.currentScorecard || f.currentScorecard.status !== 'hard_close'
      );

      // Get recent activity (last 5 scorecards edited by this user)
      const recentActivity = await Scorecard.findAll({
        where: {
          facilityId: { [Op.in]: facilityIds },
        },
        include: [
          { model: Facility, as: 'facility', attributes: ['id', 'name'] },
        ],
        order: [['updatedAt', 'DESC']],
        limit: 5,
      });

      dashboardData = {
        role: user.role, // Returns 'clinical_resource' or 'facility_leader'
        myFacilities,
        dueThisMonth,
        recentActivity: recentActivity.map(sc => ({
          id: sc.id,
          facilityId: sc.facilityId,
          facilityName: sc.facility?.name,
          month: sc.month,
          year: sc.year,
          status: sc.status,
          totalScore: parseFloat(sc.totalScore) || 0,
          updatedAt: sc.updatedAt,
        })),
      };
    } else if (user.role === 'team_leader') {
      // Get team info from user's assigned facilities
      const userContext = await getUserTeamAndCompany(user.id);
      const team = userContext.team;

      if (!team) {
        return res.status(400).json({ message: 'Team leader has no assigned facilities or team' });
      }

      // Get all facilities in team
      const facilities = await Facility.findAll({
        where: { teamId: team.id, isActive: true },
        order: [['name', 'ASC']],
      });

      const facilityIds = facilities.map(f => f.id);

      // Get current month scorecards
      const currentScorecards = await Scorecard.findAll({
        where: {
          facilityId: { [Op.in]: facilityIds },
          month: currentMonth,
          year: currentYear,
        },
        attributes: ['id', 'facilityId', 'status', 'totalScore'],
      });

      const scorecardMap = {};
      currentScorecards.forEach(sc => {
        scorecardMap[sc.facilityId] = sc;
      });

      // Calculate team stats
      const completedScorecards = currentScorecards.filter(s => s.status === 'hard_close');
      const scores = completedScorecards.map(s => parseFloat(s.totalScore) || 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : null;

      // Get trend data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const trendScorecards = await Scorecard.findAll({
        where: {
          facilityId: { [Op.in]: facilityIds },
          status: 'hard_close',
          [Op.or]: [
            { year: { [Op.gt]: sixMonthsAgo.getFullYear() } },
            {
              year: sixMonthsAgo.getFullYear(),
              month: { [Op.gte]: sixMonthsAgo.getMonth() + 1 },
            },
          ],
        },
        attributes: ['month', 'year', 'totalScore'],
        order: [['year', 'ASC'], ['month', 'ASC']],
      });

      // Group by month for trend
      const trendMap = {};
      trendScorecards.forEach(sc => {
        const key = `${sc.year}-${sc.month}`;
        if (!trendMap[key]) {
          trendMap[key] = { scores: [], month: sc.month, year: sc.year };
        }
        trendMap[key].scores.push(parseFloat(sc.totalScore) || 0);
      });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const trendData = Object.values(trendMap).map(t => ({
        month: `${monthNames[t.month - 1]} ${t.year}`,
        avgScore: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length * 10) / 10,
        count: t.scores.length,
      }));

      dashboardData = {
        role: 'team_leader',
        team: {
          id: team.id,
          name: team.name,
          company: team.company?.name,
        },
        summary: {
          totalFacilities: facilities.length,
          completedThisMonth: completedScorecards.length,
          avgScoreThisMonth: avgScore,
        },
        facilities: facilities.map(f => ({
          id: f.id,
          name: f.name,
          facilityType: f.facilityType,
          currentScorecard: scorecardMap[f.id] ? {
            id: scorecardMap[f.id].id,
            status: scorecardMap[f.id].status,
            totalScore: parseFloat(scorecardMap[f.id].totalScore) || 0,
          } : null,
        })),
        trendData,
      };
    } else if (user.role === 'company_leader') {
      // Get company info from user's assigned facilities
      const userContext = await getUserTeamAndCompany(user.id);
      const company = userContext.company;

      if (!company) {
        return res.status(400).json({ message: 'Company leader has no assigned facilities or company' });
      }

      // Get all teams in company
      const teams = await Team.findAll({
        where: { companyId: company.id },
        include: [{
          model: Facility,
          as: 'facilities',
          where: { isActive: true },
          required: false,
        }],
        order: [['name', 'ASC']],
      });

      const allFacilityIds = teams.flatMap(t => t.facilities?.map(f => f.id) || []);

      // Get current month scorecards
      const currentScorecards = await Scorecard.findAll({
        where: {
          facilityId: { [Op.in]: allFacilityIds },
          month: currentMonth,
          year: currentYear,
          status: 'hard_close',
        },
        include: [{ model: Facility, as: 'facility', attributes: ['teamId'] }],
        attributes: ['id', 'facilityId', 'totalScore'],
      });

      // Group by team
      const teamStats = teams.map(team => {
        const teamFacilityIds = team.facilities?.map(f => f.id) || [];
        const teamScorecards = currentScorecards.filter(sc => teamFacilityIds.includes(sc.facilityId));
        const scores = teamScorecards.map(s => parseFloat(s.totalScore) || 0);
        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
          : null;

        return {
          id: team.id,
          name: team.name,
          facilityCount: team.facilities?.length || 0,
          completedCount: teamScorecards.length,
          avgScore,
          completionRate: team.facilities?.length > 0
            ? Math.round((teamScorecards.length / team.facilities.length) * 100)
            : 0,
        };
      });

      // Top and bottom performers
      const allScores = currentScorecards.map(sc => ({
        facilityId: sc.facilityId,
        score: parseFloat(sc.totalScore) || 0,
      }));

      const sortedByScore = [...allScores].sort((a, b) => b.score - a.score);
      const topPerformerIds = sortedByScore.slice(0, 3).map(s => s.facilityId);
      const bottomPerformerIds = sortedByScore.slice(-3).reverse().map(s => s.facilityId);

      const performerFacilities = await Facility.findAll({
        where: { id: { [Op.in]: [...topPerformerIds, ...bottomPerformerIds] } },
        attributes: ['id', 'name'],
      });

      const facilityNameMap = {};
      performerFacilities.forEach(f => { facilityNameMap[f.id] = f.name; });

      dashboardData = {
        role: 'company_leader',
        company: {
          id: company.id,
          name: company.name,
        },
        summary: {
          totalTeams: teams.length,
          totalFacilities: allFacilityIds.length,
          completedThisMonth: currentScorecards.length,
          avgScoreThisMonth: allScores.length > 0
            ? Math.round(allScores.reduce((a, b) => a + b.score, 0) / allScores.length * 10) / 10
            : null,
        },
        teamStats,
        topPerformers: sortedByScore.slice(0, 3).map(s => ({
          facilityId: s.facilityId,
          facilityName: facilityNameMap[s.facilityId],
          score: s.score,
        })),
        bottomPerformers: sortedByScore.slice(-3).reverse().map(s => ({
          facilityId: s.facilityId,
          facilityName: facilityNameMap[s.facilityId],
          score: s.score,
        })),
      };
    } else if (user.role === 'corporate' || user.role === 'admin') {
      // Get all companies
      const companies = await Company.findAll({
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
        order: [['name', 'ASC']],
      });

      const allFacilityIds = companies.flatMap(
        c => c.teams?.flatMap(t => t.facilities?.map(f => f.id) || []) || []
      );

      // Get current month scorecards
      const currentScorecards = await Scorecard.findAll({
        where: {
          facilityId: { [Op.in]: allFacilityIds },
          month: currentMonth,
          year: currentYear,
          status: 'hard_close',
        },
        include: [{
          model: Facility,
          as: 'facility',
          attributes: ['id', 'name', 'teamId'],
          include: [{ model: Team, as: 'team', attributes: ['companyId'] }],
        }],
        attributes: ['id', 'facilityId', 'totalScore'],
      });

      // Previous month for trend
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const prevScorecards = await Scorecard.findAll({
        where: {
          facilityId: { [Op.in]: allFacilityIds },
          month: prevMonth,
          year: prevYear,
          status: 'hard_close',
        },
        attributes: ['facilityId', 'totalScore'],
      });

      const prevAvgScore = prevScorecards.length > 0
        ? prevScorecards.reduce((a, b) => a + (parseFloat(b.totalScore) || 0), 0) / prevScorecards.length
        : null;

      const currentAvgScore = currentScorecards.length > 0
        ? currentScorecards.reduce((a, b) => a + (parseFloat(b.totalScore) || 0), 0) / currentScorecards.length
        : null;

      const trendDirection = prevAvgScore && currentAvgScore
        ? (currentAvgScore > prevAvgScore ? 'up' : currentAvgScore < prevAvgScore ? 'down' : 'stable')
        : null;

      // Group by company
      const companyStats = companies.map(company => {
        const companyFacilityIds = company.teams?.flatMap(t => t.facilities?.map(f => f.id) || []) || [];
        const companyScorecards = currentScorecards.filter(sc => companyFacilityIds.includes(sc.facilityId));
        const scores = companyScorecards.map(s => parseFloat(s.totalScore) || 0);
        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
          : null;

        return {
          id: company.id,
          name: company.name,
          teamCount: company.teams?.length || 0,
          facilityCount: companyFacilityIds.length,
          completedCount: companyScorecards.length,
          avgScore,
          completionRate: companyFacilityIds.length > 0
            ? Math.round((companyScorecards.length / companyFacilityIds.length) * 100)
            : 0,
        };
      });

      // At-risk facilities (score < 600 or missing multiple months)
      const atRiskByScore = currentScorecards
        .filter(sc => parseFloat(sc.totalScore) < 600)
        .map(sc => ({
          facilityId: sc.facilityId,
          facilityName: sc.facility?.name,
          score: parseFloat(sc.totalScore) || 0,
          reason: 'low_score',
        }));

      // Find facilities missing multiple months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentScorecards = await Scorecard.findAll({
        where: {
          facilityId: { [Op.in]: allFacilityIds },
          status: 'hard_close',
          [Op.or]: [
            { year: { [Op.gt]: threeMonthsAgo.getFullYear() } },
            {
              year: threeMonthsAgo.getFullYear(),
              month: { [Op.gte]: threeMonthsAgo.getMonth() + 1 },
            },
          ],
        },
        attributes: ['facilityId'],
        group: ['facilityId'],
        having: Sequelize.literal('COUNT(*) < 2'),
      });

      const missingMonthsFacilityIds = recentScorecards.map(sc => sc.facilityId);
      const missingFacilities = await Facility.findAll({
        where: { id: { [Op.in]: missingMonthsFacilityIds } },
        attributes: ['id', 'name'],
      });

      const atRiskByMissing = missingFacilities.map(f => ({
        facilityId: f.id,
        facilityName: f.name,
        reason: 'missing_months',
      }));

      dashboardData = {
        role: user.role,
        summary: {
          totalCompanies: companies.length,
          totalFacilities: allFacilityIds.length,
          completedThisMonth: currentScorecards.length,
          completionRate: allFacilityIds.length > 0
            ? Math.round((currentScorecards.length / allFacilityIds.length) * 100)
            : 0,
          avgScoreThisMonth: currentAvgScore ? Math.round(currentAvgScore * 10) / 10 : null,
          trendDirection,
        },
        companyStats,
        atRisk: [...atRiskByScore, ...atRiskByMissing].slice(0, 10),
      };
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/reports/teams
 * Team comparison data
 * Query: company_id, date_range (3, 6, 12), state (2-letter state code)
 */
router.get('/reports/teams', authenticateToken, async (req, res) => {
  try {
    const { company_id, date_range = '6', state } = req.query;
    const user = req.user;
    const dateFilter = getDateRangeFilter(date_range);

    // Build team query based on role
    let teamWhere = {};
    if (company_id) {
      teamWhere.companyId = parseInt(company_id);
    }

    // For team_leader and company_leader, derive context from assigned facilities
    if (user.role === 'team_leader' || user.role === 'company_leader') {
      const userContext = await getUserTeamAndCompany(user.id);
      if (user.role === 'team_leader' && userContext.teamId) {
        teamWhere.id = userContext.teamId;
      } else if (user.role === 'company_leader' && userContext.companyId) {
        teamWhere.companyId = userContext.companyId;
      }
    }

    // Build facility filter with state
    let facilityWhere = { isActive: true };
    if (state) {
      facilityWhere.state = state.toUpperCase();
    }

    const teams = await Team.findAll({
      where: Object.keys(teamWhere).length > 0 ? teamWhere : undefined,
      include: [
        { model: Company, as: 'company' },
        {
          model: Facility,
          as: 'facilities',
          where: facilityWhere,
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    const allFacilityIds = teams.flatMap(t => t.facilities?.map(f => f.id) || []);

    // Get scorecards in date range
    const scorecards = await Scorecard.findAll({
      where: {
        facilityId: { [Op.in]: allFacilityIds },
        status: 'hard_close',
        [Op.or]: [
          { year: { [Op.gt]: dateFilter.startYear } },
          {
            year: dateFilter.startYear,
            month: { [Op.gte]: dateFilter.startMonth },
          },
        ],
      },
      include: [{ model: Facility, as: 'facility', attributes: ['teamId'] }],
      attributes: ['id', 'facilityId', 'month', 'year', 'totalScore'],
    });

    // Get completed audits including KEV historical
    const completedAudits = await getCompletedAudits(allFacilityIds, dateFilter);

    // Calculate stats per team
    const teamData = teams.map(team => {
      const teamFacilityIds = team.facilities?.map(f => f.id) || [];
      const teamScorecards = scorecards.filter(sc => teamFacilityIds.includes(sc.facilityId));
      const scores = teamScorecards.map(s => parseFloat(s.totalScore) || 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : null;

      // Calculate expected scorecards (facilities * months in range)
      const expectedCount = teamFacilityIds.length * dateFilter.monthsBack;

      // Count completed audits for this team (including KEV historical)
      let completedCount = 0;
      completedAudits.forEach(key => {
        const facilityId = parseInt(key.split('-')[0]);
        if (teamFacilityIds.includes(facilityId)) {
          completedCount++;
        }
      });

      const completionRate = expectedCount > 0
        ? Math.round((completedCount / expectedCount) * 100)
        : 0;

      // Calculate trend (compare first half to second half of period)
      const midpoint = Math.floor(teamScorecards.length / 2);
      const firstHalf = teamScorecards.slice(0, midpoint);
      const secondHalf = teamScorecards.slice(midpoint);

      const firstAvg = firstHalf.length > 0
        ? firstHalf.reduce((a, b) => a + (parseFloat(b.totalScore) || 0), 0) / firstHalf.length
        : null;
      const secondAvg = secondHalf.length > 0
        ? secondHalf.reduce((a, b) => a + (parseFloat(b.totalScore) || 0), 0) / secondHalf.length
        : null;

      let trend = null;
      if (firstAvg && secondAvg) {
        const diff = secondAvg - firstAvg;
        trend = diff > 10 ? 'up' : diff < -10 ? 'down' : 'stable';
      }

      return {
        id: team.id,
        name: team.name,
        company: {
          id: team.company?.id,
          name: team.company?.name,
        },
        facilityCount: teamFacilityIds.length,
        scorecardCount: completedCount, // Now includes KEV historical
        avgScore,
        completionRate,
        trend,
      };
    });

    // Sort by average score descending
    teamData.sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));

    res.json({
      teams: teamData,
      dateRange: {
        months: dateFilter.monthsBack,
        startMonth: dateFilter.startMonth,
        startYear: dateFilter.startYear,
      },
    });
  } catch (error) {
    console.error('Error fetching team comparison:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/reports/companies
 * Company comparison data
 * Query: date_range (3, 6, 12), state (2-letter state code)
 */
router.get('/reports/companies', authenticateToken, async (req, res) => {
  try {
    const { date_range = '6', state } = req.query;
    const user = req.user;
    const dateFilter = getDateRangeFilter(date_range);

    // Check access
    if (!['corporate', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build facility filter with state
    let facilityWhere = { isActive: true };
    if (state) {
      facilityWhere.state = state.toUpperCase();
    }

    const companies = await Company.findAll({
      include: [{
        model: Team,
        as: 'teams',
        include: [{
          model: Facility,
          as: 'facilities',
          where: facilityWhere,
          required: false,
        }],
      }],
      order: [['name', 'ASC']],
    });

    const allFacilityIds = companies.flatMap(
      c => c.teams?.flatMap(t => t.facilities?.map(f => f.id) || []) || []
    );

    // Get scorecards in date range
    const scorecards = await Scorecard.findAll({
      where: {
        facilityId: { [Op.in]: allFacilityIds },
        status: 'hard_close',
        [Op.or]: [
          { year: { [Op.gt]: dateFilter.startYear } },
          {
            year: dateFilter.startYear,
            month: { [Op.gte]: dateFilter.startMonth },
          },
        ],
      },
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['teamId'],
        include: [{ model: Team, as: 'team', attributes: ['companyId'] }],
      }],
      attributes: ['id', 'facilityId', 'totalScore'],
    });

    // Get completed audits including KEV historical
    const completedAudits = await getCompletedAudits(allFacilityIds, dateFilter);

    // Calculate stats per company
    const companyData = companies.map(company => {
      const companyFacilityIds = company.teams?.flatMap(t => t.facilities?.map(f => f.id) || []) || [];
      const companyScorecards = scorecards.filter(sc => companyFacilityIds.includes(sc.facilityId));
      const scores = companyScorecards.map(s => parseFloat(s.totalScore) || 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : null;

      const expectedCount = companyFacilityIds.length * dateFilter.monthsBack;

      // Count completed audits for this company (including KEV historical)
      let completedCount = 0;
      completedAudits.forEach(key => {
        const facilityId = parseInt(key.split('-')[0]);
        if (companyFacilityIds.includes(facilityId)) {
          completedCount++;
        }
      });

      const completionRate = expectedCount > 0
        ? Math.round((completedCount / expectedCount) * 100)
        : 0;

      // Trend calculation
      const midpoint = Math.floor(companyScorecards.length / 2);
      const firstHalf = companyScorecards.slice(0, midpoint);
      const secondHalf = companyScorecards.slice(midpoint);

      const firstAvg = firstHalf.length > 0
        ? firstHalf.reduce((a, b) => a + (parseFloat(b.totalScore) || 0), 0) / firstHalf.length
        : null;
      const secondAvg = secondHalf.length > 0
        ? secondHalf.reduce((a, b) => a + (parseFloat(b.totalScore) || 0), 0) / secondHalf.length
        : null;

      let trend = null;
      if (firstAvg && secondAvg) {
        const diff = secondAvg - firstAvg;
        trend = diff > 10 ? 'up' : diff < -10 ? 'down' : 'stable';
      }

      return {
        id: company.id,
        name: company.name,
        teamCount: company.teams?.length || 0,
        facilityCount: companyFacilityIds.length,
        scorecardCount: completedCount, // Now includes KEV historical
        avgScore,
        completionRate,
        trend,
      };
    });

    companyData.sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));

    res.json({
      companies: companyData,
      dateRange: {
        months: dateFilter.monthsBack,
        startMonth: dateFilter.startMonth,
        startYear: dateFilter.startYear,
      },
    });
  } catch (error) {
    console.error('Error fetching company comparison:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/reports/facilities/compare
 * Compare multiple facilities side by side
 * Query: facility_ids (comma-separated), date_range
 */
router.get('/reports/facilities/compare', authenticateToken, async (req, res) => {
  try {
    const { facility_ids, date_range = '6' } = req.query;
    const dateFilter = getDateRangeFilter(date_range);

    if (!facility_ids) {
      return res.status(400).json({ message: 'facility_ids required' });
    }

    const facilityIdArray = facility_ids.split(',').map(id => parseInt(id.trim()));

    // Get facilities
    const facilities = await Facility.findAll({
      where: { id: { [Op.in]: facilityIdArray } },
      include: [{
        model: Team,
        as: 'team',
        include: [{ model: Company, as: 'company' }],
      }],
    });

    // Get scorecards with system-level data
    const scorecards = await Scorecard.findAll({
      where: {
        facilityId: { [Op.in]: facilityIdArray },
        status: 'hard_close',
        [Op.or]: [
          { year: { [Op.gt]: dateFilter.startYear } },
          {
            year: dateFilter.startYear,
            month: { [Op.gte]: dateFilter.startMonth },
          },
        ],
      },
      include: [{
        model: ScorecardSystem,
        as: 'systems',
        include: [{
          model: ScorecardItem,
          as: 'items',
        }],
      }],
      order: [['year', 'ASC'], ['month', 'ASC']],
    });

    // Build comparison data for each facility
    const comparisonData = facilities.map(facility => {
      const facilityScorecards = scorecards.filter(sc => sc.facilityId === facility.id);

      // Overall stats
      const scores = facilityScorecards.map(s => parseFloat(s.totalScore) || 0);
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        : null;

      // System-by-system breakdown (average for each system)
      const systemScores = {};
      for (let i = 1; i <= 8; i++) {
        systemScores[i] = { scores: [], name: '' };
      }

      facilityScorecards.forEach(sc => {
        sc.systems?.forEach(system => {
          const systemScore = calculateScoreFromItems(system.items);
          systemScores[system.systemNumber].scores.push(systemScore);
          systemScores[system.systemNumber].name = system.systemName;
        });
      });

      const systemBreakdown = Object.entries(systemScores).map(([num, data]) => ({
        systemNumber: parseInt(num),
        systemName: data.name,
        avgScore: data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10
          : null,
      }));

      // Trend data for chart
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const trendData = facilityScorecards.map(sc => ({
        month: `${monthNames[sc.month - 1]} ${sc.year}`,
        score: parseFloat(sc.totalScore) || 0,
      }));

      return {
        id: facility.id,
        name: facility.name,
        facilityType: facility.facilityType,
        team: facility.team?.name,
        company: facility.team?.company?.name,
        avgScore,
        scorecardCount: facilityScorecards.length,
        systemBreakdown,
        trendData,
      };
    });

    res.json({
      facilities: comparisonData,
      dateRange: {
        months: dateFilter.monthsBack,
        startMonth: dateFilter.startMonth,
        startYear: dateFilter.startYear,
      },
    });
  } catch (error) {
    console.error('Error fetching facility comparison:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/reports/systems
 * System-by-system analysis across all facilities
 * Query: company_id, team_id, date_range, state (2-letter state code)
 */
router.get('/reports/systems', authenticateToken, async (req, res) => {
  try {
    const { company_id, team_id, date_range = '6', state } = req.query;
    const user = req.user;
    const dateFilter = getDateRangeFilter(date_range);

    // Build facility filter based on role and params
    let facilityWhere = { isActive: true };
    let teamWhere = {};

    if (team_id) {
      facilityWhere.teamId = parseInt(team_id);
    }
    if (company_id) {
      teamWhere.companyId = parseInt(company_id);
    }
    if (state) {
      facilityWhere.state = state.toUpperCase();
    }

    // Role-based filtering - derive context from assigned facilities
    if (user.role === 'team_leader' || user.role === 'company_leader') {
      const userContext = await getUserTeamAndCompany(user.id);
      if (user.role === 'team_leader' && userContext.teamId) {
        facilityWhere.teamId = userContext.teamId;
      } else if (user.role === 'company_leader' && userContext.companyId) {
        teamWhere.companyId = userContext.companyId;
      }
    }

    const facilities = await Facility.findAll({
      where: facilityWhere,
      include: [{
        model: Team,
        as: 'team',
        where: Object.keys(teamWhere).length > 0 ? teamWhere : undefined,
      }],
    });

    const facilityIds = facilities.map(f => f.id);

    // Get scorecards with system data
    const scorecards = await Scorecard.findAll({
      where: {
        facilityId: { [Op.in]: facilityIds },
        status: 'hard_close',
        [Op.or]: [
          { year: { [Op.gt]: dateFilter.startYear } },
          {
            year: dateFilter.startYear,
            month: { [Op.gte]: dateFilter.startMonth },
          },
        ],
      },
      include: [{
        model: ScorecardSystem,
        as: 'systems',
        include: [{
          model: ScorecardItem,
          as: 'items',
        }],
      }],
    });

    // Aggregate by system
    const systemData = {};
    for (let i = 1; i <= 8; i++) {
      systemData[i] = {
        systemNumber: i,
        systemName: '',
        scores: [],
        facilitiesBelow80: new Set(),
      };
    }

    scorecards.forEach(sc => {
      sc.systems?.forEach(system => {
        const score = calculateScoreFromItems(system.items);
        systemData[system.systemNumber].scores.push(score);
        systemData[system.systemNumber].systemName = system.systemName;
        if (score < 80) {
          systemData[system.systemNumber].facilitiesBelow80.add(sc.facilityId);
        }
      });
    });

    // Format response
    const systemAnalysis = Object.values(systemData).map(sys => {
      const avgScore = sys.scores.length > 0
        ? Math.round(sys.scores.reduce((a, b) => a + b, 0) / sys.scores.length * 10) / 10
        : null;

      // Calculate trend (first half vs second half)
      const midpoint = Math.floor(sys.scores.length / 2);
      const firstHalf = sys.scores.slice(0, midpoint);
      const secondHalf = sys.scores.slice(midpoint);

      const firstAvg = firstHalf.length > 0
        ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        : null;
      const secondAvg = secondHalf.length > 0
        ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        : null;

      let trend = null;
      if (firstAvg && secondAvg) {
        const diff = secondAvg - firstAvg;
        trend = diff > 5 ? 'up' : diff < -5 ? 'down' : 'stable';
      }

      return {
        systemNumber: sys.systemNumber,
        systemName: sys.systemName,
        avgScore,
        facilitiesBelow80: sys.facilitiesBelow80.size,
        totalDataPoints: sys.scores.length,
        trend,
      };
    });

    // Sort by average score (lowest first to highlight problem areas)
    systemAnalysis.sort((a, b) => (a.avgScore || 100) - (b.avgScore || 100));

    res.json({
      systems: systemAnalysis,
      summary: {
        totalFacilities: facilities.length,
        totalScorecards: scorecards.length,
      },
      dateRange: {
        months: dateFilter.monthsBack,
        startMonth: dateFilter.startMonth,
        startYear: dateFilter.startYear,
      },
    });
  } catch (error) {
    console.error('Error fetching system analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/reports/company-trends
 * Get monthly trend data for all companies (for Corporate dashboard)
 * Query params: months (default 12)
 */
router.get('/reports/company-trends', authenticateToken, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const now = new Date();

    // Calculate start date
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months + 1);
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();

    // Get all companies with their facilities
    const companies = await Company.findAll({
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

    // Get all facility IDs for querying
    const allFacilityIds = companies.flatMap(c =>
      c.teams.flatMap(t => t.facilities.map(f => f.id))
    );

    // Get all relevant scorecards
    const scorecards = await Scorecard.findAll({
      where: {
        status: 'hard_close',
        [Op.or]: [
          { year: { [Op.gt]: startYear } },
          { year: startYear, month: { [Op.gte]: startMonth } },
        ],
      },
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'teamId'],
        include: [{
          model: Team,
          as: 'team',
          attributes: ['id', 'companyId'],
        }],
      }],
    });

    // Get KEV historical records for completion tracking
    const kevRecords = await KevHistorical.findAll({
      where: {
        facilityId: { [Op.in]: allFacilityIds },
        [Op.or]: [
          { year: { [Op.gt]: startYear } },
          { year: startYear, month: { [Op.gte]: startMonth } },
        ],
      },
      attributes: ['facilityId', 'month', 'year'],
    });

    // Build month list
    const monthList = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);
      monthList.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    // Colors for companies
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

    // Process data per company
    const companyTrends = companies.map((company, idx) => {
      const facilityIds = company.teams.flatMap(t => t.facilities.map(f => f.id));

      const monthlyData = monthList.map(m => {
        const monthScorecards = scorecards.filter(sc =>
          sc.month === m.month &&
          sc.year === m.year &&
          facilityIds.includes(sc.facilityId)
        );

        // Get completed facilities for this month (including KEV historical)
        const completedFacilities = new Set();
        monthScorecards.forEach(sc => completedFacilities.add(sc.facilityId));
        kevRecords
          .filter(kev => kev.month === m.month && kev.year === m.year && facilityIds.includes(kev.facilityId))
          .forEach(kev => completedFacilities.add(kev.facilityId));

        const totalScore = monthScorecards.reduce((sum, sc) => sum + (parseFloat(sc.totalScore) || 0), 0);
        const avgScore = monthScorecards.length > 0 ? Math.round(totalScore / monthScorecards.length) : null;
        const completionPct = facilityIds.length > 0
          ? Math.round((completedFacilities.size / facilityIds.length) * 100)
          : 0;

        return {
          month: m.key,
          avgScore,
          completionPct,
          scorecardCount: monthScorecards.length,
          facilityCount: facilityIds.length,
        };
      });

      return {
        id: company.id,
        name: company.name,
        color: COLORS[idx % COLORS.length],
        data: monthlyData,
      };
    });

    res.json({ companies: companyTrends, months: monthList.map(m => m.key) });
  } catch (error) {
    console.error('Error fetching company trends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/reports/team-trends
 * Get monthly trend data for teams (for Company Leader dashboard)
 * Query params: companyId (required), months (default 12)
 */
router.get('/reports/team-trends', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.query;
    const months = parseInt(req.query.months) || 12;
    const user = req.user;

    // Determine which company to query
    let targetCompanyId = companyId ? parseInt(companyId) : null;

    // For company_leader, derive from assigned facilities
    if (!targetCompanyId && user.role === 'company_leader') {
      const userContext = await getUserTeamAndCompany(user.id);
      targetCompanyId = userContext.companyId;
    }

    // For admin/corporate without a specific company, get all teams
    const showAllTeams = !targetCompanyId && ['admin', 'corporate'].includes(user.role);

    // If not admin/corporate and no company ID, return error
    if (!showAllTeams && !targetCompanyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months + 1);
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();

    // Get teams (all teams for admin/corporate, or filtered by company)
    const teamWhere = showAllTeams ? {} : { companyId: targetCompanyId };
    const teams = await Team.findAll({
      where: teamWhere,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        {
          model: Facility,
          as: 'facilities',
          where: { isActive: true },
          required: false,
        },
      ],
    });

    // Get all relevant scorecards
    const teamIds = teams.map(t => t.id);
    const facilityIds = teams.flatMap(t => t.facilities.map(f => f.id));

    const scorecards = await Scorecard.findAll({
      where: {
        facilityId: { [Op.in]: facilityIds },
        status: 'hard_close',
        [Op.or]: [
          { year: { [Op.gt]: startYear } },
          { year: startYear, month: { [Op.gte]: startMonth } },
        ],
      },
      include: [{
        model: Facility,
        as: 'facility',
        attributes: ['id', 'teamId'],
      }],
    });

    // Get KEV historical records for completion tracking
    const kevRecords = await KevHistorical.findAll({
      where: {
        facilityId: { [Op.in]: facilityIds },
        [Op.or]: [
          { year: { [Op.gt]: startYear } },
          { year: startYear, month: { [Op.gte]: startMonth } },
        ],
      },
      attributes: ['facilityId', 'month', 'year'],
    });

    // Build month list
    const monthList = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(startDate);
      d.setMonth(startDate.getMonth() + i);
      monthList.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    // Colors for teams
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

    // Process data per team
    const teamTrends = teams.map((team, idx) => {
      const teamFacilityIds = team.facilities.map(f => f.id);

      const monthlyData = monthList.map(m => {
        const monthScorecards = scorecards.filter(sc =>
          sc.month === m.month &&
          sc.year === m.year &&
          teamFacilityIds.includes(sc.facilityId)
        );

        // Get completed facilities for this month (including KEV historical)
        const completedFacilities = new Set();
        monthScorecards.forEach(sc => completedFacilities.add(sc.facilityId));
        kevRecords
          .filter(kev => kev.month === m.month && kev.year === m.year && teamFacilityIds.includes(kev.facilityId))
          .forEach(kev => completedFacilities.add(kev.facilityId));

        const totalScore = monthScorecards.reduce((sum, sc) => sum + (parseFloat(sc.totalScore) || 0), 0);
        const avgScore = monthScorecards.length > 0 ? Math.round(totalScore / monthScorecards.length) : null;
        const completionPct = teamFacilityIds.length > 0
          ? Math.round((completedFacilities.size / teamFacilityIds.length) * 100)
          : 0;

        return {
          month: m.key,
          avgScore,
          completionPct,
          scorecardCount: completedFacilities.size, // Now includes KEV historical
          facilityCount: teamFacilityIds.length,
        };
      });

      return {
        id: team.id,
        name: showAllTeams ? `${team.name} (${team.company?.name || 'Unknown'})` : team.name,
        color: COLORS[idx % COLORS.length],
        data: monthlyData,
      };
    });

    res.json({ teams: teamTrends, months: monthList.map(m => m.key) });
  } catch (error) {
    console.error('Error fetching team trends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
