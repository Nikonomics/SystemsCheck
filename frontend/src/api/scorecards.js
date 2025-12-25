import client from './client';

export const scorecardsApi = {
  /**
   * List all scorecards the user has access to
   * @param {object} params - Query params: status, facility_id, year, month, page, limit
   */
  list: async (params = {}) => {
    const response = await client.get('/scorecards', { params });
    return response.data;
  },

  /**
   * Get a single scorecard by ID with all systems and items
   */
  get: async (id) => {
    const response = await client.get(`/scorecards/${id}`);
    return response.data;
  },

  /**
   * Create a new scorecard for a facility
   */
  create: async (facilityId, data = {}) => {
    const response = await client.post(`/facilities/${facilityId}/scorecards`, data);
    return response.data;
  },

  /**
   * Update a scorecard (partial update)
   */
  update: async (id, data) => {
    const response = await client.put(`/scorecards/${id}`, data);
    return response.data;
  },

  /**
   * Update scorecard status (draft -> trial_close -> hard_close)
   */
  updateStatus: async (id, status) => {
    const response = await client.put(`/scorecards/${id}/status`, { status });
    return response.data;
  },

  /**
   * Get scorecard activity log
   */
  getActivityLog: async (id) => {
    const response = await client.get(`/scorecards/${id}/activity`);
    return response.data;
  },

  /**
   * Delete a scorecard (only draft or trial_close)
   */
  delete: async (id) => {
    const response = await client.delete(`/scorecards/${id}`);
    return response.data;
  },

  /**
   * Update system completion status
   * @param {number} scorecardId - The scorecard ID
   * @param {number} systemNumber - The system number (1-7)
   * @param {object} data - { completedById?, completedAt?, clear? }
   */
  updateSystemCompletion: async (scorecardId, systemNumber, data = {}) => {
    const response = await client.patch(`/scorecards/${scorecardId}/systems/${systemNumber}`, data);
    return response.data;
  },
};
