/**
 * Survey Intelligence - Team View API Routes
 * 
 * Provides team-level aggregations combining:
 * - External CMS deficiency data (snf_market_data)
 * - Internal scorecard data (systemscheck)
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { getMarketPool } = require('../config/marketDatabase');

// Internal models
const { 
  Team, 
  Facility, 
  Scorecard, 
  ScorecardSystem 
} = require('../models');

// Tag to System mapping
const tagToSystem = {
  // System 1: Change of Condition
  'F580': 1, 'F684': 1, 'F656': 1, 'F657': 1, 'F658': 1, 'F659': 1,
  // System 2: Falls/Accidents
  'F689': 2, 'F688': 2, 'F700': 2,
  // System 3: Skin
  'F686': 3, 'F685': 3,
  // System 4: Meds/Weight
  'F757': 4, 'F758': 4, 'F759': 4, 'F760': 4, 'F692': 4, 'F693': 4,
  // System 5: Infection Control
  'F880': 5, 'F881': 5, 'F882': 5, 'F883': 5, 'F884': 5,
  // System 6: Transfer/Discharge
  'F622': 6, 'F623': 6, 'F624': 6, 'F625': 6, 'F626': 6, 'F660': 6,
  // System 7: Abuse/Grievances
  'F600': 7, 'F602': 7, 'F603': 7, 'F604': 7, 'F607': 7, 'F609': 7, 'F610': 7, 'F611': 7, 'F585': 7,
};

const systemNames = {
  1: 'Change of Condition',
  2: 'Accidents/Falls',
  3: 'Skin',
  4: 'Meds & Nutrition',
  5: 'Infection Control',
  6: 'Transfer/Discharge',
  7: 'Abuse/Grievances'
};

// Helper: Get market database pool
const getExternalPool = () => {
  const pool = getMarketPool();
  if (!pool) {
    throw new Error('Market database not configured');
  }
  return pool;
};

// Helper: Calculate risk score for a facility
const calculateRiskScore = (deficiencies, daysSinceLastSurvey) => {
  if (!deficiencies || deficiencies.length === 0) {
    return { score: 15, level: 'LOW' };
  }

  // Weights
  const recencyWeight = 0.24;
  const severityWeight = 0.29;
  const repeatWeight = 0.24;
  const volumeWeight = 0.23;

  // Recency score (0-100)
  let recencyScore = 0;
  if (daysSinceLastSurvey <= 90) recencyScore = 100;
  else if (daysSinceLastSurvey <= 180) recencyScore = 75;
  else if (daysSinceLastSurvey <= 365) recencyScore = 50;
  else recencyScore = 25;

  // Severity score (0-100)
  const hasIJ = deficiencies.some(d => 
    d.scope_severity?.includes('J') || 
    d.scope_severity?.includes('K') || 
    d.scope_severity?.includes('L')
  );
  const hasActualHarm = deficiencies.some(d => 
    d.scope_severity?.includes('G') || 
    d.scope_severity?.includes('H') || 
    d.scope_severity?.includes('I')
  );
  let severityScore = hasIJ ? 100 : hasActualHarm ? 70 : 40;

  // Repeat score (0-100) - % of tags that appear multiple times
  const tagCounts = {};
  deficiencies.forEach(d => {
    tagCounts[d.deficiency_tag] = (tagCounts[d.deficiency_tag] || 0) + 1;
  });
  const repeatTags = Object.values(tagCounts).filter(c => c > 1).length;
  const repeatScore = deficiencies.length > 0 
    ? (repeatTags / Object.keys(tagCounts).length) * 100 
    : 0;

  // Volume score (0-100)
  const citationsPerYear = deficiencies.length;
  let volumeScore = 0;
  if (citationsPerYear >= 20) volumeScore = 100;
  else if (citationsPerYear >= 10) volumeScore = 75;
  else if (citationsPerYear >= 5) volumeScore = 50;
  else volumeScore = 25;

  const totalScore = 
    (recencyScore * recencyWeight) +
    (severityScore * severityWeight) +
    (repeatScore * repeatWeight) +
    (volumeScore * volumeWeight);

  const level = totalScore > 70 ? 'HIGH' : totalScore > 40 ? 'MODERATE' : 'LOW';

  return { score: Math.round(totalScore), level };
};

// Helper: Get gap alert based on CMS risk and scorecard
const getGapAlert = (cmsRiskLevel, scorecardAvg) => {
  if (cmsRiskLevel === 'HIGH' && scorecardAvg < 75) return { alert: 'URGENT', icon: '🚨', color: 'red' };
  if (cmsRiskLevel === 'HIGH' && scorecardAvg >= 75) return { alert: 'MONITOR', icon: '⚠️', color: 'orange' };
  if (cmsRiskLevel === 'MODERATE' && scorecardAvg < 75) return { alert: 'ATTENTION', icon: '⚠️', color: 'yellow' };
  if (cmsRiskLevel === 'LOW' && scorecardAvg < 75) return { alert: 'IMPROVE', icon: '📋', color: 'blue' };
  return { alert: 'STRONG', icon: '✅', color: 'green' };
};

/**
 * GET /api/survey-intel/team/:teamId/summary
 * Team risk summary with distribution
 */
