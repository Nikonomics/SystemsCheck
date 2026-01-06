import client from './client';

export const usersApi = {
  // Profile endpoints (for current user)
  getProfile: async () => {
    const response = await client.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await client.put('/users/profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await client.put('/users/profile/password', data);
    return response.data;
  },

  // Admin endpoints
  list: async (params = {}) => {
    const response = await client.get('/users', { params });
    return response.data;
  },

  get: async (id) => {
    const response = await client.get(`/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await client.post('/users', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await client.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await client.delete(`/users/${id}`);
    return response.data;
  },

  resetPassword: async (id, password) => {
    const response = await client.put(`/users/${id}/password`, { password });
    return response.data;
  },

  // Impersonate user (for testing)
  impersonate: async (id) => {
    const response = await client.post(`/users/${id}/impersonate`);
    return response.data;
  },
};
