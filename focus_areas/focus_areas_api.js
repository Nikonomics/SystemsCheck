/**
 * Focus Areas API Endpoints
 * =========================
 * Provides facility-level focus area analysis based on CMS data.
 *
 * Routes:
 *   GET /api/facilities/:id/focus-areas - Get focus areas for a facility
 *   GET /api/focus-areas/batch - Batch calculate for multiple facilities
 *   POST /api/focus-areas/recalculate - Trigger recalculation job
 */

const express = require('express');
const router = express.Router();
const { getPool } = require('../db'); // Adjust path as needed

// Clinical system definitions
const CLINICAL_SYSTEMS = {
  1: { id: 1, name: 'Change of Condition', description: 'Notification, care planning, monitoring' },
  2: { id: 2, name: 'Accidents/Falls', description: 'Fall prevention, supervision, safety' },
  3: { id: 3, name: 'Skin', description: 'Pressure injuries, wound care, skin integrity' },
  4: { id: 4, name: 'Med Management/Weight Loss', description: 'Pharmacy, medications, nutrition' },
  5: { id: 5, name: 'Infection Control', description: 'Infection prevention, COVID, vaccinations' },
  6: { id: 6, name: 'Transfer/Discharge', description: 'Discharge planning, care transitions' },
  7: { id: 7, name: 'Abuse/Grievances', description: 'Abuse prevention, resident rights' }
};

// F-tag to system mapping (inline for performance)
const FTAG_SYSTEM_MAP = {
  // System 1: Change of Condition
  '0580': 1, '0684': 1, '0685': 1, '0656': 1, '0657': 1, '0636': 1, '0637': 1,
  '0641': 1, '0655': 1, '0638': 1, '0658': 1, '0552': 1, '0698': 1, '0697': 1,
  '0699': 1, '0725': 1, '0726': 1, '0727': 1, '0730': 1, '0732': 1, '0835': 1,
  '0838': 1, '0851': 1, '0865': 1, '0867': 1, '0868': 1, '0770': 1, '0947': 1,
  // System 2: Accidents/Falls
  '0689': 2, '0688': 2, '0676': 2, '0677': 2, '0700': 2, '0584': 2, '0919': 2,
  '0921': 2, '0912': 2, '0908': 2, '0925': 2, '0791': 2, '0678': 2, '0694': 2,
  // System 3: Skin
  '0686': 3, '0687': 3, '0690': 3, '0695': 3,
  // System 4: Med Management/Weight Loss
  '0755': 4, '0756': 4, '0757': 4, '0758': 4, '0759': 4, '0760': 4, '0761': 4,
  '0692': 4, '0693': 4, '0740': 4, '0744': 4, '0554': 4, '0812': 4, '0803': 4,
  '0804': 4, '0805': 4, '0806': 4, '0809': 4, '0801': 4, '0802': 4, '0814': 4,
  // System 5: Infection Control
  '0880': 5, '0881': 5, '0882': 5, '0883': 5, '0884': 5, '0885': 5, '0886': 5,
  '0887': 5, '0888': 5,
  // System 6: Transfer/Discharge
  '0622': 6, '0623': 6, '0624': 6, '0625': 6, '0626': 6, '0627': 6, '0660': 6,
  '0661': 6, '0849': 6,
  // System 7: Abuse/Grievances
  '0600': 7, '0602': 7, '0603': 7, '0604': 7, '0605': 7, '0606': 7, '0607': 7,
  '0608': 7, '0609': 7, '0610': 7, '0585': 7, '0550': 7, '0557': 7, '0558': 7,
  '0561': 7, '0565': 7, '0577': 7, '0578': 7, '0582': 7, '0583': 7, '0842': 7,
  '0644': 7, '0645': 7, '0679': 7, '0745': 7
};

// Severity weights
const SEVERITY_WEIGHTS = {
  'J': 10, 'K': 10, 'L': 10,  // IJ
  'G': 5, 'H': 5, 'I': 5,     // Actual Harm
  'D': 2, 'E': 2, 'F': 2,     // Potential Harm
  'A': 1, 'B': 1, 'C': 1      // No Harm
};

