import client from './client';

export const scorecardsApi = {
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
};
