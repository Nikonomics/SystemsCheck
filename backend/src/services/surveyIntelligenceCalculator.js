/**
 * Survey Intelligence Calculator
 *
 * Calculates all Survey Intelligence metrics for a facility:
 * - Survey Risk Score (lagging + leading indicators)
 * - Capacity Strain and Quadrant Classification
 * - Operational Metrics with status thresholds
 * - Alert Flags
 * - Recommendations
 * - Chain Context
 * - Gap Analysis
 */

// ============================================================
// THRESHOLDS AND CONSTANTS
// ============================================================

const THRESHOLDS = {
  turnover: {
    critical: 60,
    warning: 50,
    target: 40,
    excellent: 30
  },
  rnSkillMix: {
    critical: 0.15,
    warning: 0.20,
    target: 0.25,
    excellent: 0.30
  },
  rnHours: {
    critical: 0.40,
    warning: 0.50,
    target: 0.50,
    excellent: 0.75
  },
  weekendGap: {
    critical: 0.30,
    warning: 0.20,
    target: 0.20,
    excellent: 0.10
  },
  occupancy: {
    critical: 0.50,
    warning: 0.60,
    target: 0.70,
    excellent: 0.80
  }
};

const RISK_SCORE = {
  // Lagging component weights (70%)
  sffPoints: 30,
  healthStarMultiplier: 10, // (5 - star) × 10
  prevHarmPointsPer: 5,
  prevHarmCap: 20,
  finePointsPer: 3,
  fineCap: 15,
  prevIJPoints: 10,

  // Leading component (30%) - quadrant points
  quadrantPoints: {
    'Struggling': 30,
    'Overextended': 20,
    'Comfortable': 5,
    'High Performing': 0
  },

  // Tier thresholds
  tiers: {
    critical: 75,
    high: 55,
    moderate: 35
  }
};

// ============================================================
// STATUS HELPERS
// ============================================================

function getMetricStatus(value, metric, inverse = false) {
  const t = THRESHOLDS[metric];
  if (!t) return 'UNKNOWN';

  if (inverse) {
    // Higher is worse (turnover, weekendGap)
    if (value >= t.critical) return 'CRITICAL';
    if (value >= t.warning) return 'WARNING';
    if (value >= t.target) return 'TARGET';
    return 'EXCELLENT';
  } else {
    // Higher is better (rnSkillMix, rnHours, occupancy)
    if (value < t.critical) return 'CRITICAL';
    if (value < t.warning) return 'WARNING';
    if (value < t.target) return 'TARGET';
    return 'EXCELLENT';
  }
}

function getRiskTier(score) {
  if (score >= RISK_SCORE.tiers.critical) return 'Critical';
  if (score >= RISK_SCORE.tiers.high) return 'High';
  if (score >= RISK_SCORE.tiers.moderate) return 'Moderate';
  return 'Low';
}

function getQuadrant(occupancy, resourceScore) {
  const highOcc = occupancy >= 80;
  const highRes = resourceScore >= 50;

  if (highOcc && !highRes) return 'Overextended';
  if (highOcc && highRes) return 'High Performing';
  if (!highOcc && !highRes) return 'Struggling';
  return 'Comfortable';
}

// ============================================================
// CORE CALCULATIONS
// ============================================================

/**
 * Calculate Resource Score (0-100)
 */
function calculateResourceScore(facility, percentiles) {
  const staffingStarComponent = ((facility.staffing_rating || 3) / 5 * 100) * 0.35;
  const qmStarComponent = ((facility.qm_rating || 3) / 5 * 100) * 0.35;
  const rnHoursComponent = (percentiles.rnHoursPctl || 50) * 0.20;
  const turnoverComponent = (100 - (percentiles.turnoverPctl || 50)) * 0.10;

  return staffingStarComponent + qmStarComponent + rnHoursComponent + turnoverComponent;
}

/**
 * Calculate Capacity Strain Index
 */
function calculateCapacityStrain(occupancy, resourceScore) {
  return occupancy * (100 - resourceScore) / 100;
}