// Scorecard alignment (system -> audit items)
const SCORECARD_ALIGNMENT = {
  1: [
    { item: 40, description: 'Vital signs notification protocol', priority: 'High' },
    { item: 41, description: 'Physician notification documentation', priority: 'High' },
    { item: 42, description: 'Care plan update timeliness', priority: 'Medium' }
  ],
  2: [
    { item: 12, description: 'Fall risk assessment documentation', priority: 'High' },
    { item: 13, description: 'Call light response time', priority: 'High' },
    { item: 14, description: 'Bed/chair alarm compliance', priority: 'Medium' },
    { item: 15, description: 'Wheelchair positioning safety', priority: 'Medium' }
  ],
  3: [
    { item: 20, description: 'Pressure ulcer risk assessment', priority: 'High' },
    { item: 21, description: 'Turning/repositioning documentation', priority: 'High' },
    { item: 22, description: 'Wound care supply availability', priority: 'Medium' }
  ],
  4: [
    { item: 30, description: 'Medication administration observation', priority: 'High' },
    { item: 31, description: 'Narcotic count accuracy', priority: 'High' },
    { item: 32, description: 'PRN medication follow-up', priority: 'Medium' },
    { item: 35, description: 'Weight monitoring compliance', priority: 'High' },
    { item: 36, description: 'Meal intake documentation', priority: 'Medium' }
  ],
  5: [
    { item: 4, description: 'Glucometer cleaning observation', priority: 'High' },
    { item: 5, description: 'Vital sign equipment cleaning', priority: 'High' },
    { item: 6, description: 'PPE compliance observation', priority: 'High' },
    { item: 8, description: 'Hand hygiene observation', priority: 'High' },
    { item: 10, description: 'Isolation precautions', priority: 'Medium' }
  ],
  6: [
    { item: 50, description: 'Discharge summary completeness', priority: 'High' },
    { item: 51, description: 'Medication reconciliation at transfer', priority: 'High' }
  ],
  7: [
    { item: 60, description: 'Grievance log review', priority: 'High' },
    { item: 61, description: 'Abuse reporting protocol compliance', priority: 'High' },
    { item: 62, description: 'Restraint reduction program review', priority: 'Medium' }
  ]
};

/**
 * GET /api/facilities/:id/focus-areas
 * Returns comprehensive focus area analysis for a facility
 */
