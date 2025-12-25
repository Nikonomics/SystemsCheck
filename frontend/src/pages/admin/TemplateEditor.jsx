import { useState, useEffect } from 'react';
import { templateApi } from '../../api/template';
import { ChevronDown, ChevronRight, Save, AlertTriangle, Check } from 'lucide-react';

export default function TemplateEditor() {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSystems, setExpandedSystems] = useState({});
  const [editedItems, setEditedItems] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    fetchTemplate();
    fetchDraftCount();
  }, []);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateApi.getTemplate();
      setTemplate(data.template);
      // Sort systems by system number
      if (data.template?.systems) {
        data.template.systems.sort((a, b) => a.systemNumber - b.systemNumber);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const fetchDraftCount = async () => {
    try {
      const data = await templateApi.getDraftCount();
      setDraftCount(data.draftCount);
    } catch (err) {
      console.error('Failed to fetch draft count:', err);
    }
  };

  const toggleSystem = (systemId) => {
    setExpandedSystems(prev => ({
      ...prev,
      [systemId]: !prev[systemId]
    }));
  };

  const handleItemChange = (itemId, field, value) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const getItemValue = (item, field) => {
    if (editedItems[item.id] && editedItems[item.id][field] !== undefined) {
      return editedItems[item.id][field];
    }
    return item[field];
  };

  const hasChanges = (itemId) => {
    return editedItems[itemId] && Object.keys(editedItems[itemId]).length > 0;
  };

  const saveSystem = async (system) => {
    const changedItems = system.items
      .filter(item => hasChanges(item.id))
      .map(item => ({
        id: item.id,
        itemNumber: item.itemNumber,
        ...editedItems[item.id]
      }));

    if (changedItems.length === 0) {
      return;
    }

    setSaving(true);
    setSaveSuccess(null);

    try {
      await templateApi.updateSystemItems(system.id, changedItems);

      // Clear edited items for this system
      const newEditedItems = { ...editedItems };
      system.items.forEach(item => {
        delete newEditedItems[item.id];
      });
      setEditedItems(newEditedItems);

      // Refresh template
      await fetchTemplate();
      await fetchDraftCount();

      setSaveSuccess(`System ${system.systemNumber} saved successfully${draftCount > 0 ? `. Updated ${draftCount} draft scorecard(s).` : ''}`);
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const countSystemChanges = (system) => {
    return system.items.filter(item => hasChanges(item.id)).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800">Error Loading Template</h3>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={fetchTemplate}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Template Editor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Edit the master audit criteria template. Changes will apply to all new audits
            {draftCount > 0 && ` and ${draftCount} existing draft scorecard(s)`}.
          </p>
        </div>
        {draftCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">{draftCount} draft scorecard(s) will be updated</span>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{saveSuccess}</span>
        </div>
      )}

      {/* Error Message */}
      {error && template && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Systems List */}
      <div className="space-y-4">
        {template?.systems?.map(system => (
          <div key={system.id} className="bg-white shadow rounded-lg overflow-hidden">
            {/* System Header */}
            <div
              className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSystem(system.id)}
            >
              <div className="flex items-center gap-3">
                {expandedSystems[system.id] ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    System {system.systemNumber}: {system.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {system.items?.length || 0} items | {system.maxPoints} max points
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {countSystemChanges(system) > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {countSystemChanges(system)} unsaved change(s)
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveSystem(system);
                  }}
                  disabled={saving || countSystemChanges(system) === 0}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save System
                </button>
              </div>
            </div>

            {/* System Items */}
            {expandedSystems[system.id] && (
              <div className="divide-y divide-gray-200">
                {system.items?.sort((a, b) => a.sortOrder - b.sortOrder).map(item => (
                  <div
                    key={item.id}
                    className={`px-6 py-4 ${hasChanges(item.id) ? 'bg-yellow-50' : ''}`}
                  >
                    <div className="grid grid-cols-12 gap-4">
                      {/* Item Number */}
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Item #</label>
                        <div className="text-lg font-semibold text-gray-900">{item.itemNumber}</div>
                      </div>

                      {/* Criteria Text */}
                      <div className="col-span-7">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Criteria Text</label>
                        <textarea
                          value={getItemValue(item, 'text')}
                          onChange={(e) => handleItemChange(item.id, 'text', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Max Points */}
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Max Pts</label>
                        <input
                          type="number"
                          value={getItemValue(item, 'maxPoints')}
                          onChange={(e) => handleItemChange(item.id, 'maxPoints', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Sample Size */}
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sample</label>
                        <input
                          type="number"
                          value={getItemValue(item, 'sampleSize')}
                          onChange={(e) => handleItemChange(item.id, 'sampleSize', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Input Type */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                        <select
                          value={getItemValue(item, 'inputType')}
                          onChange={(e) => handleItemChange(item.id, 'inputType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="sample">Sample (0-3)</option>
                          <option value="binary">Binary (Y/N)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Template Info */}
      {template && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
          <p>
            Template: <span className="font-medium text-gray-700">{template.name}</span> |
            Last updated: <span className="font-medium text-gray-700">
              {new Date(template.updatedAt).toLocaleString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
