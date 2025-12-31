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

  // ============================================================================
  // KEV HISTORICAL IMPORT (Cover Sheet Only)
  // ============================================================================

  // Validate KEV Excel files for cover sheet data extraction
  validateKevHistorical: async (formData) => {
    const response = await client.post('/import/kev-historical/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Import KEV historical cover sheet data
  importKevHistorical: async (formData, onProgress) => {
    const response = await client.post('/import/kev-historical', formData, {
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

  // Rollback a KEV historical import batch
  rollbackKevHistorical: async (batchId) => {
    const response = await client.post(`/import/kev-historical/rollback/${batchId}`);
    return response.data;
  },

  // Get KEV historical data for trending
  getKevHistorical: async (params = {}) => {
    const response = await client.get('/import/kev-historical', { params });
    return response.data;
  },

  // Get summary of KEV historical data by facility
  getKevHistoricalSummary: async () => {
    const response = await client.get('/import/kev-historical/summary');
    return response.data;
  },

  // Get KEV historical data for a specific facility
  getKevHistoricalByFacility: async (facilityId) => {
    const response = await client.get(`/import/kev-historical/facility/${facilityId}`);
    return response.data;
  },

  // Download a KEV historical file
  downloadKevHistoricalFile: async (id) => {
    const response = await client.get(`/import/kev-historical/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // Delete a single KEV historical record
  deleteKevHistorical: async (id) => {
    const response = await client.delete(`/import/kev-historical/${id}`);
    return response.data;
  },
};