/**
 * Calculate Survey Risk Score
 */
function calculateSurveyRiskScore(facility, quadrant, cmsData = {}) {
  // Lagging Component
  let laggingScore = 0;

  // SFF Status
  if (facility.is_sff || cmsData.special_focus_facility) {
    laggingScore += RISK_SCORE.sffPoints;
  }

  // Health Inspection Star (lower = higher risk)
  const healthStar = cmsData.health_inspection_rating || facility.health_inspection_rating || 3;
  laggingScore += (5 - healthStar) * RISK_SCORE.healthStarMultiplier;

  // Previous Harm Count
  const prevHarm = cmsData.prev_harm_count || 0;
  laggingScore += Math.min(prevHarm * RISK_SCORE.prevHarmPointsPer, RISK_SCORE.prevHarmCap);

  // Fine Count
  const fineCount = cmsData.fine_count || 0;
  laggingScore += Math.min(fineCount * RISK_SCORE.finePointsPer, RISK_SCORE.fineCap);

  // Previous IJ
  if (cmsData.had_ij_last_survey) {
    laggingScore += RISK_SCORE.prevIJPoints;
  }

  // Leading Component (Quadrant-based)
  const leadingScore = RISK_SCORE.quadrantPoints[quadrant] || 0;

  // Combined Score: 70% lagging + 30% leading
  const totalScore = Math.round((laggingScore * 0.70) + (leadingScore * 0.30));

  return {
    total: Math.min(totalScore, 100),
    lagging: Math.round(laggingScore),
    leading: leadingScore,
    tier: getRiskTier(Math.min(totalScore, 100))
  };
}

/**
 * Calculate all operational metrics with status
 */
function calculateOperationalMetrics(facility, cmsData = {}) {
  // Turnover
  const turnover = cmsData.total_nursing_turnover || facility.nursing_turnover || null;
  const turnoverStatus = turnover !== null ? getMetricStatus(turnover, 'turnover', true) : null;

  // RN Skill Mix
  const rnHours = cmsData.rn_staffing_hours || facility.rn_hours || null;
  const totalHours = cmsData.total_nurse_staffing_hours || facility.total_nursing_hours || null;
  const rnSkillMix = (rnHours && totalHours && totalHours > 0)
    ? rnHours / totalHours
    : null;
  const rnSkillMixStatus = rnSkillMix !== null ? getMetricStatus(rnSkillMix, 'rnSkillMix', false) : null;

  // RN Hours per Resident Day
  const rnHoursStatus = rnHours !== null ? getMetricStatus(rnHours, 'rnHours', false) : null;

  // Weekend Gap
  const weekdayHours = totalHours || 0;
  const weekendHours = cmsData.weekend_total_nurse_hours || 0;
  const weekendGap = (weekdayHours > 0 && weekendHours > 0)
    ? Math.max(0, (weekdayHours - weekendHours) / weekdayHours)
    : null;
  const weekendGapStatus = weekendGap !== null ? getMetricStatus(weekendGap, 'weekendGap', true) : null;

  // Occupancy
  const occupancy = cmsData.occupancy_rate || facility.occupancy_rate || null;
  const occupancyStatus = occupancy !== null ? getMetricStatus(occupancy / 100, 'occupancy', false) : null;

  return {
    turnover: { value: turnover, status: turnoverStatus, target: '<40%' },
    rnSkillMix: { value: rnSkillMix ? (rnSkillMix * 100).toFixed(1) + '%' : null, status: rnSkillMixStatus, target: '30%+' },
    rnHours: { value: rnHours, status: rnHoursStatus, target: '0.50-0.75' },
    weekendGap: { value: weekendGap ? (weekendGap * 100).toFixed(1) + '%' : null, status: weekendGapStatus, target: '<20%' },
    occupancy: { value: occupancy, status: occupancyStatus, target: '80-90%' }
  };
}

/**
 * Generate Alert Flags
 */
