import client from './client';

export const templateApi = {
  /**
   * Get the active audit template with all systems and items
   */
  getTemplate: async () => {
    const response = await client.get('/admin/template');
    return response.data;
  },

  /**
   * Update a template system (name, sections, maxPoints)
   */
  updateSystem: async (systemId, data) => {
    const response = await client.put(`/admin/template/systems/${systemId}`, data);
    return response.data;
  },

  /**
   * Update a template item (text, maxPoints, sampleSize, etc.)
   */
  updateItem: async (itemId, data) => {
    const response = await client.put(`/admin/template/items/${itemId}`, data);
    return response.data;
  },

  /**
   * Bulk update all items in a system
   */
  updateSystemItems: async (systemId, items) => {
    const response = await client.put(`/admin/template/systems/${systemId}/items`, { items });
    return response.data;
  },

  /**
   * Get count of draft scorecards that will be affected by changes
   */
  getDraftCount: async () => {
    const response = await client.get('/admin/template/draft-count');
    return response.data;
  },
};
