/**
 * Survey Intelligence API Routes
 *
 * Provides endpoints for predictive risk insights based on CMS survey data.
 * Transforms raw CMS data into actionable intelligence for clinical leaders.
 *
 * Database: market_database (MARKET_DATABASE_URL) - read-only access
 */

const express = require('express');
const router = express.Router();
const { getMarketPool } = require('../config/marketDatabase');
const { Facility, Team, Company, Scorecard, ScorecardSystem } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * F-Tag to Clinical System Mapping
 * Maps CMS F-tags to the 7 internal audit systems
 */
const TAG_TO_SYSTEM = {
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
  'F600': 7, 'F602': 7, 'F603': 7, 'F604': 7, 'F607': 7,
  'F609': 7, 'F610': 7, 'F611': 7, 'F585': 7
};

/**
 * System names for display
 */
const SYSTEM_NAMES = {
  1: 'Change of Condition',
  2: 'Falls/Accidents',
  3: 'Skin',
  4: 'Meds/Weight',
  5: 'Infection Control',
  6: 'Transfer/Discharge',
  7: 'Abuse/Grievances'
};

/**
 * Severity score mapping (higher = worse)
 * Used for risk score calculation
 */
const SEVERITY_SCORES = {
  'A': 0, 'B': 10, 'C': 20, 'D': 40, 'E': 60, 'F': 75, 'G': 90, 'H': 95, 'I': 97, 'J': 98, 'K': 99, 'L': 100
};

/**
 * Risk score thresholds
 */
