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

/**
 * Get penalty records for a facility (stub - returns empty for now)
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Penalty records
 */
export const getFacilityPenalties = async (ccn) => {
  // Penalty data not currently available in market database
  // Return empty array to prevent errors
  return { success: true, penalties: [] };
};

/**
 * Get ownership records for a facility (stub - not used in SystemsCheck)
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Ownership records
 */
export const getFacilityOwnership = async (ccn) => {
  // Ownership tab excluded per requirements
  return { success: true, ownership: [] };
};

/**
 * Get facility survey intelligence (stub - feature not yet available in SystemsCheck)
 * @param {string} ccn - CMS Certification Number
 * @returns {Promise<Object>} Survey intelligence data
 */
export const getFacilityIntelligence = async (ccn) => {
  // Survey intelligence is a specialized feature not yet available
  return { success: false, error: 'Feature not available' };
};
