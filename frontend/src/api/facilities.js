import client from './client';

export const facilitiesApi = {
  /**
   * Get list of facilities with filtering
   */
  list: async (params = {}) => {
    const response = await client.get('/facilities', { params });
    return response.data;
  },

  /**
   * Get filter options (companies, teams, facility types)
   */
  getFilters: async () => {
    const response = await client.get('/facilities/filters');
    return response.data;
  },

  /**
   * Get single facility by ID
   */
  get: async (id) => {
    const response = await client.get(`/facilities/${id}`);
    return response.data;
  },

  /**
   * Get scorecard history for a facility
   */
  getScorecards: async (id, params = {}) => {
    const response = await client.get(`/facilities/${id}/scorecards`, { params });
    return response.data;
  },

  /**
   * Get trend data for charts
   */
  getTrend: async (id) => {
    const response = await client.get(`/facilities/${id}/trend`);
    return response.data;
  },
};
