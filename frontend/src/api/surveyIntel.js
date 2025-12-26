/**
 * Survey Intelligence API Service
 *
 * Provides API functions for accessing predictive risk insights.
 * Used by the Survey Intelligence Facility View.
 */

import client from './client';

const SURVEY_INTEL_BASE = '/survey-intel';

/**
 * Get risk score and factors for a facility
 * @param {number} facilityId - Internal facility ID
 * @returns {Promise<Object>} Risk score data with factors breakdown
 */
export const getRiskScore = async (facilityId) => {
  const response = await client.get(`${SURVEY_INTEL_BASE}/facility/${facilityId}/risk-score`);
  return response.data;
};

/**
 * Get deficiency trends for a facility
 * @param {number} facilityId - Internal facility ID
 * @returns {Promise<Object>} Trend data with worsening/persistent/improving tags
 */
export const getTrends = async (facilityId) => {
  const response = await client.get(`${SURVEY_INTEL_BASE}/facility/${facilityId}/trends`);
  return response.data;
};

/**
 * Get all-tags heatmap for a facility
 * @param {number} facilityId - Internal facility ID
 * @returns {Promise<Object>} Heatmap data with tags and surveys matrix
 */
export const getHeatmap = async (facilityId) => {
  const response = await client.get(`${SURVEY_INTEL_BASE}/facility/${facilityId}/heatmap`);
  return response.data;
};

/**
 * Get deficiencies grouped by survey type
 * @param {number} facilityId - Internal facility ID
 * @returns {Promise<Object>} Survey type breakdown data
 */
export const getSurveyTypeBreakdown = async (facilityId) => {
  const response = await client.get(`${SURVEY_INTEL_BASE}/facility/${facilityId}/by-survey-type`);
  return response.data;
};

/**
 * Get chronological survey timeline with pattern detection
 * @param {number} facilityId - Internal facility ID
 * @returns {Promise<Object>} Timeline data with surveys and patterns
 */
export const getTimeline = async (facilityId) => {
  const response = await client.get(`${SURVEY_INTEL_BASE}/facility/${facilityId}/timeline`);
  return response.data;
};

/**
 * Get clinical systems breakdown with CMS risk and scorecard gaps
 * @param {number} facilityId - Internal facility ID
 * @returns {Promise<Object>} System risk data with scorecard comparison
 */
export const getSystemRisk = async (facilityId) => {
  const response = await client.get(`${SURVEY_INTEL_BASE}/facility/${facilityId}/system-risk`);
  return response.data;
};

/**
 * Get market context with state trends and emerging risks
 * @param {number} facilityId - Internal facility ID
 * @returns {Promise<Object>} Market context data with trending tags
 */
export const getMarketContext = async (facilityId) => {
  const response = await client.get(`${SURVEY_INTEL_BASE}/facility/${facilityId}/market-context`);
  return response.data;
};

export default {
  getRiskScore,
  getTrends,
  getHeatmap,
  getSurveyTypeBreakdown,
  getTimeline,
  getSystemRisk,
  getMarketContext
};
