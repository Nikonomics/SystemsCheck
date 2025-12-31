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

  // Validate Excel files with full item-level data
  validateFull: async (formData) => {
    const response = await client.post('/import/historical-full/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Import Excel files with full item-level data
  importFull: async (formData, onProgress) => {
    const response = await client.post('/import/historical-full', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        : undefined,
    });
    return response.data;
  },

  // Get import batch history
  getHistory: async () => {
    const response = await client.get('/import/history');
    return response.data;
  },

  // Get specific batch status
  getBatch: async (batchId) => {
    const response = await client.get(`/import/batch/${batchId}`);
    return response.data;
  },

  // Rollback an import batch
  rollback: async (batchId) => {
    const response = await client.post(`/import/rollback/${batchId}`);
    return response.data;
  },
};
