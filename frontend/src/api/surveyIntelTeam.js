/**
 * Survey Intelligence Team API Client
 *
 * Handles all API calls for Team View in Survey Intelligence
 */

import client from './client';

const API_BASE = '/survey-intel';

const surveyIntelTeamApi = {
  /**
   * Get team summary with risk distribution
   */
  getTeamSummary: async (teamId) => {
    const response = await client.get(`${API_BASE}/team/${teamId}/summary`);
    return response.data;
  },

  /**
   * Get all facilities with risk scores and scorecard data
   */
  getTeamFacilities: async (teamId) => {
    const response = await client.get(`${API_BASE}/team/${teamId}/facilities`);
    return response.data;
  },

  /**
   * Get clinical systems gap analysis (CMS risk vs scorecard)
   */
  getGapAnalysis: async (teamId) => {
    const response = await client.get(`${API_BASE}/team/${teamId}/gap-analysis`);
    return response.data;
  },

  /**
   * Get tags cited at 2+ facilities
   */
  getCommonIssues: async (teamId) => {
    const response = await client.get(`${API_BASE}/team/${teamId}/common-issues`);
    return response.data;
  },

  /**
   * Get team vs state vs national comparison
   */
  getMarketComparison: async (teamId) => {
    const response = await client.get(`${API_BASE}/team/${teamId}/market-comparison`);
    return response.data;
  },

  /**
   * Get monthly scorecard trends
   */
  getScorecardTrends: async (teamId) => {
    const response = await client.get(`${API_BASE}/team/${teamId}/scorecard-trends`);
    return response.data;
  },

  /**
   * Get AI-generated recommendations
   */
  getRecommendations: async (teamId) => {
    const response = await client.get(`${API_BASE}/team/${teamId}/recommendations`);
    return response.data;
  }
};

export default surveyIntelTeamApi;