function generateAlertFlags(metrics, quadrant, cmsData = {}) {
  const flags = [];

  // DOUBLE_TROUBLE: High turnover + Low RN hours
  const turnoverValue = metrics.turnover.value;
  const rnHoursValue = metrics.rnHours.value;
  if (turnoverValue > 50 && rnHoursValue < 0.40) {
    flags.push({
      name: 'DOUBLE_TROUBLE',
      severity: 'CRITICAL',
      impact: '-0.39 QM stars on average',
      message: 'High turnover combined with low RN staffing is the highest-risk combination'
    });
  }

  // DEATH_SPIRAL_RISK: Struggling quadrant
  if (quadrant === 'Struggling') {
    flags.push({
      name: 'DEATH_SPIRAL_RISK',
      severity: 'CRITICAL',
      impact: '65% bad outcome rate',
      message: 'Low occupancy + low resources indicates potential financial/operational spiral'
    });
  }

  // WEEKEND_VULNERABILITY: Large weekend gap
  const weekendGapValue = parseFloat(metrics.weekendGap.value) / 100;
  if (weekendGapValue > 0.25) {
    flags.push({
      name: 'WEEKEND_VULNERABILITY',
      severity: 'WARNING',
      impact: '-0.34 QM stars',
      message: 'Significant weekend staffing reduction creates risk window'
    });
  }

  // ABUSE_HISTORY: Any F600-F610 citations
  if (cmsData.has_abuse_citations) {
    flags.push({
      name: 'ABUSE_HISTORY',
      severity: 'WARNING',
      impact: '-0.26 QM stars',
      message: 'History of abuse citations indicates culture concerns'
    });
  }

  return flags;
}

/**
 * Generate prioritized recommendations
 */
function generateRecommendations(metrics, focusAreas = [], alertFlags = []) {
  const recommendations = [];
  let priority = 1;

  // Priority 1: Double Trouble (if flagged)
  const hasDoubleTrouble = alertFlags.some(f => f.name === 'DOUBLE_TROUBLE');
  if (hasDoubleTrouble) {
    recommendations.push({
      priority: priority++,
      area: 'Staffing Crisis',
      current: `Turnover: ${metrics.turnover.value}%, RN Hours: ${metrics.rnHours.value}`,
      target: 'Turnover <40%, RN Hours >0.50',
      impact: '+0.39 QM stars expected when resolved',
      action: 'Immediate retention and recruitment intervention required. Address root causes of turnover while temporarily increasing agency staff to meet RN hours.',
      evidence: 'Double Trouble combination validated as highest-risk on 14,000+ facilities'
    });
  }

  // Priority 2: Turnover > 50%
  if (metrics.turnover.value > 50 && !hasDoubleTrouble) {
    recommendations.push({
      priority: priority++,
      area: 'Turnover',
      current: `${metrics.turnover.value}%`,
      target: '<40%',
      impact: '+0.35 QM stars expected',
      action: 'Implement retention initiatives: exit interviews, compensation review, scheduling flexibility, career development paths',
      evidence: 'Facilities with <40% turnover are 1.49x more likely to achieve 4-5 star ratings'
    });
  }

  // Priority 3: RN Skill Mix < 25%
  const rnSkillMixValue = parseFloat(metrics.rnSkillMix.value);
  if (rnSkillMixValue < 25) {
    recommendations.push({
      priority: priority++,
      area: 'RN Skill Mix',
      current: metrics.rnSkillMix.value,
      target: '30%+',
      impact: '+0.28 QM stars expected',
      action: 'Increase RN proportion of nursing staff. Consider RN-to-resident ratios for clinical leadership coverage.',
      evidence: 'Facilities with >30% RN skill mix are 1.31x more likely to achieve high QM ratings'
    });
  }

  // Priority 4: RN Hours < 0.50
  if (metrics.rnHours.value < 0.50 && !hasDoubleTrouble) {
    recommendations.push({
      priority: priority++,
      area: 'RN Hours',
      current: `${metrics.rnHours.value} HPRD`,
      target: '0.50-0.75 HPRD',
      impact: '+0.20 QM stars expected',
      action: 'Increase RN staffing hours per resident day. Prioritize during high-acuity shifts.',
      evidence: 'Each +0.1 RN HPRD increases QM star by ~0.08. Top quartile facilities average 0.75+ HPRD.'
    });
  }

  // Priority 5: Top Focus Area (if provided)
  if (focusAreas.length > 0 && focusAreas[0].system_score >= 60) {
    const topFocus = focusAreas[0];
    recommendations.push({
      priority: priority++,
      area: `Focus Area: ${topFocus.system_name}`,
      current: `Score: ${topFocus.system_score}`,
      target: 'Score <50',
      impact: 'Reduces IJ/Harm probability on next survey',
      action: `Review ${topFocus.system_name} protocols, conduct targeted training, implement monitoring checklists`,
      evidence: 'Focus Areas analysis validated with 1.91x lift in identifying bad outcomes'
    });
  }

  // Priority 6: Weekend Gap > 20%
  const weekendGapValue = parseFloat(metrics.weekendGap.value);
  if (weekendGapValue > 20) {
    recommendations.push({
      priority: priority++,
      area: 'Weekend Staffing',
      current: `${weekendGapValue}% gap`,
      target: '<20% gap',
      impact: '+0.15 QM stars expected',
      action: 'Reduce weekend staffing differential. Implement weekend incentives or rotational coverage.',
      evidence: 'Weekend gaps >20% indicate process inconsistency and correlate with lower QM scores'
    });
  }

  return recommendations;
}

