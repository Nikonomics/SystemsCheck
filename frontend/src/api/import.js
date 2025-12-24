import client from './client';

export const importApi = {
  // Get template data for Excel download
  getTemplate: async () => {
    const response = await client.get('/import/template');
    return response.data;
  },

  // Validate scorecard data before import
  validate: async (scorecards) => {
    const response = await client.post('/import/validate', { scorecards });
    return response.data;
  },

  // Import historical scorecard data
  importHistorical: async (scorecards) => {
    const response = await client.post('/import/historical', { scorecards });
    return response.data;
  },
};