router.get('/team/:teamId/summary', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = getExternalPool();

    // Get team facilities
    const team = await Team.findByPk(teamId, {
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name', 'ccn']
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ccns = team.facilities.map(f => f.ccn).filter(Boolean);
    
    if (ccns.length === 0) {
      return res.json({
        teamId,
        teamName: team.name,
        facilityCount: team.facilities.length,
        riskScore: 0,
        riskLevel: 'LOW',
        distribution: { low: 0, moderate: 0, high: 0 },
        highestRiskFacility: null,
        daysSinceLastCitation: null,
        message: 'No facilities with CCN linked to CMS data'
      });
    }

    // Get deficiencies for all team facilities (last 3 years)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const { rows: deficiencies } = await pool.query(`
      SELECT
        d.federal_provider_number,
        d.deficiency_tag,
        d.scope_severity,
        d.survey_date,
        d.survey_type
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= $2
      ORDER BY d.survey_date DESC
    `, [ccns, threeYearsAgo.toISOString()]);

    // Calculate risk per facility
    const facilityRisks = [];
    const distribution = { low: 0, moderate: 0, high: 0 };

    for (const facility of team.facilities) {
      const facilityDefs = deficiencies.filter(d => d.federal_provider_number === facility.ccn);
      const lastSurvey = facilityDefs[0]?.survey_date;
      const daysSince = lastSurvey 
        ? Math.floor((new Date() - new Date(lastSurvey)) / (1000 * 60 * 60 * 24))
        : 999;
      
      const risk = calculateRiskScore(facilityDefs, daysSince);
      
      facilityRisks.push({
        facilityId: facility.id,
        facilityName: facility.name,
        ccn: facility.ccn,
        riskScore: risk.score,
        riskLevel: risk.level,
        citationCount: facilityDefs.length,
        lastSurveyDate: lastSurvey
      });

      if (risk.level === 'HIGH') distribution.high++;
      else if (risk.level === 'MODERATE') distribution.moderate++;
      else distribution.low++;
    }

    // Sort by risk score
    facilityRisks.sort((a, b) => b.riskScore - a.riskScore);

    // Team aggregate
    const avgRiskScore = facilityRisks.length > 0
      ? Math.round(facilityRisks.reduce((sum, f) => sum + f.riskScore, 0) / facilityRisks.length)
      : 0;
    
    const teamRiskLevel = avgRiskScore > 70 ? 'HIGH' : avgRiskScore > 40 ? 'MODERATE' : 'LOW';
    
    const mostRecentCitation = deficiencies[0]?.survey_date;
    const daysSinceLastCitation = mostRecentCitation
      ? Math.floor((new Date() - new Date(mostRecentCitation)) / (1000 * 60 * 60 * 24))
      : null;

    // Pool is reused, no close needed

    res.json({
      teamId,
      teamName: team.name,
      facilityCount: team.facilities.length,
      riskScore: avgRiskScore,
      riskLevel: teamRiskLevel,
      distribution,
      highestRiskFacility: facilityRisks[0] || null,
      daysSinceLastCitation,
      totalCitations: deficiencies.length
    });

  } catch (error) {
    console.error('Error fetching team summary:', error);
    res.status(500).json({ error: 'Failed to fetch team summary' });
  }
});

/**
 * GET /api/survey-intel/team/:teamId/facilities
 * All facilities with risk scores and scorecard data
 */
router.get('/team/:teamId/facilities', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = getExternalPool();

    // Get team facilities with recent scorecards
    const team = await Team.findByPk(teamId, {
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name', 'ccn'],
        include: [{
          model: Scorecard,
          as: 'scorecards',
          limit: 3,
          order: [['year', 'DESC'], ['month', 'DESC']],
          include: [{
            model: ScorecardSystem,
            as: 'systems'
          }]
        }]
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ccns = team.facilities.map(f => f.ccn).filter(Boolean);

    // Get CMS data
    const { rows: deficiencies } = await pool.query(`
      SELECT
        d.federal_provider_number,
        d.deficiency_tag,
        d.scope_severity,
        d.survey_date
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= NOW() - INTERVAL '3 years'
      ORDER BY d.survey_date DESC
    `, [ccns]);

    // Build facility comparison data
    const facilities = team.facilities.map(facility => {
      const facilityDefs = deficiencies.filter(d => d.federal_provider_number === facility.ccn);
      const lastSurvey = facilityDefs[0]?.survey_date;
      const daysSince = lastSurvey 
        ? Math.floor((new Date() - new Date(lastSurvey)) / (1000 * 60 * 60 * 24))
        : null;
      
      // Risk score
      const risk = calculateRiskScore(facilityDefs, daysSince || 999);
      
      // IJ count
      const ijCount = facilityDefs.filter(d => 
        d.scope_severity?.includes('J') || 
        d.scope_severity?.includes('K') || 
        d.scope_severity?.includes('L')
      ).length;

      // Scorecard average (last 3 months)
      let scorecardAvg = null;
      if (facility.scorecards && facility.scorecards.length > 0) {
        const systemScores = [];
        facility.scorecards.forEach(sc => {
          if (sc.systems) {
            sc.systems.forEach(sys => {
              if (sys.score !== null) systemScores.push(sys.score);
            });
          }
        });
        if (systemScores.length > 0) {
          scorecardAvg = Math.round(systemScores.reduce((a, b) => a + b, 0) / systemScores.length);
        }
      }

      // Gap alert
      const gapAlert = scorecardAvg !== null 
        ? getGapAlert(risk.level, scorecardAvg)
        : null;

      return {
        id: facility.id,
        name: facility.name,
        ccn: facility.ccn,
        riskScore: risk.score,
        riskLevel: risk.level,
        lastSurveyDate: lastSurvey,
        daysSinceLastSurvey: daysSince,
        citationCount12mo: facilityDefs.filter(d => {
          const surveyDate = new Date(d.survey_date);
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          return surveyDate >= oneYearAgo;
        }).length,
        ijCount,
        scorecardAvg,
        gapAlert
      };
    });

    // Sort by risk score
    facilities.sort((a, b) => b.riskScore - a.riskScore);

    // Pool is reused, no close needed

    res.json({
      teamId,
      teamName: team.name,
      facilities
    });

  } catch (error) {
    console.error('Error fetching team facilities:', error);
    res.status(500).json({ error: 'Failed to fetch team facilities' });
  }
});

/**
 * GET /api/survey-intel/team/:teamId/gap-analysis
 * Clinical systems with CMS risk + scorecard avg + gap alerts
 */
router.get('/team/:teamId/gap-analysis', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = getExternalPool();

    // Get team facilities with scorecards
    const team = await Team.findByPk(teamId, {
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name', 'ccn'],
        include: [{
          model: Scorecard,
          as: 'scorecards',
          limit: 1,
          order: [['year', 'DESC'], ['month', 'DESC']],
          include: [{
            model: ScorecardSystem,
            as: 'systems'
          }]
        }]
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ccns = team.facilities.map(f => f.ccn).filter(Boolean);

    // Get CMS deficiencies (last 2 years)
    const { rows: deficiencies } = await pool.query(`
      SELECT
        d.federal_provider_number,
        d.deficiency_tag,
        d.scope_severity,
        d.survey_date
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= NOW() - INTERVAL '2 years'
    `, [ccns]);

    // Initialize systems analysis
    const systemsAnalysis = {};
    for (let i = 1; i <= 7; i++) {
      systemsAnalysis[i] = {
        systemNumber: i,
        systemName: systemNames[i],
        citationCount: 0,
        facilitiesCited: new Set(),
        topTags: {},
        scorecardScores: [],
        hasSevereCitation: false
      };
    }

    // Process CMS deficiencies
    deficiencies.forEach(def => {
      const systemId = tagToSystem[def.deficiency_tag];
      if (systemId) {
        systemsAnalysis[systemId].citationCount++;
        systemsAnalysis[systemId].facilitiesCited.add(def.federal_provider_number);
        systemsAnalysis[systemId].topTags[def.deficiency_tag] = 
          (systemsAnalysis[systemId].topTags[def.deficiency_tag] || 0) + 1;
        
        if (def.scope_severity?.match(/[GHIJKL]/)) {
          systemsAnalysis[systemId].hasSevereCitation = true;
        }
      }
    });

    // Process internal scorecards
    team.facilities.forEach(facility => {
      if (facility.scorecards && facility.scorecards[0]) {
        facility.scorecards[0].systems?.forEach(sys => {
          if (sys.systemNumber && sys.score !== null) {
            systemsAnalysis[sys.systemNumber]?.scorecardScores.push(sys.score);
          }
        });
      }
    });

    // Build final analysis
    const analysis = Object.values(systemsAnalysis).map(sys => {
      // CMS Risk Level
      let cmsRiskLevel = 'LOW';
      if (sys.hasSevereCitation || sys.facilitiesCited.size >= 3) {
        cmsRiskLevel = 'HIGH';
      } else if (sys.citationCount >= 3 || sys.facilitiesCited.size >= 2) {
        cmsRiskLevel = 'MODERATE';
      }

      // Scorecard average
      const scorecardAvg = sys.scorecardScores.length > 0
        ? Math.round(sys.scorecardScores.reduce((a, b) => a + b, 0) / sys.scorecardScores.length)
        : null;

      // Top tags (sorted by count)
      const topTags = Object.entries(sys.topTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag, count]) => ({ tag, count }));

      // Gap alert
      const gapAlert = scorecardAvg !== null 
        ? getGapAlert(cmsRiskLevel, scorecardAvg)
        : { alert: 'NO_DATA', icon: '❓', color: 'gray' };

      return {
        systemNumber: sys.systemNumber,
        systemName: sys.systemName,
        cmsRisk: {
          level: cmsRiskLevel,
          citationCount: sys.citationCount,
          facilitiesCited: sys.facilitiesCited.size
        },
        topTags,
        scorecardAvg,
        gapAlert
      };
    });

    // Sort by urgency
    const alertPriority = { 'URGENT': 0, 'ATTENTION': 1, 'MONITOR': 2, 'IMPROVE': 3, 'NO_DATA': 4, 'STRONG': 5 };
    analysis.sort((a, b) => alertPriority[a.gapAlert.alert] - alertPriority[b.gapAlert.alert]);

    // Pool is reused, no close needed

    res.json({
      teamId,
      teamName: team.name,
      facilityCount: team.facilities.length,
      analysis
    });

  } catch (error) {
    console.error('Error fetching gap analysis:', error);
    res.status(500).json({ error: 'Failed to fetch gap analysis' });
  }
});

/**
 * GET /api/survey-intel/team/:teamId/common-issues
 * Tags cited at 2+ facilities in the team
 */
router.get('/team/:teamId/common-issues', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = getExternalPool();

    const team = await Team.findByPk(teamId, {
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name', 'ccn']
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ccns = team.facilities.map(f => f.ccn).filter(Boolean);

    // Get deficiencies grouped by tag and facility
    const { rows: deficiencies } = await pool.query(`
      SELECT
        d.deficiency_tag,
        d.federal_provider_number,
        d.scope_severity,
        d.survey_date
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= NOW() - INTERVAL '2 years'
      ORDER BY d.survey_date DESC
    `, [ccns]);

    // Group by tag and count unique facilities
    const tagAnalysis = {};
    deficiencies.forEach(def => {
      if (!tagAnalysis[def.deficiency_tag]) {
        tagAnalysis[def.deficiency_tag] = {
          tag: def.deficiency_tag,
          facilities: new Set(),
          totalCitations: 0,
          dates: [],
          severities: []
        };
      }
      tagAnalysis[def.deficiency_tag].facilities.add(def.federal_provider_number);
      tagAnalysis[def.deficiency_tag].totalCitations++;
      tagAnalysis[def.deficiency_tag].dates.push(def.survey_date);
      tagAnalysis[def.deficiency_tag].severities.push(def.scope_severity);
    });

    // Filter to tags at 2+ facilities
    const commonIssues = Object.values(tagAnalysis)
      .filter(t => t.facilities.size >= 2)
      .map(t => {
        // Determine trend (are citations getting more recent?)
        const sortedDates = t.dates.sort((a, b) => new Date(b) - new Date(a));
        const mostRecent = new Date(sortedDates[0]);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        let trend = 'stable';
        const recentCount = sortedDates.filter(d => new Date(d) >= sixMonthsAgo).length;
        const olderCount = sortedDates.filter(d => new Date(d) < sixMonthsAgo).length;
        if (recentCount > olderCount) trend = 'worsening';
        else if (recentCount < olderCount && recentCount === 0) trend = 'improving';

        // System mapping
        const systemId = tagToSystem[t.tag];

        return {
          tag: t.tag,
          systemNumber: systemId,
          systemName: systemId ? systemNames[systemId] : 'Other',
          facilitiesAffected: t.facilities.size,
          totalCitations: t.totalCitations,
          trend,
          lastCited: mostRecent
        };
      })
      .sort((a, b) => b.facilitiesAffected - a.facilitiesAffected || b.totalCitations - a.totalCitations);

    // Pool is reused, no close needed

    res.json({
      teamId,
      teamName: team.name,
      facilityCount: team.facilities.length,
      commonIssues,
      insight: commonIssues.length > 0
        ? `${commonIssues.length} tags affect multiple facilities. Consider team-wide training or policy review.`
        : 'No common issues found across facilities.'
    });

  } catch (error) {
    console.error('Error fetching common issues:', error);
    res.status(500).json({ error: 'Failed to fetch common issues' });
  }
});

/**
 * GET /api/survey-intel/team/:teamId/market-comparison
 * Team vs state vs national benchmarks
 */
router.get('/team/:teamId/market-comparison', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = getExternalPool();

    const team = await Team.findByPk(teamId, {
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name', 'ccn']
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ccns = team.facilities.map(f => f.ccn).filter(Boolean);

    // Get team facilities' state
    const { rows: facilityInfo } = await pool.query(`
      SELECT DISTINCT state
      FROM snf_facilities
      WHERE federal_provider_number = ANY($1)
    `, [ccns]);

    const states = facilityInfo.map(f => f.state);
    const primaryState = states[0] || 'Unknown';

    // Team metrics
    const { rows: teamDefs } = await pool.query(`
      SELECT
        d.federal_provider_number,
        d.deficiency_tag,
        d.scope_severity,
        d.survey_date
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= NOW() - INTERVAL '1 year'
    `, [ccns]);

    const teamCitationsPerFacility = ccns.length > 0 
      ? teamDefs.length / ccns.length 
      : 0;
    
    const teamIjCount = teamDefs.filter(d => 
      d.scope_severity?.match(/[JKL]/)
    ).length;
    const teamIjRate = ccns.length > 0 
      ? (teamIjCount / ccns.length) * 100 
      : 0;

    // State averages
    const { rows: stateDefs } = await pool.query(`
      SELECT
        COUNT(*) as total_citations,
        COUNT(DISTINCT d.federal_provider_number) as facility_count,
        SUM(CASE WHEN d.scope_severity ~ '[JKL]' THEN 1 ELSE 0 END) as ij_count
      FROM cms_facility_deficiencies d
      JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
      WHERE f.state = $1
        AND d.survey_date >= NOW() - INTERVAL '1 year'
    `, [primaryState]);

    const stateData = stateDefs[0] || { total_citations: 0, facility_count: 1, ij_count: 0 };
    const stateCitationsPerFacility = stateData.facility_count > 0 
      ? stateData.total_citations / stateData.facility_count 
      : 0;
    const stateIjRate = stateData.facility_count > 0 
      ? (stateData.ij_count / stateData.facility_count) * 100 
      : 0;

    // National averages (approximate)
    const { rows: nationalDefs } = await pool.query(`
      SELECT
        COUNT(*) as total_citations,
        COUNT(DISTINCT federal_provider_number) as facility_count,
        SUM(CASE WHEN scope_severity ~ '[JKL]' THEN 1 ELSE 0 END) as ij_count
      FROM cms_facility_deficiencies
      WHERE survey_date >= NOW() - INTERVAL '1 year'
    `);

    const nationalData = nationalDefs[0] || { total_citations: 0, facility_count: 1, ij_count: 0 };
    const nationalCitationsPerFacility = nationalData.facility_count > 0 
      ? nationalData.total_citations / nationalData.facility_count 
      : 0;
    const nationalIjRate = nationalData.facility_count > 0 
      ? (nationalData.ij_count / nationalData.facility_count) * 100 
      : 0;

    // Pool is reused, no close needed

    res.json({
      teamId,
      teamName: team.name,
      state: primaryState,
      comparison: {
        citationsPerFacility: {
          team: Math.round(teamCitationsPerFacility * 10) / 10,
          state: Math.round(stateCitationsPerFacility * 10) / 10,
          national: Math.round(nationalCitationsPerFacility * 10) / 10
        },
        ijRate: {
          team: Math.round(teamIjRate * 10) / 10,
          state: Math.round(stateIjRate * 10) / 10,
          national: Math.round(nationalIjRate * 10) / 10
        }
      },
      insight: teamCitationsPerFacility > stateCitationsPerFacility
        ? `Team averages ${Math.round(teamCitationsPerFacility - stateCitationsPerFacility)} more citations per facility than the state average.`
        : `Team performs better than state average by ${Math.round(stateCitationsPerFacility - teamCitationsPerFacility)} fewer citations per facility.`
    });

  } catch (error) {
    console.error('Error fetching market comparison:', error);
    res.status(500).json({ error: 'Failed to fetch market comparison' });
  }
});

/**
 * GET /api/survey-intel/team/:teamId/scorecard-trends
 * Monthly scorecard averages (last 6 months)
 */
router.get('/team/:teamId/scorecard-trends', async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findByPk(teamId, {
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name'],
        include: [{
          model: Scorecard,
          as: 'scorecards',
          where: {
            [Op.or]: [
              // Current year, recent months
              {
                year: new Date().getFullYear(),
                month: { [Op.gte]: new Date().getMonth() - 5 }
              },
              // Previous year if we're in early months
              {
                year: new Date().getFullYear() - 1,
                month: { [Op.gte]: new Date().getMonth() + 7 }
              }
            ]
          },
          required: false,
          include: [{
            model: ScorecardSystem,
            as: 'systems'
          }]
        }]
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Group scorecards by month
    const monthlyData = {};
    const systemMonthlyData = {};

    team.facilities.forEach(facility => {
      facility.scorecards?.forEach(scorecard => {
        const monthKey = `${scorecard.year}-${String(scorecard.month).padStart(2, '0')}`; // YYYY-MM
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = [];
        }

        // Overall scorecard score
        const systemScores = scorecard.systems?.map(s => s.score).filter(s => s !== null) || [];
        if (systemScores.length > 0) {
          const avgScore = systemScores.reduce((a, b) => a + b, 0) / systemScores.length;
          monthlyData[monthKey].push(avgScore);
        }

        // Per-system scores
        scorecard.systems?.forEach(sys => {
          if (sys.score !== null) {
            const key = `${monthKey}-${sys.systemNumber}`;
            if (!systemMonthlyData[key]) {
              systemMonthlyData[key] = { month: monthKey, systemNumber: sys.systemNumber, scores: [] };
            }
            systemMonthlyData[key].scores.push(sys.score);
          }
        });
      });
    });

    // Calculate monthly averages
    const trends = Object.entries(monthlyData)
      .map(([month, scores]) => ({
        month,
        avgScore: scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null,
        facilityCount: scores.length
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate per-system trends
    const systemTrends = {};
    for (let i = 1; i <= 7; i++) {
      systemTrends[i] = {
        systemNumber: i,
        systemName: systemNames[i],
        data: []
      };
    }

    Object.values(systemMonthlyData).forEach(item => {
      const avgScore = item.scores.length > 0
        ? Math.round(item.scores.reduce((a, b) => a + b, 0) / item.scores.length)
        : null;
      
      systemTrends[item.systemNumber]?.data.push({
        month: item.month,
        avgScore
      });
    });

    // Sort system data by month
    Object.values(systemTrends).forEach(sys => {
      sys.data.sort((a, b) => a.month.localeCompare(b.month));
    });

    res.json({
      teamId,
      teamName: team.name,
      trends,
      systemTrends: Object.values(systemTrends)
    });

  } catch (error) {
    console.error('Error fetching scorecard trends:', error);
    res.status(500).json({ error: 'Failed to fetch scorecard trends' });
  }
});

/**
 * GET /api/survey-intel/team/:teamId/recommendations
 * AI-generated team-level recommendations
 */
router.get('/team/:teamId/recommendations', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = getExternalPool();

    const team = await Team.findByPk(teamId, {
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name', 'ccn'],
        include: [{
          model: Scorecard,
          as: 'scorecards',
          limit: 1,
          order: [['year', 'DESC'], ['month', 'DESC']],
          include: [{
            model: ScorecardSystem,
            as: 'systems'
          }]
        }]
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ccns = team.facilities.map(f => f.ccn).filter(Boolean);

    // Get recent deficiencies
    const { rows: deficiencies } = await pool.query(`
      SELECT
        d.federal_provider_number,
        d.deficiency_tag,
        d.scope_severity,
        d.survey_date
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= NOW() - INTERVAL '2 years'
    `, [ccns]);

    const recommendations = {
      critical: [],
      focus: [],
      watch: []
    };

    // Analyze by system
    for (let systemId = 1; systemId <= 7; systemId++) {
      const systemTags = Object.keys(tagToSystem).filter(t => tagToSystem[t] === systemId);
      const systemDefs = deficiencies.filter(d => systemTags.includes(d.deficiency_tag));
      const facilitiesWithCitations = new Set(systemDefs.map(d => d.federal_provider_number));
      
      // Calculate scorecard average for this system
      const scorecardScores = [];
      team.facilities.forEach(f => {
        const systemScore = f.scorecards?.[0]?.systems?.find(s => s.systemNumber === systemId);
        if (systemScore?.score !== null && systemScore?.score !== undefined) {
          scorecardScores.push(systemScore.score);
        }
      });
      
      const scorecardAvg = scorecardScores.length > 0
        ? scorecardScores.reduce((a, b) => a + b, 0) / scorecardScores.length
        : null;

      // Has severe citations?
      const hasSevere = systemDefs.some(d => d.scope_severity?.match(/[JKL]/));

      // Generate recommendation
      if (hasSevere || (facilitiesWithCitations.size >= 3 && scorecardAvg !== null && scorecardAvg < 75)) {
        recommendations.critical.push({
          system: systemNames[systemId],
          reason: hasSevere 
            ? `Immediate jeopardy citations exist in ${systemNames[systemId]}`
            : `${facilitiesWithCitations.size} facilities cited + team scorecard avg ${Math.round(scorecardAvg)}%`,
          action: `Schedule team-wide ${systemNames[systemId]} training within 2 weeks`,
          facilitiesAffected: facilitiesWithCitations.size
        });
      } else if (facilitiesWithCitations.size >= 2 || (scorecardAvg !== null && scorecardAvg < 75)) {
        recommendations.focus.push({
          system: systemNames[systemId],
          reason: facilitiesWithCitations.size >= 2
            ? `${facilitiesWithCitations.size} facilities have citations`
            : `Team scorecard average is ${Math.round(scorecardAvg)}%`,
          action: `Review ${systemNames[systemId]} policies and audit criteria`,
          facilitiesAffected: facilitiesWithCitations.size
        });
      } else if (facilitiesWithCitations.size === 1 || (scorecardAvg !== null && scorecardAvg < 85)) {
        recommendations.watch.push({
          system: systemNames[systemId],
          reason: `${facilitiesWithCitations.size} facility has citations or scores below target`,
          action: `Monitor ${systemNames[systemId]} trends`,
          facilitiesAffected: facilitiesWithCitations.size
        });
      }
    }

    // Check for common tags across facilities
    const tagFacilities = {};
    deficiencies.forEach(d => {
      if (!tagFacilities[d.deficiency_tag]) {
        tagFacilities[d.deficiency_tag] = new Set();
      }
      tagFacilities[d.deficiency_tag].add(d.federal_provider_number);
    });

    Object.entries(tagFacilities).forEach(([tag, facilities]) => {
      if (facilities.size >= Math.ceil(ccns.length / 2)) {
        // More than half the team has this tag
        recommendations.critical.push({
          system: `Tag ${tag}`,
          reason: `Cited at ${facilities.size} of ${ccns.length} facilities`,
          action: `Implement standardized ${tag} compliance protocol across all facilities`,
          facilitiesAffected: facilities.size
        });
      }
    });

    // Pool is reused, no close needed

    res.json({
      teamId,
      teamName: team.name,
      recommendations,
      summary: {
        criticalCount: recommendations.critical.length,
        focusCount: recommendations.focus.length,
        watchCount: recommendations.watch.length
      }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * GET /api/survey-intel/team/:teamId/risk-trend
 * Historical team risk scores over the last 12 months
 */
router.get('/team/:teamId/risk-trend', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = getExternalPool();

    const team = await Team.findByPk(teamId, {
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name', 'ccn']
      }]
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const ccns = team.facilities.map(f => f.ccn).filter(Boolean);

    if (ccns.length === 0) {
      return res.json({
        teamId,
        teamName: team.name,
        trend: [],
        message: 'No facilities with CCN linked to CMS data'
      });
    }

    // Get all deficiencies for the last 4 years (to have history for calculations)
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);

    const { rows: allDeficiencies } = await pool.query(`
      SELECT
        d.federal_provider_number,
        d.deficiency_tag,
        d.scope_severity,
        d.survey_date
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= $2
      ORDER BY d.survey_date DESC
    `, [ccns, fourYearsAgo.toISOString()]);

    // Calculate risk score for each of the last 12 months
    const trend = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const threeYearsBefore = new Date(monthEnd);
      threeYearsBefore.setFullYear(threeYearsBefore.getFullYear() - 3);

      // Filter deficiencies that would have been visible at this point in time
      const relevantDefs = allDeficiencies.filter(d => {
        const surveyDate = new Date(d.survey_date);
        return surveyDate <= monthEnd && surveyDate >= threeYearsBefore;
      });

      // Calculate risk per facility
      const facilityRisks = [];
      for (const facility of team.facilities) {
        if (!facility.ccn) continue;

        const facilityDefs = relevantDefs.filter(d => d.federal_provider_number === facility.ccn);
        const lastSurvey = facilityDefs[0]?.survey_date;
        const daysSince = lastSurvey
          ? Math.floor((monthEnd - new Date(lastSurvey)) / (1000 * 60 * 60 * 24))
          : 999;

        const risk = calculateRiskScore(facilityDefs, daysSince);
        facilityRisks.push(risk.score);
      }

      // Team average
      const avgRisk = facilityRisks.length > 0
        ? Math.round(facilityRisks.reduce((sum, s) => sum + s, 0) / facilityRisks.length)
        : 0;

      trend.push({
        month: monthEnd.toISOString().slice(0, 7), // YYYY-MM format
        monthLabel: monthEnd.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        riskScore: avgRisk,
        riskLevel: avgRisk > 70 ? 'HIGH' : avgRisk > 40 ? 'MODERATE' : 'LOW'
      });
    }

    res.json({
      teamId,
      teamName: team.name,
      facilityCount: ccns.length,
      trend
    });

  } catch (error) {
    console.error('Error fetching risk trend:', error);
    res.status(500).json({ error: 'Failed to fetch risk trend' });
  }
});

/**
 * GET /api/survey-intel/teams
 * List all teams for the team selector dropdown
 */
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'ccn']
      }]
    });

    const teamsWithCounts = teams.map(team => ({
      id: team.id,
      name: team.name,
      facilityCount: team.facilities.length,
      facilitiesWithCcn: team.facilities.filter(f => f.ccn).length
    }));

    res.json({ teams: teamsWithCounts });

  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

/**
 * GET /api/survey-intel/teams/risk-trend
 * Get risk trend data for ALL teams (for the overview chart)
 * Query params:
 *   - months: 3, 6, 12, 24, or 36 (default 12)
 */
router.get('/teams/risk-trend', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const validMonths = [3, 6, 12, 24, 36];
    const numMonths = validMonths.includes(months) ? months : 12;

    // Get all teams with facilities
    const teams = await Team.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'ccn']
      }]
    });

    if (teams.length === 0) {
      return res.json({ teams: [] });
    }

    // Collect all CCNs across all teams
    const allCcns = [];
    teams.forEach(team => {
      team.facilities.forEach(f => {
        if (f.ccn && !allCcns.includes(f.ccn)) {
          allCcns.push(f.ccn);
        }
      });
    });

    if (allCcns.length === 0) {
      // No facilities with CCNs, return empty trends
      const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
      return res.json({
        teams: teams.map((team, idx) => ({
          teamId: team.id,
          teamName: team.name,
          color: colors[idx % colors.length],
          facilityCount: team.facilities.length,
          currentRiskScore: 0,
          riskLevel: 'LOW',
          data: []
        }))
      });
    }

    // Fetch all deficiencies for all CCNs at once
    // Need 6 years of data to support 3 year trends + 3 year lookback for risk calculation
    const pool = getExternalPool();
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);

    const { rows: allDeficiencies } = await pool.query(`
      SELECT
        federal_provider_number,
        deficiency_tag,
        scope_severity,
        survey_date
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= $2
      ORDER BY d.survey_date DESC
    `, [allCcns, sixYearsAgo.toISOString()]);

    // Color palette for teams
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

    // Calculate trend for each team
    const teamsData = teams.map((team, teamIndex) => {
      const teamCcns = team.facilities.filter(f => f.ccn).map(f => f.ccn);
      const teamDeficiencies = allDeficiencies.filter(d => teamCcns.includes(d.federal_provider_number));

      const trend = [];
      const now = new Date();

      for (let i = numMonths - 1; i >= 0; i--) {
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const threeYearsBefore = new Date(monthEnd);
        threeYearsBefore.setFullYear(threeYearsBefore.getFullYear() - 3);

        // Filter deficiencies visible at this point in time
        const relevantDefs = teamDeficiencies.filter(d => {
          const surveyDate = new Date(d.survey_date);
          return surveyDate <= monthEnd && surveyDate >= threeYearsBefore;
        });

        // Calculate risk per facility
        const facilityRisks = [];
        for (const ccn of teamCcns) {
          const facilityDefs = relevantDefs.filter(d => d.federal_provider_number === ccn);
          const lastSurvey = facilityDefs[0]?.survey_date;
          const daysSince = lastSurvey
            ? Math.floor((monthEnd - new Date(lastSurvey)) / (1000 * 60 * 60 * 24))
            : 999;

          const risk = calculateRiskScore(facilityDefs, daysSince);
          facilityRisks.push(risk.score);
        }

        // Team average
        const avgRisk = facilityRisks.length > 0
          ? Math.round(facilityRisks.reduce((sum, s) => sum + s, 0) / facilityRisks.length)
          : 0;

        trend.push({
          month: monthEnd.toISOString().slice(0, 7),
          monthLabel: monthEnd.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          riskScore: avgRisk
        });
      }

      // Current risk score is the last data point
      const currentRiskScore = trend.length > 0 ? trend[trend.length - 1].riskScore : 0;
      const riskLevel = currentRiskScore > 70 ? 'HIGH' : currentRiskScore > 40 ? 'MODERATE' : 'LOW';

      return {
        teamId: team.id,
        teamName: team.name,
        color: colors[teamIndex % colors.length],
        facilityCount: team.facilities.length,
        currentRiskScore,
        riskLevel,
        data: trend
      };
    });

    res.json({ teams: teamsData });

  } catch (error) {
    console.error('Error fetching all teams risk trend:', error);
    res.status(500).json({ error: 'Failed to fetch teams risk trend' });
  }
});

/**
 * GET /api/survey-intel/facilities/risk-trend
 * Get risk trend data for ALL facilities (for the facility-level overview chart)
 * Query params:
 *   - months: 3, 6, 12, 24, or 36 (default 12)
 */
router.get('/facilities/risk-trend', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const validMonths = [3, 6, 12, 24, 36];
    const numMonths = validMonths.includes(months) ? months : 12;

    // Get all facilities with CCNs, grouped by team
    const teams = await Team.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
      include: [{
        model: Facility,
        as: 'facilities',
        attributes: ['id', 'name', 'ccn'],
        where: { ccn: { [Op.ne]: null } },
        required: false
      }]
    });

    // Flatten facilities and collect CCNs
    const allFacilities = [];
    const allCcns = [];

    teams.forEach(team => {
      team.facilities?.forEach(f => {
        if (f.ccn) {
          allFacilities.push({
            id: f.id,
            name: f.name,
            ccn: f.ccn,
            teamId: team.id,
            teamName: team.name
          });
          if (!allCcns.includes(f.ccn)) {
            allCcns.push(f.ccn);
          }
        }
      });
    });

    if (allCcns.length === 0) {
      return res.json({ facilities: [] });
    }

    // Fetch all deficiencies
    const pool = getExternalPool();
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);

    const { rows: allDeficiencies } = await pool.query(`
      SELECT
        federal_provider_number,
        deficiency_tag,
        scope_severity,
        survey_date
      FROM cms_facility_deficiencies d
      WHERE d.federal_provider_number = ANY($1)
        AND d.survey_date >= $2
      ORDER BY d.survey_date DESC
    `, [allCcns, sixYearsAgo.toISOString()]);

    // Extended color palette for facilities
    const colors = [
      '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6',
      '#a855f7', '#0ea5e9', '#22c55e', '#eab308', '#f97316', '#d946ef', '#6d28d9', '#0d9488',
      '#c084fc', '#38bdf8', '#4ade80', '#facc15', '#fb923c', '#f472b6', '#818cf8', '#2dd4bf'
    ];

    // Calculate trend for each facility
    const facilitiesData = allFacilities.map((facility, index) => {
      const facilityDefs = allDeficiencies.filter(d => d.federal_provider_number === facility.ccn);

      const trend = [];
      const now = new Date();

      for (let i = numMonths - 1; i >= 0; i--) {
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const threeYearsBefore = new Date(monthEnd);
        threeYearsBefore.setFullYear(threeYearsBefore.getFullYear() - 3);

        // Filter deficiencies visible at this point in time
        const relevantDefs = facilityDefs.filter(d => {
          const surveyDate = new Date(d.survey_date);
          return surveyDate <= monthEnd && surveyDate >= threeYearsBefore;
        });

        const lastSurvey = relevantDefs[0]?.survey_date;
        const daysSince = lastSurvey
          ? Math.floor((monthEnd - new Date(lastSurvey)) / (1000 * 60 * 60 * 24))
          : 999;

        const risk = calculateRiskScore(relevantDefs, daysSince);

        trend.push({
          month: monthEnd.toISOString().slice(0, 7),
          monthLabel: monthEnd.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          riskScore: risk.score
        });
      }

      const currentRiskScore = trend.length > 0 ? trend[trend.length - 1].riskScore : 0;
      const riskLevel = currentRiskScore > 70 ? 'HIGH' : currentRiskScore > 40 ? 'MODERATE' : 'LOW';

      return {
        facilityId: facility.id,
        facilityName: facility.name,
        ccn: facility.ccn,
        teamId: facility.teamId,
        teamName: facility.teamName,
        color: colors[index % colors.length],
        currentRiskScore,
        riskLevel,
        data: trend
      };
    });

    res.json({ facilities: facilitiesData });

  } catch (error) {
    console.error('Error fetching all facilities risk trend:', error);
    res.status(500).json({ error: 'Failed to fetch facilities risk trend' });
  }
});

module.exports = router;