const RISK_THRESHOLDS = {
  LOW: 40,      // 0-40 = Low Risk (green)
  MODERATE: 70  // 41-70 = Moderate Risk (yellow), 71-100 = High Risk (red)
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get facility with CCN by internal ID
 */
async function getFacilityWithCCN(facilityId) {
  const facility = await Facility.findByPk(facilityId, {
    include: [{
      model: Team,
      as: 'team',
      include: [{ model: Company, as: 'company' }]
    }]
  });

  if (!facility) {
    return null;
  }

  return {
    id: facility.id,
    name: facility.name,
    ccn: facility.ccn,
    state: facility.state,
    city: facility.city,
    teamId: facility.teamId,
    teamName: facility.team?.name,
    companyId: facility.team?.company?.id,
    companyName: facility.team?.company?.name
  };
}

/**
 * Calculate months since a date
 */
function monthsSince(date) {
  if (!date) return null;
  const surveyDate = new Date(date);
  const now = new Date();
  return Math.floor((now - surveyDate) / (1000 * 60 * 60 * 24 * 30));
}

/**
 * Get severity level from scope_severity code (e.g., "D" from "D2" or just "D")
 */
function getSeverityLevel(scopeSeverity) {
  if (!scopeSeverity) return null;
  return scopeSeverity.charAt(0).toUpperCase();
}

/**
 * Calculate recency score (20% weight)
 * 0-40: <6 months (recent = lower risk)
 * 40-70: 6-12 months
 * 70-100: >12 months (overdue = higher risk)
 */
function calculateRecencyScore(monthsSinceSurvey) {
  if (monthsSinceSurvey === null) return 85; // No survey = high risk
  if (monthsSinceSurvey <= 6) return Math.max(0, monthsSinceSurvey * 6);
  if (monthsSinceSurvey <= 12) return 40 + ((monthsSinceSurvey - 6) * 5);
  if (monthsSinceSurvey <= 18) return 70 + ((monthsSinceSurvey - 12) * 5);
  return Math.min(100, 85 + (monthsSinceSurvey - 18) * 2);
}

/**
 * Calculate history severity score (25% weight)
 * Based on max severity in history
 */
function calculateHistorySeverityScore(maxSeverity) {
  if (!maxSeverity) return 20; // No history = low risk
  return SEVERITY_SCORES[maxSeverity] || 40;
}

/**
 * Calculate repeat rate score (20% weight)
 * % of tags that are repeats × 100
 */
function calculateRepeatScore(repeatRate) {
  return Math.min(100, Math.round(repeatRate * 100));
}

/**
 * Calculate market alignment score (20% weight)
 * # of your tags in state's top 10 hot tags × 10
 */
function calculateMarketAlignmentScore(matchingHotTags) {
  return Math.min(100, matchingHotTags * 10);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score) {
  if (score <= RISK_THRESHOLDS.LOW) return 'low';
  if (score <= RISK_THRESHOLDS.MODERATE) return 'moderate';
  return 'high';
}

/**
 * Classify tag trend based on severity history
 */
function classifyTagTrend(citations) {
  if (citations.length === 0) return 'none';
  if (citations.length === 1) return 'new';

  // Sort by date descending
  const sorted = [...citations].sort((a, b) => new Date(b.surveyDate) - new Date(a.surveyDate));
  const latestSeverity = SEVERITY_SCORES[getSeverityLevel(sorted[0].severity)] || 0;
  const previousSeverity = SEVERITY_SCORES[getSeverityLevel(sorted[1].severity)] || 0;

  if (latestSeverity > previousSeverity) return 'worsening';
  if (latestSeverity < previousSeverity) return 'improving';
  return 'persistent';
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * GET /api/survey-intel/facility/:facilityId/risk-score
 *
 * Calculate overall risk score (0-100) for a facility
 *
 * Risk Score = weighted average of:
 * - Survey Recency (20%): Time since last survey
 * - History Severity (25%): Max severity in history
 * - Repeat Rate (20%): % of tags that are repeats
 * - Market Alignment (20%): # of hot tags in your history
 * - Internal Audits (15%): Skip for now - add later
 */
router.get('/facility/:facilityId/risk-score', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;

    // Get facility with CCN
    const facility = await getFacilityWithCCN(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    if (!facility.ccn) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Facility not linked to CMS data (no CCN)',
        facility: { id: facility.id, name: facility.name }
      });
    }

    const pool = getMarketPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Market database not available' });
    }

    // Get survey history (3-year lookback)
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const deficienciesResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity,
        deficiency_text
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND survey_date >= $2
      ORDER BY survey_date DESC
    `, [facility.ccn, threeYearsAgo.toISOString()]);

    const deficiencies = deficienciesResult.rows;

    // Get last survey date
    const lastSurveyResult = await pool.query(`
      SELECT MAX(survey_date) as last_survey_date
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
    `, [facility.ccn]);

    const lastSurveyDate = lastSurveyResult.rows[0]?.last_survey_date;
    const monthsSinceLastSurvey = monthsSince(lastSurveyDate);

    // Calculate max severity
    let maxSeverity = null;
    deficiencies.forEach(d => {
      const severity = getSeverityLevel(d.scope_severity);
      if (!maxSeverity || (SEVERITY_SCORES[severity] || 0) > (SEVERITY_SCORES[maxSeverity] || 0)) {
        maxSeverity = severity;
      }
    });

    // Calculate repeat rate
    const tagOccurrences = {};
    deficiencies.forEach(d => {
      tagOccurrences[d.deficiency_tag] = (tagOccurrences[d.deficiency_tag] || 0) + 1;
    });
    const uniqueTags = Object.keys(tagOccurrences);
    const repeatedTags = uniqueTags.filter(tag => tagOccurrences[tag] > 1);
    const repeatRate = uniqueTags.length > 0 ? repeatedTags.length / uniqueTags.length : 0;

    // Get facility's state from snf_facilities (since internal facility may not have state)
    const facilityInfoResult = await pool.query(`
      SELECT state FROM snf_facilities WHERE federal_provider_number = $1 LIMIT 1
    `, [facility.ccn]);
    const facilityState = facilityInfoResult.rows[0]?.state || facility.state;

    // Get state hot tags (top 10 trending in state) - join with snf_facilities for state
    const hotTagsResult = await pool.query(`
      SELECT
        d.deficiency_tag,
        COUNT(*) as count
      FROM cms_facility_deficiencies d
      JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
      WHERE f.state = $1
        AND d.survey_date >= NOW() - INTERVAL '6 months'
      GROUP BY d.deficiency_tag
      ORDER BY count DESC
      LIMIT 10
    `, [facilityState]);

    const hotTags = hotTagsResult.rows.map(r => r.deficiency_tag);
    const matchingHotTags = uniqueTags.filter(tag => hotTags.includes(tag)).length;

    // Calculate individual factor scores
    const recencyScore = calculateRecencyScore(monthsSinceLastSurvey);
    const historySeverityScore = calculateHistorySeverityScore(maxSeverity);
    const repeatScore = calculateRepeatScore(repeatRate);
    const marketAlignmentScore = calculateMarketAlignmentScore(matchingHotTags);

    // Weighted average (skip internal audits for now - 15% weight redistributed)
    // Recency: 20% -> 24%, History: 25% -> 29%, Repeat: 20% -> 24%, Market: 20% -> 23%
    const riskScore = Math.round(
      recencyScore * 0.24 +
      historySeverityScore * 0.29 +
      repeatScore * 0.24 +
      marketAlignmentScore * 0.23
    );

    // Get state percentile - join with snf_facilities for state filtering
    const percentileResult = await pool.query(`
      WITH facility_scores AS (
        SELECT
          d.federal_provider_number,
          COUNT(*) as deficiency_count
        FROM cms_facility_deficiencies d
        JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
        WHERE f.state = $1
          AND d.survey_date >= NOW() - INTERVAL '3 years'
        GROUP BY d.federal_provider_number
      )
      SELECT
        COUNT(*) FILTER (WHERE deficiency_count > $2) * 100.0 / NULLIF(COUNT(*), 0) as percentile
      FROM facility_scores
    `, [facilityState, deficiencies.length]);

    const percentileBetterThan = Math.round(percentileResult.rows[0]?.percentile || 50);

    res.json({
      success: true,
      hasData: true,
      facility: {
        id: facility.id,
        name: facility.name,
        ccn: facility.ccn,
        state: facilityState,
        city: facility.city
      },
      riskScore: {
        score: riskScore,
        level: getRiskLevel(riskScore),
        percentileBetterThan,
        trend: null // TODO: Calculate based on historical scores
      },
      factors: {
        surveyRecency: {
          score: recencyScore,
          weight: 0.24,
          monthsSinceSurvey: monthsSinceLastSurvey,
          lastSurveyDate
        },
        historySeverity: {
          score: historySeverityScore,
          weight: 0.29,
          maxSeverity,
          totalDeficiencies: deficiencies.length
        },
        repeatRate: {
          score: repeatScore,
          weight: 0.24,
          rate: Math.round(repeatRate * 100),
          repeatedTagCount: repeatedTags.length,
          totalTagCount: uniqueTags.length
        },
        marketAlignment: {
          score: marketAlignmentScore,
          weight: 0.23,
          matchingHotTags,
          hotTags: hotTags.slice(0, 5) // Top 5 for display
        },
        internalAudits: {
          score: null,
          weight: 0,
          message: 'Coming soon - will integrate scorecard scores'
        }
      },
      surveyTiming: {
        lastSurveyDate,
        monthsSinceSurvey: monthsSinceLastSurvey,
        estimatedWindow: monthsSinceLastSurvey >= 12
          ? 'Overdue - could be surveyed any time'
          : monthsSinceLastSurvey >= 9
            ? '0-3 months'
            : '3-6 months'
      }
    });

  } catch (error) {
    console.error('[Survey Intel] Error calculating risk score:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/survey-intel/facility/:facilityId/trends
 *
 * Get deficiency trend data for trajectory analysis
 * Shows worsening/persistent/improving patterns
 */
router.get('/facility/:facilityId/trends', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;

    const facility = await getFacilityWithCCN(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    if (!facility.ccn) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Facility not linked to CMS data (no CCN)'
      });
    }

    const pool = getMarketPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Market database not available' });
    }

    // Get all deficiencies (3-year lookback)
    const deficienciesResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND survey_date >= NOW() - INTERVAL '3 years'
      ORDER BY survey_date DESC
    `, [facility.ccn]);

    const deficiencies = deficienciesResult.rows;

    // Get facility's state from snf_facilities
    const facilityInfoResult = await pool.query(`
      SELECT state FROM snf_facilities WHERE federal_provider_number = $1 LIMIT 1
    `, [facility.ccn]);
    const facilityState = facilityInfoResult.rows[0]?.state || facility.state;

    // Get state averages for comparison - join with snf_facilities for state
    const stateAvgResult = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM d.survey_date) as year,
        COUNT(*)::float / NULLIF(COUNT(DISTINCT d.federal_provider_number), 0) as avg_deficiencies
      FROM cms_facility_deficiencies d
      JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
      WHERE f.state = $1
        AND d.survey_date >= NOW() - INTERVAL '3 years'
      GROUP BY EXTRACT(YEAR FROM d.survey_date)
      ORDER BY year
    `, [facilityState]);

    // Group deficiencies by survey
    const surveyMap = {};
    deficiencies.forEach(d => {
      const key = d.survey_date.toISOString().split('T')[0];
      if (!surveyMap[key]) {
        surveyMap[key] = {
          date: key,
          type: d.survey_type,
          deficiencies: [],
          count: 0,
          severities: {}
        };
      }
      surveyMap[key].deficiencies.push(d);
      surveyMap[key].count++;
      const severity = getSeverityLevel(d.scope_severity);
      surveyMap[key].severities[severity] = (surveyMap[key].severities[severity] || 0) + 1;
    });

    const surveys = Object.values(surveyMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group deficiencies by tag for trend analysis
    const tagMap = {};
    deficiencies.forEach(d => {
      if (!tagMap[d.deficiency_tag]) {
        tagMap[d.deficiency_tag] = [];
      }
      tagMap[d.deficiency_tag].push({
        surveyDate: d.survey_date,
        severity: d.scope_severity
      });
    });

    // Get most recent survey date
    const lastSurveyDate = surveys.length > 0 ? surveys[surveys.length - 1].date : null;
    const lastSurveyTags = lastSurveyDate
      ? surveyMap[lastSurveyDate]?.deficiencies.map(d => d.deficiency_tag) || []
      : [];

    // Classify each tag
    const worsening = [];
    const persistent = [];
    const improving = [];
    const resolved = [];
    const newTags = [];

    Object.keys(tagMap).forEach(tag => {
      const citations = tagMap[tag];
      const trend = classifyTagTrend(citations);
      const isInLastSurvey = lastSurveyTags.includes(tag);

      const tagInfo = {
        tag,
        system: TAG_TO_SYSTEM[tag] || null,
        systemName: TAG_TO_SYSTEM[tag] ? SYSTEM_NAMES[TAG_TO_SYSTEM[tag]] : 'Other',
        citations: citations.map(c => ({
          date: c.surveyDate,
          severity: getSeverityLevel(c.severity)
        })),
        citationCount: citations.length
      };

      if (!isInLastSurvey && citations.length > 0) {
        resolved.push(tagInfo);
      } else if (trend === 'new') {
        newTags.push(tagInfo);
      } else if (trend === 'worsening') {
        worsening.push(tagInfo);
      } else if (trend === 'improving') {
        improving.push(tagInfo);
      } else {
        persistent.push(tagInfo);
      }
    });

    // Calculate trajectory
    let countTrajectory = 'stable';
    let severityTrajectory = 'stable';

    if (surveys.length >= 2) {
      const recentCount = surveys[surveys.length - 1].count;
      const previousCount = surveys[surveys.length - 2].count;
      if (recentCount > previousCount * 1.2) countTrajectory = 'up';
      else if (recentCount < previousCount * 0.8) countTrajectory = 'down';
    }

    res.json({
      success: true,
      hasData: deficiencies.length > 0,
      facility: {
        id: facility.id,
        name: facility.name,
        ccn: facility.ccn,
        state: facilityState
      },
      deficiencyCount: surveys.map(s => ({
        date: s.date,
        count: s.count,
        type: s.type
      })),
      severityDistribution: surveys.map(s => ({
        date: s.date,
        ...s.severities
      })),
      stateAverages: stateAvgResult.rows.map(r => ({
        year: parseInt(r.year),
        avgDeficiencies: Math.round(parseFloat(r.avg_deficiencies) * 10) / 10
      })),
      trajectory: {
        count: countTrajectory,
        severity: severityTrajectory,
        repeatRate: worsening.length + persistent.length > 0
          ? Math.round(((worsening.length + persistent.length) / Object.keys(tagMap).length) * 100)
          : 0
      },
      tagTrends: {
        worsening: worsening.sort((a, b) => b.citationCount - a.citationCount),
        persistent: persistent.sort((a, b) => b.citationCount - a.citationCount),
        improving: improving.sort((a, b) => b.citationCount - a.citationCount),
        resolved: resolved.sort((a, b) => b.citationCount - a.citationCount),
        new: newTags
      },
      summary: {
        totalSurveys: surveys.length,
        totalDeficiencies: deficiencies.length,
        uniqueTags: Object.keys(tagMap).length,
        worseningCount: worsening.length,
        persistentCount: persistent.length,
        improvingCount: improving.length,
        resolvedCount: resolved.length,
        newCount: newTags.length
      }
    });

  } catch (error) {
    console.error('[Survey Intel] Error getting trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/survey-intel/facility/:facilityId/heatmap
 *
 * Get all-tags heatmap showing every deficiency over time
 * Visual grid for tag persistence analysis
 */
router.get('/facility/:facilityId/heatmap', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;

    const facility = await getFacilityWithCCN(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    if (!facility.ccn) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Facility not linked to CMS data (no CCN)'
      });
    }

    const pool = getMarketPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Market database not available' });
    }

    // Get facility's state from snf_facilities
    const facilityInfoResult = await pool.query(`
      SELECT state FROM snf_facilities WHERE federal_provider_number = $1 LIMIT 1
    `, [facility.ccn]);
    const facilityState = facilityInfoResult.rows[0]?.state || facility.state;

    // Get all health deficiencies
    const healthResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity,
        deficiency_text
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND survey_date >= NOW() - INTERVAL '3 years'
      ORDER BY survey_date DESC
    `, [facility.ccn]);

    // Get fire safety deficiencies
    const fireResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity_code as scope_severity,
        deficiency_description as deficiency_text,
        deficiency_prefix
      FROM fire_safety_citations
      WHERE ccn = $1
        AND survey_date >= NOW() - INTERVAL '3 years'
      ORDER BY survey_date DESC
    `, [facility.ccn]);

    // Combine and organize by survey
    const surveyMap = new Map();

    // Process health deficiencies
    healthResult.rows.forEach(d => {
      const dateKey = d.survey_date.toISOString().split('T')[0];
      if (!surveyMap.has(dateKey)) {
        surveyMap.set(dateKey, {
          date: dateKey,
          type: d.survey_type,
          category: 'health',
          deficiencyCount: 0
        });
      }
      surveyMap.get(dateKey).deficiencyCount++;
    });

    // Process fire safety deficiencies
    fireResult.rows.forEach(d => {
      const dateKey = d.survey_date.toISOString().split('T')[0];
      const existingSurvey = surveyMap.get(dateKey);
      if (!existingSurvey) {
        surveyMap.set(dateKey, {
          date: dateKey,
          type: d.survey_type,
          category: 'fire_safety',
          deficiencyCount: 1
        });
      } else if (existingSurvey.category === 'health') {
        // Keep as health but increment count
        existingSurvey.deficiencyCount++;
      }
    });

    const surveys = Array.from(surveyMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Build tag matrix
    const tagMap = new Map();

    // Process health deficiencies
    healthResult.rows.forEach(d => {
      if (!tagMap.has(d.deficiency_tag)) {
        tagMap.set(d.deficiency_tag, {
          tag: d.deficiency_tag,
          category: 'health',
          system: TAG_TO_SYSTEM[d.deficiency_tag] || null,
          systemName: TAG_TO_SYSTEM[d.deficiency_tag] ? SYSTEM_NAMES[TAG_TO_SYSTEM[d.deficiency_tag]] : 'Other',
          citations: []
        });
      }
      tagMap.get(d.deficiency_tag).citations.push({
        surveyDate: d.survey_date.toISOString().split('T')[0],
        severity: getSeverityLevel(d.scope_severity),
        text: d.deficiency_text?.substring(0, 200)
      });
    });

    // Process fire safety deficiencies
    fireResult.rows.forEach(d => {
      if (!tagMap.has(d.deficiency_tag)) {
        tagMap.set(d.deficiency_tag, {
          tag: d.deficiency_tag,
          category: d.deficiency_prefix === 'K' ? 'life_safety' : 'emergency_prep',
          system: null,
          systemName: d.deficiency_prefix === 'K' ? 'Life Safety Code' : 'Emergency Preparedness',
          citations: []
        });
      }
      tagMap.get(d.deficiency_tag).citations.push({
        surveyDate: d.survey_date.toISOString().split('T')[0],
        severity: getSeverityLevel(d.scope_severity),
        text: d.deficiency_text?.substring(0, 200)
      });
    });

    // Determine trend for each tag
    const lastSurveyDate = surveys.length > 0 ? surveys[surveys.length - 1].date : null;

    const tags = Array.from(tagMap.values()).map(tag => {
      const citationDates = tag.citations.map(c => c.surveyDate);
      const isInLastSurvey = lastSurveyDate && citationDates.includes(lastSurveyDate);

      let trend = 'new';
      if (tag.citations.length > 1) {
        const sorted = [...tag.citations].sort((a, b) =>
          new Date(b.surveyDate) - new Date(a.surveyDate)
        );
        const latestSev = SEVERITY_SCORES[sorted[0].severity] || 0;
        const prevSev = SEVERITY_SCORES[sorted[1].severity] || 0;

        if (!isInLastSurvey) trend = 'resolved';
        else if (latestSev > prevSev) trend = 'worsening';
        else if (latestSev < prevSev) trend = 'improving';
        else trend = 'persistent';
      } else if (!isInLastSurvey) {
        trend = 'resolved';
      }

      return {
        ...tag,
        trend,
        citationCount: tag.citations.length,
        lastCitation: tag.citations.length > 0
          ? tag.citations.sort((a, b) => new Date(b.surveyDate) - new Date(a.surveyDate))[0]
          : null
      };
    });

    // Sort tags: F-tags first (by system), then K-tags, then E-tags
    tags.sort((a, b) => {
      if (a.category === 'health' && b.category !== 'health') return -1;
      if (a.category !== 'health' && b.category === 'health') return 1;
      if (a.category === 'life_safety' && b.category === 'emergency_prep') return -1;
      if (a.category === 'emergency_prep' && b.category === 'life_safety') return 1;
      return a.tag.localeCompare(b.tag);
    });

    res.json({
      success: true,
      hasData: tags.length > 0,
      facility: {
        id: facility.id,
        name: facility.name,
        ccn: facility.ccn,
        state: facilityState
      },
      surveys,
      tags,
      summary: {
        totalTags: tags.length,
        healthTags: tags.filter(t => t.category === 'health').length,
        lifeSafetyTags: tags.filter(t => t.category === 'life_safety').length,
        emergencyPrepTags: tags.filter(t => t.category === 'emergency_prep').length,
        worseningTags: tags.filter(t => t.trend === 'worsening').length,
        persistentTags: tags.filter(t => t.trend === 'persistent').length,
        improvingTags: tags.filter(t => t.trend === 'improving').length,
        resolvedTags: tags.filter(t => t.trend === 'resolved').length,
        newTags: tags.filter(t => t.trend === 'new').length
      },
      legend: {
        severities: [
          { code: 'B', label: 'No harm - potential for minimal harm', color: '#E3F2FD' },
          { code: 'C', label: 'No harm - potential for more than minimal harm', color: '#BBDEFB' },
          { code: 'D', label: 'Potential for more than minimal harm', color: '#90CAF9' },
          { code: 'E', label: 'Actual harm - isolated', color: '#FFF9C4' },
          { code: 'F', label: 'Actual harm - pattern', color: '#FFE082' },
          { code: 'G', label: 'Actual harm - widespread', color: '#FFCC80' },
          { code: 'H', label: 'Immediate jeopardy - isolated', color: '#FFCDD2' },
          { code: 'I', label: 'Immediate jeopardy - pattern', color: '#EF9A9A' },
          { code: 'J', label: 'Immediate jeopardy - widespread', color: '#E57373' },
          { code: 'K', label: 'IJ + Substandard QoC', color: '#EF5350' },
          { code: 'L', label: 'IJ + Substandard QoC', color: '#E53935' }
        ],
        trends: [
          { code: 'worsening', label: 'Severity increased', color: '#EF5350' },
          { code: 'persistent', label: 'Same severity across surveys', color: '#FFA726' },
          { code: 'improving', label: 'Severity decreased', color: '#66BB6A' },
          { code: 'resolved', label: 'Not in most recent survey', color: '#4CAF50' },
          { code: 'new', label: 'First-time citation', color: '#42A5F5' }
        ]
      }
    });

  } catch (error) {
    console.error('[Survey Intel] Error getting heatmap:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/survey-intel/facility/:facilityId/by-survey-type
 *
 * Get deficiencies grouped by survey type:
 * - Standard Health Surveys (annual recertification)
 * - Complaint Surveys (investigations)
 * - Fire Safety Surveys (K-tags, E-tags)
 * - Infection Control Surveys (focused IC)
 */
router.get('/facility/:facilityId/by-survey-type', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;

    const facility = await getFacilityWithCCN(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    if (!facility.ccn) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Facility not linked to CMS data (no CCN)'
      });
    }

    const pool = getMarketPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Market database not available' });
    }

    // Get facility's state from snf_facilities
    const facilityInfoResult = await pool.query(`
      SELECT state FROM snf_facilities WHERE federal_provider_number = $1 LIMIT 1
    `, [facility.ccn]);
    const facilityState = facilityInfoResult.rows[0]?.state || facility.state;

    // Get all health deficiencies with survey type
    const healthResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity,
        deficiency_text,
        is_standard_deficiency,
        is_complaint_deficiency,
        is_infection_control
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND survey_date >= NOW() - INTERVAL '3 years'
      ORDER BY survey_date DESC
    `, [facility.ccn]);

    // Get fire safety deficiencies
    const fireResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity_code as scope_severity,
        deficiency_description as deficiency_text,
        deficiency_prefix
      FROM fire_safety_citations
      WHERE ccn = $1
        AND survey_date >= NOW() - INTERVAL '3 years'
      ORDER BY survey_date DESC
    `, [facility.ccn]);

    // Get facility sprinkler status
    const sprinklerResult = await pool.query(`
      SELECT has_sprinkler_system FROM snf_facilities WHERE federal_provider_number = $1
    `, [facility.ccn]);
    const sprinklerStatus = sprinklerResult.rows[0]?.has_sprinkler_system ? 'Yes' : 'No';

    // Get state averages for standard surveys
    const stateAvgResult = await pool.query(`
      SELECT
        COUNT(*)::float / NULLIF(COUNT(DISTINCT d.federal_provider_number), 0) as avg_deficiencies_per_facility
      FROM cms_facility_deficiencies d
      JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
      WHERE f.state = $1
        AND d.survey_date >= NOW() - INTERVAL '3 years'
        AND (d.is_standard_deficiency = true OR d.survey_type ILIKE '%standard%' OR d.survey_type ILIKE '%health%')
    `, [facilityState]);
    const stateAvgDeficiencies = Math.round(parseFloat(stateAvgResult.rows[0]?.avg_deficiencies_per_facility) * 10) / 10 || 0;

    // Categorize health deficiencies by survey type
    const standardSurveys = new Map();
    const complaintSurveys = new Map();
    const infectionControlSurveys = new Map();

    healthResult.rows.forEach(d => {
      const dateKey = d.survey_date.toISOString().split('T')[0];
      const surveyType = d.survey_type?.toLowerCase() || '';

      // Determine survey category
      let category = 'standard';
      if (d.is_complaint_deficiency || surveyType.includes('complaint')) {
        category = 'complaint';
      } else if (d.is_infection_control || surveyType.includes('infection') || surveyType.includes('covid')) {
        category = 'infection_control';
      } else if (d.is_standard_deficiency || surveyType.includes('standard') || surveyType.includes('health') || surveyType.includes('recert')) {
        category = 'standard';
      }

      // Get the appropriate map
      const surveyMap = category === 'complaint' ? complaintSurveys
        : category === 'infection_control' ? infectionControlSurveys
        : standardSurveys;

      if (!surveyMap.has(dateKey)) {
        surveyMap.set(dateKey, {
          date: dateKey,
          type: d.survey_type,
          deficiencies: [],
          maxSeverity: null
        });
      }

      const survey = surveyMap.get(dateKey);
      survey.deficiencies.push({
        tag: d.deficiency_tag,
        severity: getSeverityLevel(d.scope_severity),
        text: d.deficiency_text?.substring(0, 150),
        system: TAG_TO_SYSTEM[d.deficiency_tag] || null,
        systemName: TAG_TO_SYSTEM[d.deficiency_tag] ? SYSTEM_NAMES[TAG_TO_SYSTEM[d.deficiency_tag]] : 'Other'
      });

      const severity = getSeverityLevel(d.scope_severity);
      if (!survey.maxSeverity || (SEVERITY_SCORES[severity] || 0) > (SEVERITY_SCORES[survey.maxSeverity] || 0)) {
        survey.maxSeverity = severity;
      }
    });

    // Categorize fire safety deficiencies
    const fireSafetySurveys = new Map();
    let lifeSafetyCount = 0;
    let emergencyPrepCount = 0;

    fireResult.rows.forEach(d => {
      const dateKey = d.survey_date.toISOString().split('T')[0];

      if (!fireSafetySurveys.has(dateKey)) {
        fireSafetySurveys.set(dateKey, {
          date: dateKey,
          type: d.survey_type || 'Fire Safety',
          deficiencies: [],
          maxSeverity: null,
          lifeSafetyCount: 0,
          emergencyPrepCount: 0
        });
      }

      const survey = fireSafetySurveys.get(dateKey);
      const isLifeSafety = d.deficiency_prefix === 'K';

      survey.deficiencies.push({
        tag: d.deficiency_tag,
        severity: getSeverityLevel(d.scope_severity),
        text: d.deficiency_text?.substring(0, 150),
        category: isLifeSafety ? 'life_safety' : 'emergency_prep',
        categoryLabel: isLifeSafety ? 'Life Safety Code' : 'Emergency Preparedness'
      });

      if (isLifeSafety) {
        survey.lifeSafetyCount++;
        lifeSafetyCount++;
      } else {
        survey.emergencyPrepCount++;
        emergencyPrepCount++;
      }

      const severity = getSeverityLevel(d.scope_severity);
      if (!survey.maxSeverity || (SEVERITY_SCORES[severity] || 0) > (SEVERITY_SCORES[survey.maxSeverity] || 0)) {
        survey.maxSeverity = severity;
      }
    });

    // Helper function to process survey type data
    const processSurveyType = (surveyMap, categoryName) => {
      const surveys = Array.from(surveyMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
      const totalDeficiencies = surveys.reduce((sum, s) => sum + s.deficiencies.length, 0);

      // Get top tags
      const tagCounts = {};
      surveys.forEach(s => {
        s.deficiencies.forEach(d => {
          tagCounts[d.tag] = (tagCounts[d.tag] || 0) + 1;
        });
      });
      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({
          tag,
          count,
          system: TAG_TO_SYSTEM[tag] || null,
          systemName: TAG_TO_SYSTEM[tag] ? SYSTEM_NAMES[TAG_TO_SYSTEM[tag]] : 'Other'
        }));

      return {
        category: categoryName,
        surveyCount: surveys.length,
        totalDeficiencies,
        avgDeficienciesPerSurvey: surveys.length > 0 ? Math.round((totalDeficiencies / surveys.length) * 10) / 10 : 0,
        topTags,
        surveys: surveys.map(s => ({
          date: s.date,
          type: s.type,
          deficiencyCount: s.deficiencies.length,
          maxSeverity: s.maxSeverity,
          deficiencies: s.deficiencies.slice(0, 5) // Top 5 for display
        }))
      };
    };

    // Check if F880 is in infection control surveys (for the "contributes to F880 pattern" note)
    const f880InHealthSurveys = healthResult.rows.filter(d => d.deficiency_tag === 'F880').length;

    // Build response
    const standardData = processSurveyType(standardSurveys, 'standard');
    const complaintData = processSurveyType(complaintSurveys, 'complaint');
    const infectionControlData = processSurveyType(infectionControlSurveys, 'infection_control');
    const fireSafetyData = processSurveyType(fireSafetySurveys, 'fire_safety');

    // Add specific context for fire safety
    fireSafetyData.lifeSafetyCount = lifeSafetyCount;
    fireSafetyData.emergencyPrepCount = emergencyPrepCount;
    fireSafetyData.sprinklerStatus = sprinklerStatus;

    // Add state comparison for standard surveys
    standardData.stateAverage = stateAvgDeficiencies;
    standardData.vsStateAverage = standardData.totalDeficiencies - stateAvgDeficiencies;

    // Add context for infection control
    if (infectionControlData.surveyCount > 0 && f880InHealthSurveys > 0) {
      infectionControlData.f880Note = `F880 (Infection Control) has been cited ${f880InHealthSurveys} times across all surveys`;
    }

    res.json({
      success: true,
      hasData: healthResult.rows.length > 0 || fireResult.rows.length > 0,
      facility: {
        id: facility.id,
        name: facility.name,
        ccn: facility.ccn,
        state: facilityState
      },
      surveyTypes: {
        standard: standardData,
        complaint: complaintData,
        infectionControl: infectionControlData,
        fireSafety: fireSafetyData
      },
      summary: {
        totalSurveys: standardData.surveyCount + complaintData.surveyCount +
                      infectionControlData.surveyCount + fireSafetyData.surveyCount,
        totalDeficiencies: standardData.totalDeficiencies + complaintData.totalDeficiencies +
                          infectionControlData.totalDeficiencies + fireSafetyData.totalDeficiencies
      }
    });

  } catch (error) {
    console.error('[Survey Intel] Error getting survey type breakdown:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/survey-intel/facility/:facilityId/timeline
 *
 * Get chronological survey history with narrative annotations
 * Includes pattern detection for repeat tags and severity changes
 */
router.get('/facility/:facilityId/timeline', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;

    const facility = await getFacilityWithCCN(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    if (!facility.ccn) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Facility not linked to CMS data (no CCN)'
      });
    }

    const pool = getMarketPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Market database not available' });
    }

    // Get facility's state from snf_facilities
    const facilityInfoResult = await pool.query(`
      SELECT state FROM snf_facilities WHERE federal_provider_number = $1 LIMIT 1
    `, [facility.ccn]);
    const facilityState = facilityInfoResult.rows[0]?.state || facility.state;

    // Get state average deficiencies per survey for comparison
    const stateAvgResult = await pool.query(`
      WITH survey_counts AS (
        SELECT
          d.federal_provider_number,
          d.survey_date,
          COUNT(*) as deficiency_count
        FROM cms_facility_deficiencies d
        JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
        WHERE f.state = $1
          AND d.survey_date >= NOW() - INTERVAL '3 years'
        GROUP BY d.federal_provider_number, d.survey_date
      )
      SELECT AVG(deficiency_count) as avg_per_survey FROM survey_counts
    `, [facilityState]);
    const stateAvgPerSurvey = Math.round(parseFloat(stateAvgResult.rows[0]?.avg_per_survey) * 10) / 10 || 0;

    // Get all health deficiencies
    const healthResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity,
        deficiency_text
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND survey_date >= NOW() - INTERVAL '5 years'
      ORDER BY survey_date ASC
    `, [facility.ccn]);

    // Get fire safety deficiencies
    const fireResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity_code as scope_severity,
        deficiency_description as deficiency_text,
        deficiency_prefix
      FROM fire_safety_citations
      WHERE ccn = $1
        AND survey_date >= NOW() - INTERVAL '5 years'
      ORDER BY survey_date ASC
    `, [facility.ccn]);

    // Track tag history for pattern detection
    const tagHistory = new Map(); // tag -> array of {date, severity}

    // Group deficiencies by survey
    const surveyMap = new Map();

    // Process health deficiencies
    healthResult.rows.forEach(d => {
      const dateKey = d.survey_date.toISOString().split('T')[0];

      if (!surveyMap.has(dateKey)) {
        surveyMap.set(dateKey, {
          date: dateKey,
          type: d.survey_type,
          category: 'health',
          deficiencies: [],
          maxSeverity: null,
          hasIJ: false
        });
      }

      const survey = surveyMap.get(dateKey);
      const severity = getSeverityLevel(d.scope_severity);

      // Track tag history
      if (!tagHistory.has(d.deficiency_tag)) {
        tagHistory.set(d.deficiency_tag, []);
      }
      tagHistory.get(d.deficiency_tag).push({
        date: dateKey,
        severity
      });

      // Check if this is a repeat
      const priorCitations = tagHistory.get(d.deficiency_tag).filter(c => c.date < dateKey);
      const isRepeat = priorCitations.length > 0;
      const previousSeverity = isRepeat ? priorCitations[priorCitations.length - 1].severity : null;

      survey.deficiencies.push({
        tag: d.deficiency_tag,
        severity,
        text: d.deficiency_text?.substring(0, 200),
        system: TAG_TO_SYSTEM[d.deficiency_tag] || null,
        systemName: TAG_TO_SYSTEM[d.deficiency_tag] ? SYSTEM_NAMES[TAG_TO_SYSTEM[d.deficiency_tag]] : 'Other',
        isRepeat,
        previousSeverity,
        severityChange: isRepeat && previousSeverity ?
          (SEVERITY_SCORES[severity] > SEVERITY_SCORES[previousSeverity] ? 'worsened' :
           SEVERITY_SCORES[severity] < SEVERITY_SCORES[previousSeverity] ? 'improved' : 'same') : null
      });

      // Track max severity and IJ
      if (!survey.maxSeverity || (SEVERITY_SCORES[severity] || 0) > (SEVERITY_SCORES[survey.maxSeverity] || 0)) {
        survey.maxSeverity = severity;
      }
      if (['H', 'I', 'J', 'K', 'L'].includes(severity)) {
        survey.hasIJ = true;
      }
    });

    // Process fire safety deficiencies
    fireResult.rows.forEach(d => {
      const dateKey = d.survey_date.toISOString().split('T')[0];

      if (!surveyMap.has(dateKey)) {
        surveyMap.set(dateKey, {
          date: dateKey,
          type: d.survey_type || 'Fire Safety',
          category: 'fire_safety',
          deficiencies: [],
          maxSeverity: null,
          hasIJ: false
        });
      }

      const survey = surveyMap.get(dateKey);
      const severity = getSeverityLevel(d.scope_severity);

      survey.deficiencies.push({
        tag: d.deficiency_tag,
        severity,
        text: d.deficiency_text?.substring(0, 200),
        category: d.deficiency_prefix === 'K' ? 'life_safety' : 'emergency_prep',
        isRepeat: false // Simplified for fire safety
      });

      if (!survey.maxSeverity || (SEVERITY_SCORES[severity] || 0) > (SEVERITY_SCORES[survey.maxSeverity] || 0)) {
        survey.maxSeverity = severity;
      }
    });

    // Convert to array and sort chronologically
    const surveys = Array.from(surveyMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(survey => {
        // Add comparison to state average
        const vsStateAvg = survey.deficiencies.length - stateAvgPerSurvey;

        // Sort deficiencies by severity (worst first), then by repeat status
        survey.deficiencies.sort((a, b) => {
          if (a.isRepeat && !b.isRepeat) return -1;
          if (!a.isRepeat && b.isRepeat) return 1;
          return (SEVERITY_SCORES[b.severity] || 0) - (SEVERITY_SCORES[a.severity] || 0);
        });

        return {
          ...survey,
          deficiencyCount: survey.deficiencies.length,
          vsStateAverage: Math.round(vsStateAvg * 10) / 10,
          repeatCount: survey.deficiencies.filter(d => d.isRepeat).length,
          topDeficiencies: survey.deficiencies.slice(0, 3)
        };
      });

    // Generate pattern summaries for frequently repeated tags
    const patterns = [];
    tagHistory.forEach((citations, tag) => {
      if (citations.length >= 2) {
        const severities = citations.map(c => c.severity);
        const dates = citations.map(c => c.date);

        // Check for severity progression
        let pattern = null;
        if (citations.length >= 3) {
          const increasing = severities.every((s, i) =>
            i === 0 || (SEVERITY_SCORES[s] || 0) >= (SEVERITY_SCORES[severities[i-1]] || 0)
          );
          const decreasing = severities.every((s, i) =>
            i === 0 || (SEVERITY_SCORES[s] || 0) <= (SEVERITY_SCORES[severities[i-1]] || 0)
          );

          if (increasing && (SEVERITY_SCORES[severities[severities.length-1]] || 0) > (SEVERITY_SCORES[severities[0]] || 0)) {
            pattern = 'increasing';
          } else if (decreasing && (SEVERITY_SCORES[severities[severities.length-1]] || 0) < (SEVERITY_SCORES[severities[0]] || 0)) {
            pattern = 'decreasing';
          } else {
            pattern = 'persistent';
          }
        } else {
          pattern = 'repeat';
        }

        patterns.push({
          tag,
          system: TAG_TO_SYSTEM[tag] || null,
          systemName: TAG_TO_SYSTEM[tag] ? SYSTEM_NAMES[TAG_TO_SYSTEM[tag]] : 'Other',
          citationCount: citations.length,
          severityProgression: severities.join(' → '),
          pattern,
          narrative: generatePatternNarrative(tag, citations, pattern)
        });
      }
    });

    // Sort patterns by citation count
    patterns.sort((a, b) => b.citationCount - a.citationCount);

    res.json({
      success: true,
      hasData: surveys.length > 0,
      facility: {
        id: facility.id,
        name: facility.name,
        ccn: facility.ccn,
        state: facilityState
      },
      stateAvgPerSurvey,
      surveys,
      patterns: patterns.slice(0, 10), // Top 10 patterns
      summary: {
        totalSurveys: surveys.length,
        totalDeficiencies: surveys.reduce((sum, s) => sum + s.deficiencyCount, 0),
        ijSurveys: surveys.filter(s => s.hasIJ).length,
        yearsSpanned: surveys.length > 0 ?
          Math.ceil((new Date(surveys[surveys.length-1].date) - new Date(surveys[0].date)) / (365.25 * 24 * 60 * 60 * 1000)) : 0
      }
    });

  } catch (error) {
    console.error('[Survey Intel] Error getting timeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/survey-intel/facility/:facilityId/system-risk
 *
 * Get clinical systems breakdown showing CMS risk per internal audit system
 * Maps F-tags to the 7 internal clinical audit systems with scorecard gaps
 */
router.get('/facility/:facilityId/system-risk', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;

    const facility = await getFacilityWithCCN(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    if (!facility.ccn) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Facility not linked to CMS data (no CCN)'
      });
    }

    const pool = getMarketPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Market database not available' });
    }

    // Get facility's state from snf_facilities
    const facilityInfoResult = await pool.query(`
      SELECT state FROM snf_facilities WHERE federal_provider_number = $1 LIMIT 1
    `, [facility.ccn]);
    const facilityState = facilityInfoResult.rows[0]?.state || facility.state;

    // Get all health deficiencies mapped to systems
    const deficienciesResult = await pool.query(`
      SELECT
        survey_date,
        deficiency_tag,
        scope_severity
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND survey_date >= NOW() - INTERVAL '3 years'
      ORDER BY survey_date DESC
    `, [facility.ccn]);

    // Get the latest scorecard for this facility
    const latestScorecard = await Scorecard.findOne({
      where: { facilityId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: ScorecardSystem,
        as: 'systems'
      }]
    });

    // Build scorecard lookup by system ID
    const scorecardBySystem = {};
    if (latestScorecard?.systems) {
      latestScorecard.systems.forEach(sys => {
        scorecardBySystem[sys.systemId] = {
          score: sys.score,
          percentage: sys.percentage
        };
      });
    }

    // Initialize system risk data
    const systemRisk = {};
    Object.keys(SYSTEM_NAMES).forEach(systemId => {
      systemRisk[systemId] = {
        systemId: parseInt(systemId),
        systemName: SYSTEM_NAMES[systemId],
        fTags: [],
        tagCounts: {},
        citations: [],
        totalCitations: 0,
        maxSeverity: null,
        riskLevel: 'low',
        scorecardScore: scorecardBySystem[systemId]?.percentage || null,
        gap: null,
        latestCitation: null
      };
    });

    // Also track "Other" for unmapped tags
    systemRisk['other'] = {
      systemId: null,
      systemName: 'Other',
      fTags: [],
      tagCounts: {},
      citations: [],
      totalCitations: 0,
      maxSeverity: null,
      riskLevel: 'low',
      scorecardScore: null,
      gap: null,
      latestCitation: null
    };

    // Process deficiencies
    deficienciesResult.rows.forEach(d => {
      const systemId = TAG_TO_SYSTEM[d.deficiency_tag] || 'other';
      const system = systemRisk[systemId];
      const severity = getSeverityLevel(d.scope_severity);

      // Track tag counts
      if (!system.tagCounts[d.deficiency_tag]) {
        system.tagCounts[d.deficiency_tag] = 0;
        system.fTags.push(d.deficiency_tag);
      }
      system.tagCounts[d.deficiency_tag]++;
      system.totalCitations++;

      // Track citations
      system.citations.push({
        tag: d.deficiency_tag,
        date: d.survey_date,
        severity
      });

      // Track max severity
      if (!system.maxSeverity || (SEVERITY_SCORES[severity] || 0) > (SEVERITY_SCORES[system.maxSeverity] || 0)) {
        system.maxSeverity = severity;
      }

      // Track latest citation date
      if (!system.latestCitation || new Date(d.survey_date) > new Date(system.latestCitation)) {
        system.latestCitation = d.survey_date;
      }
    });

    // Calculate risk level and gap for each system
    const THRESHOLD = 85; // 85% threshold for "good" scorecard score

    Object.values(systemRisk).forEach(system => {
      // Calculate CMS risk level based on citations and severity
      if (system.totalCitations === 0) {
        system.riskLevel = 'low';
      } else if (system.maxSeverity && ['H', 'I', 'J', 'K', 'L'].includes(system.maxSeverity)) {
        system.riskLevel = 'high';
      } else if (system.totalCitations >= 3 || ['E', 'F', 'G'].includes(system.maxSeverity)) {
        system.riskLevel = 'moderate';
      } else {
        system.riskLevel = 'low';
      }

      // Calculate gap vs 85% threshold
      if (system.scorecardScore !== null) {
        system.gap = Math.round((system.scorecardScore - THRESHOLD) * 10) / 10;
      }

      // Sort F-tags by count
      system.fTags.sort((a, b) => system.tagCounts[b] - system.tagCounts[a]);
    });

    // Convert to array and sort by risk level (high first), then by citation count
    const riskOrder = { 'high': 0, 'moderate': 1, 'low': 2 };
    const systems = Object.values(systemRisk)
      .filter(s => s.systemId !== null) // Exclude "Other" from main list
      .sort((a, b) => {
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        return b.totalCitations - a.totalCitations;
      })
      .map(system => ({
        systemId: system.systemId,
        systemName: system.systemName,
        cmsRisk: system.riskLevel,
        maxSeverity: system.maxSeverity,
        totalCitations: system.totalCitations,
        fTags: system.fTags.slice(0, 5).map(tag => ({
          tag,
          count: system.tagCounts[tag]
        })),
        scorecardScore: system.scorecardScore,
        gap: system.gap,
        gapStatus: system.gap === null ? null :
          system.gap >= 0 ? 'above' : 'below',
        latestCitation: system.latestCitation
      }));

    // Build summary
    const highRiskSystems = systems.filter(s => s.cmsRisk === 'high');
    const systemsNeedingAttention = systems.filter(s =>
      s.cmsRisk !== 'low' && s.gap !== null && s.gap < 0
    );

    res.json({
      success: true,
      hasData: deficienciesResult.rows.length > 0,
      facility: {
        id: facility.id,
        name: facility.name,
        ccn: facility.ccn,
        state: facilityState
      },
      systems,
      otherTags: systemRisk['other'].totalCitations > 0 ? {
        totalCitations: systemRisk['other'].totalCitations,
        fTags: systemRisk['other'].fTags.slice(0, 5).map(tag => ({
          tag,
          count: systemRisk['other'].tagCounts[tag]
        }))
      } : null,
      threshold: THRESHOLD,
      scorecardDate: latestScorecard?.createdAt || null,
      summary: {
        totalSystems: 7,
        highRiskCount: highRiskSystems.length,
        highRiskSystems: highRiskSystems.map(s => s.systemName),
        systemsNeedingAttention: systemsNeedingAttention.map(s => ({
          name: s.systemName,
          cmsRisk: s.cmsRisk,
          scorecardScore: s.scorecardScore,
          gap: s.gap
        }))
      }
    });

  } catch (error) {
    console.error('[Survey Intel] Error getting system risk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/survey-intel/facility/:facilityId/market-context
 *
 * Get state-level market context showing trending tags and emerging risks
 * Compares facility history against state trends
 */
router.get('/facility/:facilityId/market-context', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;

    const facility = await getFacilityWithCCN(facilityId);
    if (!facility) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    if (!facility.ccn) {
      return res.json({
        success: true,
        hasData: false,
        message: 'Facility not linked to CMS data (no CCN)'
      });
    }

    const pool = getMarketPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Market database not available' });
    }

    // Get facility's state from snf_facilities
    const facilityInfoResult = await pool.query(`
      SELECT state FROM snf_facilities WHERE federal_provider_number = $1 LIMIT 1
    `, [facility.ccn]);
    const facilityState = facilityInfoResult.rows[0]?.state || facility.state;

    // Get facility's tag history (3 years)
    const facilityTagsResult = await pool.query(`
      SELECT DISTINCT deficiency_tag
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND survey_date >= NOW() - INTERVAL '3 years'
    `, [facility.ccn]);
    const facilityTags = new Set(facilityTagsResult.rows.map(r => r.deficiency_tag));

    // Get state trends - compare last 6 months vs prior 6 months
    const stateTrendsResult = await pool.query(`
      WITH recent AS (
        SELECT
          d.deficiency_tag,
          COUNT(*) as recent_count,
          COUNT(DISTINCT d.federal_provider_number) as recent_facilities
        FROM cms_facility_deficiencies d
        JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
        WHERE f.state = $1
          AND d.survey_date >= NOW() - INTERVAL '6 months'
        GROUP BY d.deficiency_tag
      ),
      prior AS (
        SELECT
          d.deficiency_tag,
          COUNT(*) as prior_count,
          COUNT(DISTINCT d.federal_provider_number) as prior_facilities
        FROM cms_facility_deficiencies d
        JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
        WHERE f.state = $1
          AND d.survey_date >= NOW() - INTERVAL '12 months'
          AND d.survey_date < NOW() - INTERVAL '6 months'
        GROUP BY d.deficiency_tag
      ),
      total_facilities AS (
        SELECT COUNT(DISTINCT federal_provider_number) as total
        FROM snf_facilities
        WHERE state = $1
      )
      SELECT
        COALESCE(r.deficiency_tag, p.deficiency_tag) as tag,
        COALESCE(r.recent_count, 0) as recent_count,
        COALESCE(p.prior_count, 0) as prior_count,
        COALESCE(r.recent_facilities, 0) as recent_facilities,
        tf.total as total_facilities,
        CASE
          WHEN COALESCE(p.prior_count, 0) = 0 AND COALESCE(r.recent_count, 0) > 0 THEN 100
          WHEN COALESCE(p.prior_count, 0) > 0 THEN
            ROUND(((COALESCE(r.recent_count, 0)::float - p.prior_count) / p.prior_count * 100)::numeric, 1)
          ELSE 0
        END as yoy_change
      FROM recent r
      FULL OUTER JOIN prior p ON r.deficiency_tag = p.deficiency_tag
      CROSS JOIN total_facilities tf
      WHERE COALESCE(r.recent_count, 0) > 0 OR COALESCE(p.prior_count, 0) > 5
      ORDER BY recent_count DESC NULLS LAST
      LIMIT 50
    `, [facilityState]);

    // Separate into: Tags in your history that are trending vs Emerging risks (not in your history)
    const yourTrendingTags = [];
    const emergingRisks = [];

    stateTrendsResult.rows.forEach(row => {
      const tagData = {
        tag: row.tag,
        system: TAG_TO_SYSTEM[row.tag] || null,
        systemName: TAG_TO_SYSTEM[row.tag] ? SYSTEM_NAMES[TAG_TO_SYSTEM[row.tag]] : 'Other',
        recentCount: parseInt(row.recent_count),
        priorCount: parseInt(row.prior_count),
        yoyChange: parseFloat(row.yoy_change) || 0,
        recentFacilities: parseInt(row.recent_facilities),
        totalFacilities: parseInt(row.total_facilities),
        percentOfFacilities: Math.round((parseInt(row.recent_facilities) / parseInt(row.total_facilities)) * 100)
      };

      if (facilityTags.has(row.tag)) {
        yourTrendingTags.push(tagData);
      } else if (tagData.yoyChange > 20 || tagData.recentCount >= 10) {
        // Emerging risk: significant YoY increase or high volume, not in your history
        emergingRisks.push(tagData);
      }
    });

    // Sort: trending by YoY change (highest increase first), emerging by recent count
    yourTrendingTags.sort((a, b) => b.yoyChange - a.yoyChange);
    emergingRisks.sort((a, b) => b.yoyChange - a.yoyChange);

    // Get state-level summary stats
    const stateStatsResult = await pool.query(`
      WITH recent_surveys AS (
        SELECT
          d.federal_provider_number,
          COUNT(*) as deficiency_count
        FROM cms_facility_deficiencies d
        JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
        WHERE f.state = $1
          AND d.survey_date >= NOW() - INTERVAL '6 months'
        GROUP BY d.federal_provider_number
      ),
      prior_surveys AS (
        SELECT
          d.federal_provider_number,
          COUNT(*) as deficiency_count
        FROM cms_facility_deficiencies d
        JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
        WHERE f.state = $1
          AND d.survey_date >= NOW() - INTERVAL '12 months'
          AND d.survey_date < NOW() - INTERVAL '6 months'
        GROUP BY d.federal_provider_number
      )
      SELECT
        (SELECT COUNT(*) FROM snf_facilities WHERE state = $1) as total_facilities,
        (SELECT AVG(deficiency_count) FROM recent_surveys) as recent_avg,
        (SELECT AVG(deficiency_count) FROM prior_surveys) as prior_avg
    `, [facilityState]);

    const stateStats = stateStatsResult.rows[0] || {};
    const recentAvg = parseFloat(stateStats.recent_avg) || 0;
    const priorAvg = parseFloat(stateStats.prior_avg) || 0;
    const stateYoyChange = priorAvg > 0 ? Math.round(((recentAvg - priorAvg) / priorAvg) * 100) : 0;

    res.json({
      success: true,
      hasData: stateTrendsResult.rows.length > 0,
      facility: {
        id: facility.id,
        name: facility.name,
        ccn: facility.ccn,
        state: facilityState
      },
      stateStats: {
        state: facilityState,
        totalFacilities: parseInt(stateStats.total_facilities) || 0,
        recentAvgDeficiencies: Math.round(recentAvg * 10) / 10,
        priorAvgDeficiencies: Math.round(priorAvg * 10) / 10,
        yoyChange: stateYoyChange,
        trend: stateYoyChange > 5 ? 'increasing' : stateYoyChange < -5 ? 'decreasing' : 'stable'
      },
      yourTrendingTags: yourTrendingTags.slice(0, 10),
      emergingRisks: emergingRisks.slice(0, 10),
      summary: {
        yourTagsCount: yourTrendingTags.length,
        emergingRisksCount: emergingRisks.length,
        topTrendingTag: yourTrendingTags[0]?.tag || null,
        topEmergingRisk: emergingRisks[0]?.tag || null
      }
    });

  } catch (error) {
    console.error('[Survey Intel] Error getting market context:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper: Generate narrative for tag pattern
 */
function generatePatternNarrative(tag, citations, pattern) {
  const severities = citations.map(c => c.severity);
  const count = citations.length;
  const systemName = TAG_TO_SYSTEM[tag] ? SYSTEM_NAMES[TAG_TO_SYSTEM[tag]] : null;

  let narrative = `${tag}`;
  if (systemName) {
    narrative += ` (${systemName})`;
  }

  if (pattern === 'increasing') {
    narrative += ` has been cited in ${count} consecutive surveys with increasing severity (${severities.join(' → ')})`;
  } else if (pattern === 'decreasing') {
    narrative += ` shows improvement across ${count} surveys (${severities.join(' → ')})`;
  } else if (pattern === 'persistent') {
    narrative += ` has persisted across ${count} surveys at similar severity levels`;
  } else {
    narrative += ` was cited ${count} times`;
  }

  return narrative;
}

module.exports = router;