router.get('/facilities/:id/focus-areas', async (req, res) => {
  const { id: federalProviderNumber } = req.params;
  const pool = getPool('market'); // snf_market_data connection

  try {
    // 1. Get facility info
    const facilityResult = await pool.query(`
      SELECT
        federal_provider_number,
        facility_name,
        state,
        certified_beds,
        ownership_type,
        overall_rating,
        health_inspection_rating,
        staffing_rating,
        quality_measure_rating,
        special_focus_facility,
        fine_count,
        total_fines_amount,
        total_nursing_turnover,
        rn_turnover,
        rn_staffing_hours,
        total_nurse_staffing_hours,
        weekend_total_nurse_hours,
        weekend_rn_hours,
        occupancy_rate
      FROM snf_facilities
      WHERE federal_provider_number = $1
    `, [federalProviderNumber]);

    if (facilityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const facility = facilityResult.rows[0];

    // 2. Get all deficiencies for past 3 years
    const deficienciesResult = await pool.query(`
      SELECT
        survey_date,
        deficiency_tag,
        scope_severity,
        is_standard_deficiency,
        is_complaint_deficiency,
        deficiency_text
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND survey_date >= CURRENT_DATE - INTERVAL '3 years'
      ORDER BY survey_date DESC
    `, [federalProviderNumber]);

    const deficiencies = deficienciesResult.rows;

    // 3. Calculate citation metrics
    const citationMetrics = calculateCitationMetrics(deficiencies);

    // 4. Calculate system-level scores
    const systemScores = calculateSystemScores(deficiencies, facility);

    // 5. Get peer comparison
    const peerComparison = await getPeerComparison(pool, facility, systemScores);

    // 6. Get state trends
    const stateTrends = await getStateTrends(pool, facility.state);

    // 7. Build final focus areas
    const focusAreas = buildFocusAreas(systemScores, deficiencies, peerComparison, stateTrends);

    // 8. Calculate overall risk score
    const overallRiskScore = calculateOverallRiskScore(systemScores, citationMetrics);
    const overallRiskTier = getRiskTier(overallRiskScore);

    // 9. Build key metrics summary
    const keyMetrics = buildKeyMetrics(facility, citationMetrics, deficiencies);

    // 10. Build response
    const response = {
      facility_id: facility.federal_provider_number,
      federal_provider_number: facility.federal_provider_number,
      facility_name: facility.facility_name,
      state: facility.state,
      overall_risk_score: overallRiskScore,
      overall_risk_tier: overallRiskTier,
      focus_areas: focusAreas,
      key_metrics: keyMetrics,
      calculated_at: new Date().toISOString(),
      model_version: '1.0'
    };

    res.json(response);

  } catch (error) {
    console.error('Error calculating focus areas:', error);
    res.status(500).json({ error: 'Failed to calculate focus areas', details: error.message });
  }
});

/**
 * Calculate citation pattern metrics from deficiencies
 */
function calculateCitationMetrics(deficiencies) {
  // Group by survey date
  const surveyMap = new Map();
  deficiencies.forEach(d => {
    if (d.is_standard_deficiency) {
      const dateKey = d.survey_date.toISOString().split('T')[0];
      if (!surveyMap.has(dateKey)) {
        surveyMap.set(dateKey, []);
      }
      surveyMap.get(dateKey).push(d);
    }
  });

  // Sort surveys by date descending
  const surveys = Array.from(surveyMap.entries())
    .sort((a, b) => new Date(b[0]) - new Date(a[0]));

  const currentSurvey = surveys[0] || [null, []];
  const prevSurvey = surveys[1] || [null, []];
  const prev2Survey = surveys[2] || [null, []];

  // Citation counts
  const currentCount = currentSurvey[1].length;
  const prevCount = prevSurvey[1].length;
  const prev2Count = prev2Survey[1].length;

  // Citation velocity
  let citationVelocity = 'stable';
  if (prevCount > 0) {
    if (currentCount < prevCount * 0.8) citationVelocity = 'improving';
    else if (currentCount > prevCount * 1.2) citationVelocity = 'worsening';
  }

  // Average severity
  const avgSeverity = (defs) => {
    if (!defs.length) return 0;
    const severityNums = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10, K: 11, L: 12 };
    return defs.reduce((sum, d) => sum + (severityNums[d.scope_severity] || 0), 0) / defs.length;
  };

  const currentAvgSeverity = avgSeverity(currentSurvey[1]);
  const prevAvgSeverity = avgSeverity(prevSurvey[1]);

  let severityTrend = 'stable';
  if (Math.abs(currentAvgSeverity - prevAvgSeverity) > 0.5) {
    severityTrend = currentAvgSeverity < prevAvgSeverity ? 'improving' : 'worsening';
  }

  // Repeat F-tags
  const currentFtags = new Set(currentSurvey[1].map(d => d.deficiency_tag));
  const prevFtags = new Set(prevSurvey[1].map(d => d.deficiency_tag));
  const repeatFtags = [...currentFtags].filter(t => prevFtags.has(t));
  const repeatFtagRate = currentFtags.size > 0 ? repeatFtags.length / currentFtags.size : 0;

  // Days since events
  const lastSurveyDate = currentSurvey[0] ? new Date(currentSurvey[0]) : null;
  const daysSinceLastSurvey = lastSurveyDate
    ? Math.floor((Date.now() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Days since IJ
  const ijDeficiencies = deficiencies.filter(d =>
    d.is_standard_deficiency && ['J', 'K', 'L'].includes(d.scope_severity)
  );
  const lastIjDate = ijDeficiencies.length > 0 ? ijDeficiencies[0].survey_date : null;
  const daysSinceIj = lastIjDate
    ? Math.floor((Date.now() - new Date(lastIjDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    currentSurveyDeficiencies: currentCount,
    previousSurveyDeficiencies: prevCount,
    prev2SurveyDeficiencies: prev2Count,
    citationVelocity,
    currentAvgSeverity: Math.round(currentAvgSeverity * 100) / 100,
    severityTrend,
    repeatFtagRate: Math.round(repeatFtagRate * 1000) / 1000,
    repeatFtagList: repeatFtags,
    daysSinceLastSurvey,
    daysSinceLastIj: daysSinceIj,
    surveyOverdue: daysSinceLastSurvey > 456 // ~15 months
  };
}

/**
 * Calculate risk scores for each clinical system
 */
function calculateSystemScores(deficiencies, facility) {
  const systemStats = {};

  // Initialize all systems
  for (let i = 1; i <= 7; i++) {
    systemStats[i] = {
      systemId: i,
      systemName: CLINICAL_SYSTEMS[i].name,
      citationCount: 0,
      severityWeightedCount: 0,
      ftagsCited: new Set(),
      repeatFtags: [],
      lastCitedDate: null,
      hadIj: false,
      hadHarm: false
    };
  }

  // Group by survey for repeat detection
  const surveyFtags = new Map();

  // Process deficiencies
  deficiencies.forEach(d => {
    if (!d.is_standard_deficiency) return;

    const systemId = FTAG_SYSTEM_MAP[d.deficiency_tag];
    if (!systemId) return;

    const stats = systemStats[systemId];
    stats.citationCount++;
    stats.severityWeightedCount += SEVERITY_WEIGHTS[d.scope_severity] || 1;
    stats.ftagsCited.add(d.deficiency_tag);

    if (!stats.lastCitedDate || d.survey_date > stats.lastCitedDate) {
      stats.lastCitedDate = d.survey_date;
    }

    if (['J', 'K', 'L'].includes(d.scope_severity)) stats.hadIj = true;
    if (['G', 'H', 'I'].includes(d.scope_severity)) stats.hadHarm = true;

    // Track for repeat detection
    const dateKey = d.survey_date.toISOString().split('T')[0];
    if (!surveyFtags.has(dateKey)) surveyFtags.set(dateKey, new Map());
    if (!surveyFtags.get(dateKey).has(systemId)) surveyFtags.get(dateKey).set(systemId, new Set());
    surveyFtags.get(dateKey).get(systemId).add(d.deficiency_tag);
  });

  // Find repeat F-tags by system
  const surveyDates = Array.from(surveyFtags.keys()).sort().reverse();
  if (surveyDates.length >= 2) {
    const currentDate = surveyDates[0];
    const prevDate = surveyDates[1];

    for (let systemId = 1; systemId <= 7; systemId++) {
      const currentFtags = surveyFtags.get(currentDate)?.get(systemId) || new Set();
      const prevFtags = surveyFtags.get(prevDate)?.get(systemId) || new Set();
      systemStats[systemId].repeatFtags = [...currentFtags].filter(t => prevFtags.has(t));
    }
  }

  // Normalize to 0-100 scores
  const maxSeverityWeighted = Math.max(...Object.values(systemStats).map(s => s.severityWeightedCount), 1);

  const systemScores = Object.values(systemStats).map(stats => {
    // Citation factor (0-100)
    const citationFactor = Math.min(100, (stats.severityWeightedCount / maxSeverityWeighted) * 100);

    // Bonus for repeat F-tags
    const repeatBonus = stats.repeatFtags.length * 5;

    // IJ/Harm bonus
    const severityBonus = (stats.hadIj ? 20 : 0) + (stats.hadHarm ? 10 : 0);

    return {
      ...stats,
      ftagsCited: [...stats.ftagsCited],
      citationFactorScore: Math.min(100, citationFactor + repeatBonus + severityBonus),
      // Placeholder scores (would be populated from QM data)
      qmFactorScore: 50,
      qmTrendScore: 50,
      peerFactorScore: 50,
      stateFactorScore: 50
    };
  });

  // Calculate final system risk scores
  return systemScores.map(s => ({
    ...s,
    systemRiskScore: Math.round(
      (s.citationFactorScore * 0.40) +
      (s.qmFactorScore * 0.25) +
      (s.qmTrendScore * 0.15) +
      (s.peerFactorScore * 0.10) +
      (s.stateFactorScore * 0.10)
    )
  })).sort((a, b) => b.systemRiskScore - a.systemRiskScore);
}

/**
 * Get peer comparison data
 */
async function getPeerComparison(pool, facility, systemScores) {
  const bedBucket = facility.certified_beds < 60 ? 'small' :
    facility.certified_beds < 120 ? 'medium' : 'large';

  try {
    const result = await pool.query(`
      WITH peer_facilities AS (
        SELECT federal_provider_number
        FROM snf_facilities
        WHERE state = $1
          AND certified_beds BETWEEN $2 * 0.75 AND $2 * 1.25
      ),
      peer_citations AS (
        SELECT
          d.federal_provider_number,
          COUNT(*) as citation_count
        FROM cms_facility_deficiencies d
        JOIN peer_facilities pf ON d.federal_provider_number = pf.federal_provider_number
        WHERE d.survey_date >= CURRENT_DATE - INTERVAL '3 years'
          AND d.is_standard_deficiency = true
        GROUP BY d.federal_provider_number
      )
      SELECT
        COUNT(*) as peer_count,
        AVG(citation_count) as avg_citations,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY citation_count) as median_citations
      FROM peer_citations
    `, [facility.state, facility.certified_beds]);

    return {
      peerGroupSize: parseInt(result.rows[0]?.peer_count) || 0,
      avgCitations: parseFloat(result.rows[0]?.avg_citations) || 0,
      medianCitations: parseFloat(result.rows[0]?.median_citations) || 0,
      bedBucket
    };
  } catch (error) {
    console.error('Error getting peer comparison:', error);
    return { peerGroupSize: 0, avgCitations: 0, medianCitations: 0, bedBucket };
  }
}

/**
 * Get state survey trends
 */
async function getStateTrends(pool, state) {
  try {
    const result = await pool.query(`
      WITH current_year AS (
        SELECT COUNT(*) as citations
        FROM cms_facility_deficiencies d
        JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
        WHERE f.state = $1
          AND d.is_standard_deficiency = true
          AND EXTRACT(YEAR FROM d.survey_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      ),
      prev_year AS (
        SELECT COUNT(*) as citations
        FROM cms_facility_deficiencies d
        JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
        WHERE f.state = $1
          AND d.is_standard_deficiency = true
          AND EXTRACT(YEAR FROM d.survey_date) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
      )
      SELECT
        cy.citations as current_year_citations,
        py.citations as prev_year_citations,
        CASE WHEN py.citations > 0
          THEN (cy.citations - py.citations)::FLOAT / py.citations
          ELSE 0
        END as yoy_change
      FROM current_year cy, prev_year py
    `, [state]);

    return {
      currentYearCitations: parseInt(result.rows[0]?.current_year_citations) || 0,
      prevYearCitations: parseInt(result.rows[0]?.prev_year_citations) || 0,
      yoyChange: parseFloat(result.rows[0]?.yoy_change) || 0
    };
  } catch (error) {
    console.error('Error getting state trends:', error);
    return { currentYearCitations: 0, prevYearCitations: 0, yoyChange: 0 };
  }
}

/**
 * Build final focus areas with evidence and recommendations
 */
function buildFocusAreas(systemScores, deficiencies, peerComparison, stateTrends) {
  return systemScores.map((system, index) => {
    // Get deficiencies for this system
    const systemDeficiencies = deficiencies.filter(d =>
      FTAG_SYSTEM_MAP[d.deficiency_tag] === system.systemId && d.is_standard_deficiency
    );

    // Build citation evidence
    const citationEvidence = {
      count_3yr: system.citationCount,
      severity_weighted_count: system.severityWeightedCount,
      repeat_ftags: system.repeatFtags,
      last_cited: system.lastCitedDate,
      had_ij: system.hadIj,
      had_harm: system.hadHarm,
      narrative: buildCitationNarrative(system)
    };

    // Build recommendations
    const recommendations = buildRecommendations(system);

    return {
      rank: index + 1,
      system_id: system.systemId,
      system_name: system.systemName,
      system_risk_score: system.systemRiskScore,
      evidence: {
        citation_history: citationEvidence,
        peer_comparison: {
          peer_group_size: peerComparison.peerGroupSize,
          peer_avg_citations: Math.round(peerComparison.avgCitations * 10) / 10,
          facility_citations: system.citationCount,
          narrative: system.citationCount > peerComparison.avgCitations
            ? `${(system.citationCount / Math.max(peerComparison.avgCitations, 1)).toFixed(1)}x more citations than similar facilities`
            : 'Below peer average'
        },
        state_trends: {
          yoy_change: Math.round(stateTrends.yoyChange * 100),
          narrative: stateTrends.yoyChange > 0.1
            ? `State increased citations by ${Math.round(stateTrends.yoyChange * 100)}% this year`
            : 'State citation rates stable or decreasing'
        }
      },
      recommendations,
      ftags_to_review: system.ftagsCited.slice(0, 10),
      scorecard_alignment: {
        our_system: `${system.systemId}. ${system.systemName}`,
        audit_focus_items: (SCORECARD_ALIGNMENT[system.systemId] || []).map(item =>
          `Item ${item.item}: ${item.description}`
        )
      }
    };
  });
}

/**
 * Build narrative for citation evidence
 */
function buildCitationNarrative(system) {
  const parts = [];

  if (system.citationCount === 0) {
    return `No ${system.systemName.toLowerCase()} citations in past 3 years.`;
  }

  parts.push(`${system.citationCount} ${system.systemName.toLowerCase()} citations in past 3 years`);

  if (system.hadIj) {
    parts.push('including Immediate Jeopardy');
  } else if (system.hadHarm) {
    parts.push('including Actual Harm deficiencies');
  }

  if (system.repeatFtags.length > 0) {
    parts.push(`${system.repeatFtags.length} repeat F-tags from previous survey`);
  }

  return parts.join('; ') + '.';
}

/**
 * Build recommendations based on system and citation patterns
 */
function buildRecommendations(system) {
  const recommendations = [];

  // System-specific high priority recommendations
  const systemRecommendations = {
    1: [ // Change of Condition
      { area: 'Vital Signs Protocol', rationale: 'Ensure timely notification of vital sign changes' },
      { area: 'Care Plan Updates', rationale: 'Update care plans within 24 hours of condition change' }
    ],
    2: [ // Accidents/Falls
      { area: 'Fall Risk Assessment', rationale: 'Complete fall risk assessment on admission and with changes' },
      { area: 'Environmental Safety Rounds', rationale: 'Conduct daily safety rounds to identify hazards' },
      { area: 'Alarm Compliance', rationale: 'Audit bed/chair alarm usage and response times' }
    ],
    3: [ // Skin
      { area: 'Pressure Injury Prevention', rationale: 'Implement turning/repositioning protocols' },
      { area: 'Weekly Skin Assessments', rationale: 'Document comprehensive skin assessments weekly' },
      { area: 'Moisture Management', rationale: 'Address incontinence-related skin breakdown' }
    ],
    4: [ // Med Management/Weight Loss
      { area: 'Medication Error Prevention', rationale: 'Implement barcode scanning and double-checks' },
      { area: 'Antipsychotic Review', rationale: 'Review all antipsychotic prescriptions for appropriateness' },
      { area: 'Weight Monitoring', rationale: 'Weekly weights with intervention for 5% loss' }
    ],
    5: [ // Infection Control
      { area: 'Hand Hygiene Program', rationale: 'Implement hand hygiene observation program' },
      { area: 'Equipment Cleaning', rationale: 'Establish equipment cleaning protocols and audits' },
      { area: 'Catheter Reduction', rationale: 'Review all catheters for medical necessity' }
    ],
    6: [ // Transfer/Discharge
      { area: 'Discharge Planning', rationale: 'Begin discharge planning within 48 hours of admission' },
      { area: 'Medication Reconciliation', rationale: 'Complete medication reconciliation at all transitions' },
      { area: 'Communication Protocol', rationale: 'Ensure SBAR communication to receiving facilities' }
    ],
    7: [ // Abuse/Grievances
      { area: 'Grievance Response', rationale: 'Respond to grievances within 24 hours' },
      { area: 'Abuse Prevention Training', rationale: 'Annual abuse prevention training for all staff' },
      { area: 'Restraint Reduction', rationale: 'Review all restraints for alternatives' }
    ]
  };

  const baseRecs = systemRecommendations[system.systemId] || [];

  // Add priority based on citation patterns
  baseRecs.forEach((rec, index) => {
    recommendations.push({
      priority: index === 0 && system.systemRiskScore > 60 ? 'High' :
        index < 2 && system.systemRiskScore > 40 ? 'Medium' : 'Low',
      area: rec.area,
      rationale: rec.rationale
    });
  });

  // Add repeat F-tag specific recommendations
  if (system.repeatFtags.length > 0) {
    recommendations.unshift({
      priority: 'High',
      area: 'Address Repeat Citations',
      rationale: `F-tags ${system.repeatFtags.join(', ')} cited in consecutive surveys - systemic issue`
    });
  }

  return recommendations.slice(0, 5);
}

/**
 * Calculate overall facility risk score
 */
function calculateOverallRiskScore(systemScores, citationMetrics) {
  // Average of top 3 system scores
  const topSystemsAvg = systemScores.slice(0, 3)
    .reduce((sum, s) => sum + s.systemRiskScore, 0) / 3;

  // Adjust based on citation metrics
  let adjustment = 0;
  if (citationMetrics.citationVelocity === 'worsening') adjustment += 10;
  if (citationMetrics.citationVelocity === 'improving') adjustment -= 10;
  if (citationMetrics.repeatFtagRate > 0.3) adjustment += 10;
  if (citationMetrics.surveyOverdue) adjustment += 5;

  return Math.max(0, Math.min(100, Math.round(topSystemsAvg + adjustment)));
}

/**
 * Get risk tier from score
 */
function getRiskTier(score) {
  if (score >= 75) return 'Very High';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

/**
 * Build key metrics summary
 */
function buildKeyMetrics(facility, citationMetrics, deficiencies) {
  // Calculate QM trends summary (placeholder)
  const qmTrendsSummary = {
    improving: 3,
    stable: 8,
    worsening: 4
  };

  // Calculate staffing vs state (would need state averages)
  const staffingVsState = {
    rn_hours: facility.rn_staffing_hours ? 1.0 : null, // placeholder
    total_hours: facility.total_nurse_staffing_hours ? 1.0 : null
  };

  // Weekend staffing gap
  let weekendGap = null;
  if (facility.total_nurse_staffing_hours && facility.weekend_total_nurse_hours) {
    weekendGap = (facility.total_nurse_staffing_hours - facility.weekend_total_nurse_hours) /
      facility.total_nurse_staffing_hours;
  }

  // Complaint survey rate
  const complaintSurveys = deficiencies.filter(d => d.is_complaint_deficiency && !d.is_standard_deficiency);
  const uniqueComplaintDates = [...new Set(complaintSurveys.map(d =>
    d.survey_date.toISOString().split('T')[0]
  ))];
  const complaintSurveyRate = uniqueComplaintDates.length / 3; // per year over 3 years

  return {
    citation_velocity: citationMetrics.citationVelocity,
    repeat_ftag_rate: citationMetrics.repeatFtagRate,
    days_since_last_survey: citationMetrics.daysSinceLastSurvey,
    days_since_last_ij: citationMetrics.daysSinceLastIj,
    survey_overdue: citationMetrics.surveyOverdue,
    ownership_type: facility.ownership_type,
    special_focus_facility: facility.special_focus_facility,
    fine_count: facility.fine_count,
    total_fines_amount: facility.total_fines_amount,
    complaint_survey_rate: Math.round(complaintSurveyRate * 10) / 10,
    qm_trends_summary: qmTrendsSummary,
    staffing: {
      rn_hours: facility.rn_staffing_hours,
      total_hours: facility.total_nurse_staffing_hours,
      weekend_total_hours: facility.weekend_total_nurse_hours,
      weekend_gap: weekendGap ? Math.round(weekendGap * 100) / 100 : null,
      turnover: facility.total_nursing_turnover,
      rn_turnover: facility.rn_turnover
    },
    occupancy_rate: facility.occupancy_rate
  };
}

module.exports = router;
