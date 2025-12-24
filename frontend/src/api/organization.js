import client from './client';

export const organizationApi = {
  // Companies
  listCompanies: async () => {
    const response = await client.get('/organization/companies');
    return response.data;
  },

  getCompany: async (id) => {
    const response = await client.get(`/organization/companies/${id}`);
    return response.data;
  },

  createCompany: async (data) => {
    const response = await client.post('/organization/companies', data);
    return response.data;
  },

  updateCompany: async (id, data) => {
    const response = await client.put(`/organization/companies/${id}`, data);
    return response.data;
  },

  deleteCompany: async (id) => {
    const response = await client.delete(`/organization/companies/${id}`);
    return response.data;
  },

  // Teams
  listTeams: async (params = {}) => {
    const response = await client.get('/organization/teams', { params });
    return response.data;
  },

  getTeam: async (id) => {
    const response = await client.get(`/organization/teams/${id}`);
    return response.data;
  },

  createTeam: async (data) => {
    const response = await client.post('/organization/teams', data);
    return response.data;
  },

  updateTeam: async (id, data) => {
    const response = await client.put(`/organization/teams/${id}`, data);
    return response.data;
  },

  deleteTeam: async (id) => {
    const response = await client.delete(`/organization/teams/${id}`);
    return response.data;
  },

  // Facilities (admin)
  listFacilities: async (params = {}) => {
    const response = await client.get('/organization/facilities', { params });
    return response.data;
  },

  getFacility: async (id) => {
    const response = await client.get(`/organization/facilities/${id}`);
    return response.data;
  },

  createFacility: async (data) => {
    const response = await client.post('/organization/facilities', data);
    return response.data;
  },

  updateFacility: async (id, data) => {
    const response = await client.put(`/organization/facilities/${id}`, data);
    return response.data;
  },

  deleteFacility: async (id) => {
    const response = await client.delete(`/organization/facilities/${id}`);
    return response.data;
  },

  // Export
  exportScorecards: async () => {
    const response = await client.get('/organization/export/scorecards');
    return response.data;
  },
};
