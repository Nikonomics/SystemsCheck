/**
 * CMS Data API Service
 *
 * Provides API functions for accessing CMS facility data.
 * Used by the Facility Detail CMS tabs.
 */

import client from './client';

const CMS_BASE = '/cms';

/**
 * Get comprehensive facility profile by CCN
 * @param {string} ccn - CMS Certification Number (e.g., "065001")
 * @returns {Promise<Object>} Full facility profile with trends, citations, etc.
 */
export const getFacilityProfile = async (ccn) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}`);
  return response.data;
};

/**
 * Get nearby competing facilities
 * @param {string} ccn - CMS Certification Number
 * @param {number} radiusMiles - Search radius (default 25)
 * @param {number} limit - Max results (default 20)
 * @returns {Promise<Object>} Array of nearby facilities with distances
 */
export const getFacilityCompetitors = async (ccn, radiusMiles = 25, limit = 20) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/competitors`, {
    params: { radiusMiles, limit }
  });
  return response.data;
};

/**
 * Search SNF facilities with filters
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Search results with total count
 */
export const searchFacilities = async (params = {}) => {
  const response = await client.get(`${CMS_BASE}/snf/search`, { params });
  return response.data;
};

/**
 * Get detailed deficiency records for a facility
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Deficiency records
 */
export const getFacilityDeficiencies = async (ccn) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/deficiencies`);
  return response.data;
};

/**
 * Get benchmark comparisons (market, state, national) for a facility
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Benchmark data
 */
export const getFacilityBenchmarks = async (ccn) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/benchmarks`);
  return response.data;
};

/**
 * Get percentile rankings for a facility compared to peers
 * @param {string} ccn - CMS Certification Number
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} Percentile data with distributions
 */
export const getFacilityPercentiles = async (ccn, options = {}) => {
  const params = {};
  if (options.scope) params.scope = options.scope;
  if (options.state) params.state = options.state;
  if (options.size) params.size = options.size;

  const response = await client.get(`${CMS_BASE}/snf/${ccn}/percentiles`, { params });
  return response.data;
};

/**
 * Get VBP rankings for a facility at national, state, market, and chain levels
 * @param {string} ccn - CMS Certification Number
 * @param {Object} options - Optional filters
 * @returns {Promise<Object>} VBP rankings data
 */
export const getFacilityVbpRankings = async (ccn, options = {}) => {
  const params = {};
  if (options.year) params.year = options.year;

  const response = await client.get(`${CMS_BASE}/snf/${ccn}/vbp-rankings`, { params });
  return response.data;
};

/**
 * Get comprehensive VBP data for a facility
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Full VBP data with current, history, rankings, estimated_impact
 */
export const getFacilityVBP = async (ccn) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/vbp`);
  return response.data;
};

// ============================================================================
// DEPRECATED STUB FUNCTIONS
// These return empty data - penalty/ownership data not available in market DB
// getFacilityIntelligence is replaced by /survey-intelligence page
// ============================================================================

/** @deprecated Penalty data not available in market database */
export const getFacilityPenalties = async (ccn) => {
  return { success: true, penalties: [] };
};

/** @deprecated Ownership data excluded per requirements */
export const getFacilityOwnership = async (ccn) => {
  return { success: true, ownership: [] };
};

/** @deprecated Use /survey-intelligence page instead */
export const getFacilityIntelligence = async (ccn) => {
  return { success: false, error: 'Use /survey-intelligence page instead' };
};

// ============================================================================
// SURVEY ANALYTICS API FUNCTIONS
// ============================================================================

/**
 * Get survey summary for overview tab
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Survey summary with ratings, last surveys, alerts
 */
export const getSurveySummary = async (ccn) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/survey-summary`);
  return response.data;
};

/**
 * Get all surveys (health and fire safety) for a facility
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Survey list with dates and deficiency counts
 */
export const getSurveys = async (ccn) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/surveys`);
  return response.data;
};

/**
 * Get deficiency analysis with category, severity, and trend breakdowns
 * @param {string} ccn - CMS Certification Number
 * @param {Object} params - Optional filters (startDate, endDate, surveyType)
 * @returns {Promise<Object>} Deficiency analysis data
 */
export const getDeficiencyAnalysis = async (ccn, params = {}) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/deficiency-analysis`, { params });
  return response.data;
};

/**
 * Get fire safety citations and surveys
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Fire safety data with K-tags and E-tags
 */
export const getFireSafety = async (ccn) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/fire-safety`);
  return response.data;
};

/**
 * Get quality measure scores with benchmarks
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} QM ratings with state/national comparisons
 */
export const getQualityMeasures = async (ccn) => {
  const response = await client.get(`${CMS_BASE}/snf/${ccn}/quality-measures`);
  return response.data;
};
