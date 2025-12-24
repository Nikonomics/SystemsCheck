import client from './client';

export const reportsApi = {
  /**
   * Get dashboard data (role-appropriate)
   */
  getDashboard: async () => {
    const response = await client.get('/reports/dashboard');
    return response.data;
  },

  /**
   * Get team comparison data
   * @param {Object} params - { company_id, date_range }
   */
  getTeams: async (params = {}) => {
    const response = await client.get('/reports/teams', { params });
    return response.data;
  },

  /**
   * Get company comparison data
   * @param {Object} params - { date_range }
   */
  getCompanies: async (params = {}) => {
    const response = await client.get('/reports/companies', { params });
    return response.data;
  },

  /**
   * Compare multiple facilities
   * @param {Object} params - { facility_ids (comma-separated), date_range }
   */
  compareFacilities: async (params) => {
    const response = await client.get('/reports/facilities/compare', { params });
    return response.data;
  },

  /**
   * Get system analysis data
   * @param {Object} params - { company_id, team_id, date_range }
   */
  getSystems: async (params = {}) => {
    const response = await client.get('/reports/systems', { params });
    return response.data;
  },
};