/**
 * Calculate Chain Context
 */
function calculateChainContext(facility, chainData = {}) {
  if (!chainData.chain_name) {
    return {
      chain_name: null,
      is_independent: true,
      insight: 'Independent facility - compared to state average'
    };
  }

  const facilityQM = facility.qm_rating || 3;
  const chainAvgQM = chainData.chain_avg_qm || 3;
  const vsChain = facilityQM - chainAvgQM;

  let vsChainStatus;
  if (vsChain >= 0.3) vsChainStatus = 'ABOVE_PEERS';
  else if (vsChain <= -0.3) vsChainStatus = 'BELOW_PEERS';
  else vsChainStatus = 'AT_PEERS';

  let insight;
  if (vsChain >= 0.5) {
    insight = `Outperforming sister facilities by ${vsChain.toFixed(1)} stars - best practices to share`;
  } else if (vsChain <= -0.5) {
    insight = `Underperforming vs sister facilities by ${Math.abs(vsChain).toFixed(1)} stars - opportunity for peer learning`;
  } else {
    insight = 'Performing in line with chain average';
  }

  return {
    chain_name: chainData.chain_name,
    chain_facility_count: chainData.chain_facility_count,
    chain_avg_qm: chainAvgQM,
    chain_rank: chainData.chain_rank,
    chain_percentile: chainData.chain_percentile,
    facility_qm: facilityQM,
    vs_chain: vsChain,
    vs_chain_status: vsChainStatus,
    best_in_chain: chainData.best_in_chain,
    insight: insight
  };
}

/**
 * Calculate Gap Analysis (External vs Internal)
 */
function calculateGapAnalysis(surveyRiskScore, auditScore) {
  if (auditScore === null || auditScore === undefined) {
    return {
      status: 'NO_AUDIT_DATA',
      insight: 'No internal audit data available for comparison'
    };
  }

  const highExternalRisk = surveyRiskScore >= 55;
  const highInternalRisk = auditScore < 70;

  let status, insight;

  if (highExternalRisk && highInternalRisk) {
    status = 'CONFIRMED_RISK';
    insight = 'External and internal data agree - this facility needs urgent support';
  } else if (highExternalRisk && !highInternalRisk) {
    status = 'VALIDATE';
    insight = 'Strong internal scores but elevated external risk. Verify audit processes align with CMS focus areas.';
  } else if (!highExternalRisk && highInternalRisk) {
    status = 'HIDDEN_RISK';
    insight = 'Low external risk but internal audits show concerns. Address before problems become visible to CMS.';
  } else {
    status = 'GOOD_SHAPE';
    insight = 'Both external and internal indicators are positive. Continue current practices.';
  }

  return { status, insight, surveyRiskScore, auditScore };
}

// ============================================================
// MAIN CALCULATION FUNCTION
// ============================================================

/**
 * Calculate complete Survey Intelligence for a facility
 *
 * @param {Object} facility - Facility record from SystemsCheck
 * @param {Object} cmsData - CMS data (staffing, QM, deficiencies, etc.)
 * @param {Object} percentiles - Calculated percentiles for comparison
 * @param {Object} chainData - Chain context data
 * @param {Array} focusAreas - Pre-calculated focus areas
 * @param {Number} auditScore - Internal audit score (if available)
 * @returns {Object} Complete Survey Intelligence object
 */
function calculateSurveyIntelligence(facility, cmsData = {}, percentiles = {}, chainData = {}, focusAreas = [], auditScore = null) {
  // Step 1: Calculate Resource Score
  const resourceScore = calculateResourceScore(facility, percentiles);

  // Step 2: Get occupancy
  const occupancy = cmsData.occupancy_rate || facility.occupancy_rate || 75;

  // Step 3: Calculate Capacity Strain and Quadrant
  const capacityStrain = calculateCapacityStrain(occupancy, resourceScore);
  const quadrant = getQuadrant(occupancy, resourceScore);

  // Step 4: Calculate Survey Risk Score
  const riskScore = calculateSurveyRiskScore(facility, quadrant, cmsData);

  // Step 5: Calculate Operational Metrics
  const operationalMetrics = calculateOperationalMetrics(facility, cmsData);

  // Step 6: Generate Alert Flags
  const alertFlags = generateAlertFlags(operationalMetrics, quadrant, cmsData);

  // Step 7: Generate Recommendations
  const recommendations = generateRecommendations(operationalMetrics, focusAreas, alertFlags);

  // Step 8: Calculate Chain Context
  const chainContext = calculateChainContext(facility, chainData);

  // Step 9: Calculate Gap Analysis
  const gapAnalysis = calculateGapAnalysis(riskScore.total, auditScore);

  return {
    facility_id: facility.id,
    federal_provider_number: facility.ccn || cmsData.federal_provider_number,

    // Survey Risk Score
    scores: {
      survey_risk: {
        score: riskScore.total,
        tier: riskScore.tier,
        lagging_component: riskScore.lagging,
        leading_component: riskScore.leading
      },
      focus_areas: focusAreas.slice(0, 3).map((fa, i) => ({
        rank: i + 1,
        system: fa.system_name,
        score: fa.system_score
      })),
      audit_score: auditScore !== null ? {
        score: auditScore,
        tier: auditScore >= 90 ? 'Excellent' :
              auditScore >= 75 ? 'Good' :
              auditScore >= 60 ? 'Fair' :
              auditScore >= 40 ? 'Poor' : 'Critical'
      } : null
    },

    // Operational Context
    operational_context: {
      resource_score: resourceScore,
      capacity_strain: capacityStrain,
      quadrant: quadrant,
      quadrant_badge: quadrant === 'High Performing' ? '✅' :
                      quadrant === 'Comfortable' ? '✓' :
                      quadrant === 'Overextended' ? '⚠️' : '🚨',
      metrics: operationalMetrics,
      alert_flags: alertFlags
    },

    // Recommendations
    recommendations: recommendations,

    // Chain Context
    chain_context: chainContext,

    // Gap Analysis
    gap_analysis: gapAnalysis,

    // Metadata
    metadata: {
      calculated_at: new Date().toISOString(),
      cms_data_as_of: cmsData.processing_date || null
    }
  };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  calculateSurveyIntelligence,
  calculateResourceScore,
  calculateCapacityStrain,
  calculateSurveyRiskScore,
  calculateOperationalMetrics,
  generateAlertFlags,
  generateRecommendations,
  calculateChainContext,
  calculateGapAnalysis,
  getQuadrant,
  getRiskTier,
  getMetricStatus,
  THRESHOLDS,
  RISK_SCORE
};
