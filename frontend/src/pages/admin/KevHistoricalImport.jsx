import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { importApi } from '../../api/import';

const STEPS = ['upload', 'validate', 'confirm', 'import'];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function KevHistoricalImport() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState('upload');
  const [files, setFiles] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Date overrides for files that need manual input
  const [dateOverrides, setDateOverrides] = useState({});

  // Facility overrides for files that need manual facility selection
  const [facilityOverrides, setFacilityOverrides] = useState({});

  // Selected files (checkboxes) - null means all valid files are selected
  const [selectedFiles, setSelectedFiles] = useState({});

  // Available facilities for dropdown
  const [facilities, setFacilities] = useState([]);

  // Import history
  const [importHistory, setImportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Summary data
  const [kevSummary, setKevSummary] = useState([]);

  // Load import history and summary on mount
  useEffect(() => {
    loadImportHistory();
    loadKevSummary();
  }, []);

  const loadImportHistory = async () => {
    try {
      const { batches } = await importApi.getHistory();
      // Filter to only KEV historical batches
      setImportHistory((batches || []).filter(b => b.importType === 'kev_historical'));
    } catch (err) {
      console.error('Failed to load import history:', err);
    }
  };

  const loadKevSummary = async () => {
    try {
      const { data } = await importApi.getKevHistoricalSummary();
      setKevSummary(data || []);
    } catch (err) {
      console.error('Failed to load KEV summary:', err);
    }
  };

  // Handle date override changes
  const handleDateOverride = (filename, field, value) => {
    setDateOverrides(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        [field]: value ? parseInt(value) : null
      }
    }));
  };

  // Handle facility override changes
  const handleFacilityOverride = (filename, facilityId) => {
    if (!facilityId) {
      // Remove override if cleared
      setFacilityOverrides(prev => {
        const newOverrides = { ...prev };
        delete newOverrides[filename];
        return newOverrides;
      });
    } else {
      const facility = facilities.find(f => f.id === parseInt(facilityId));
      setFacilityOverrides(prev => ({
        ...prev,
        [filename]: { id: parseInt(facilityId), name: facility?.name || '' }
      }));
    }
  };

  // Handle file selection toggle
  const handleFileToggle = (filename) => {
    setSelectedFiles(prev => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  // Toggle all files
  const handleToggleAll = (checked) => {
    if (!validationResults?.results) return;
    const newSelected = {};
    validationResults.results.forEach(r => {
      // Only allow selecting files that are valid or could be made valid with overrides
      if (r.isValid || r.needsFacility || r.needsDateOverride) {
        newSelected[r.filename] = checked;
      }
    });
    setSelectedFiles(newSelected);
  };

  // Re-validate with overrides
  const revalidateWithOverrides = async () => {
    if (!files.length) return;

    try {
      setLoading(true);
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('dateOverrides', JSON.stringify(dateOverrides));
      formData.append('facilityOverrides', JSON.stringify(facilityOverrides));

      const results = await importApi.validateKevHistorical(formData);
      setValidationResults(results);

      // Update facilities list from response
      if (results.facilities) {
        setFacilities(results.facilities);
      }

      // Initialize selected state for newly valid files
      const newSelected = { ...selectedFiles };
      results.results.forEach(r => {
        if (r.isValid && newSelected[r.filename] === undefined) {
          newSelected[r.filename] = true;
        }
      });
      setSelectedFiles(newSelected);
    } catch (err) {
      setError(err.message || 'Failed to revalidate');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFiles = async (uploadedFiles) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const fileArray = Array.from(uploadedFiles);

    // Validate file types
    const validFiles = fileArray.filter(f =>
      f.name.match(/\.(xlsx|xlsm)$/i) ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel.sheet.macroEnabled.12'
    );

    if (validFiles.length === 0) {
      setError('Please upload Excel files (.xlsx or .xlsm)');
      return;
    }

    if (validFiles.length !== fileArray.length) {
      setError(`${fileArray.length - validFiles.length} non-Excel files were ignored`);
    }

    setFiles(validFiles);
    setError(null);
    setDateOverrides({});
    setFacilityOverrides({});
    setSelectedFiles({});

    try {
      setLoading(true);

      // Validate with server
      const formData = new FormData();
      validFiles.forEach(f => formData.append('files', f));
      formData.append('dateOverrides', JSON.stringify({}));
      formData.append('facilityOverrides', JSON.stringify({}));

      const results = await importApi.validateKevHistorical(formData);
      setValidationResults(results);

      // Store facilities list for dropdown
      if (results.facilities) {
        setFacilities(results.facilities);
      }

      // Initialize selected state - all valid files are selected by default
      const initialSelected = {};
      results.results.forEach(r => {
        initialSelected[r.filename] = r.isValid;
      });
      setSelectedFiles(initialSelected);

      setCurrentStep('validate');
    } catch (err) {
      setError(err.message || 'Failed to validate files');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  // Get selected and valid file count
  const getSelectedValidFiles = () => {
    if (!validationResults?.results) return [];
    return validationResults.results.filter(r => r.isValid && selectedFiles[r.filename]);
  };

  // Import files
  const handleImport = async () => {
    if (!files.length) return;

    const selectedValidFiles = getSelectedValidFiles();
    if (selectedValidFiles.length === 0) {
      setError('No files selected for import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Only send selected files
      const selectedFilenames = selectedValidFiles.map(f => f.filename);
      const filesToSend = files.filter(f => selectedFilenames.includes(f.name));

      const formData = new FormData();
      filesToSend.forEach(f => formData.append('files', f));
      formData.append('dateOverrides', JSON.stringify(dateOverrides));
      formData.append('facilityOverrides', JSON.stringify(facilityOverrides));
      formData.append('selectedFiles', JSON.stringify(selectedFilenames));

      const results = await importApi.importKevHistorical(formData);
      setImportResults(results);
      setCurrentStep('import');
      loadImportHistory();
      loadKevSummary();
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  // Rollback an import batch
  const handleRollback = async (batchId) => {
    if (!window.confirm('Are you sure you want to rollback this import? All imported records will be deleted.')) {
      return;
    }

    try {
      await importApi.rollbackKevHistorical(batchId);
      loadImportHistory();
      loadKevSummary();
    } catch (err) {
      setError(err.message || 'Rollback failed');
    }
  };

  // Reset to start
  const handleReset = () => {
    setCurrentStep('upload');
    setFiles([]);
    setValidationResults(null);
    setImportResults(null);
    setError(null);
    setDateOverrides({});
    setFacilityOverrides({});
    setSelectedFiles({});
  };

  const validCount = validationResults?.valid || 0;
  const invalidCount = validationResults?.invalid || 0;
  const needsDateCount = validationResults?.needsDateOverride || 0;
  const needsFacilityCount = validationResults?.needsFacility || 0;
  const selectedValidCount = getSelectedValidFiles().length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KEV Historical Import</h1>
          <p className="text-gray-600 mt-1">
            Import historical KEV scorecard cover sheet data for trending analysis
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showHistory ? 'Hide History' : 'Show Import History'}
        </button>
      </div>

      {/* Summary Panel */}
      {kevSummary.length > 0 && (
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Imported KEV Data Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kevSummary.slice(0, 8).map(s => (
              <div key={s.facilityId} className="bg-white rounded p-2 text-sm">
                <div className="font-medium truncate" title={s.facilityName}>{s.facilityName}</div>
                <div className="text-gray-600">
                  {s.recordCount} records | Avg: {s.avgScore}%
                </div>
              </div>
            ))}
          </div>
          {kevSummary.length > 8 && (
            <div className="mt-2 text-sm text-blue-600">
              + {kevSummary.length - 8} more facilities
            </div>
          )}
        </div>
      )}

      {/* Import History Panel */}
      {showHistory && importHistory.length > 0 && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-3">Recent KEV Imports</h3>
          <div className="space-y-2">
            {importHistory.slice(0, 5).map(batch => (
              <div key={batch.id} className="flex items-center justify-between bg-white rounded p-3 text-sm">
                <div>
                  <span className="font-medium">{new Date(batch.createdAt).toLocaleDateString()}</span>
                  <span className="ml-2 text-gray-600">
                    {batch.successCount || 0} imported, {batch.failedCount || 0} failed
                  </span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                    batch.status === 'rolled_back' ? 'bg-gray-100 text-gray-600' :
                    batch.status === 'completed_with_errors' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {batch.status}
                  </span>
                </div>
                {batch.status !== 'rolled_back' && (
                  <button
                    onClick={() => handleRollback(batch.batchId)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Rollback
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-red-600 mr-2">!</span>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Step Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step ? 'bg-blue-600 text-white' :
                STEPS.indexOf(currentStep) > index ? 'bg-green-500 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {STEPS.indexOf(currentStep) > index ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm capitalize ${
                currentStep === step ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {step}
              </span>
              {index < STEPS.length - 1 && (
                <div className="w-16 h-0.5 mx-4 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div>
            <h2 className="text-lg font-medium mb-4">Upload KEV Scorecard Files</h2>
            <p className="text-gray-600 mb-4">
              Upload KEV Mini or KEV Hybrid scorecard files (.xlsx, .xlsm). Only cover sheet data
              (facility, date, quality area scores) will be extracted.
            </p>

            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept=".xlsx,.xlsm"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-gray-500 mb-2">
                  <span className="text-4xl">📁</span>
                </div>
                <p className="text-lg font-medium text-gray-700">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports multiple KEV scorecard files
                </p>
              </label>
            </div>

            {loading && (
              <div className="mt-4 text-center text-gray-600">
                <span className="inline-block animate-spin mr-2">⏳</span>
                Validating files...
              </div>
            )}
          </div>
        )}

        {/* Validate Step */}
        {currentStep === 'validate' && validationResults && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Validation Results</h2>
              <div className="text-sm">
                <span className="text-blue-600 font-medium">{selectedValidCount} selected</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="text-green-600 font-medium">{validCount} valid</span>
                {invalidCount > 0 && (
                  <span className="ml-3 text-red-600 font-medium">{invalidCount} invalid</span>
                )}
                {needsFacilityCount > 0 && (
                  <span className="ml-3 text-orange-600 font-medium">{needsFacilityCount} need facility</span>
                )}
              </div>
            </div>

            {/* Files needing facility or date - consolidated panel */}
            {(needsFacilityCount > 0 || needsDateCount > 0) && (
              <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                <h3 className="font-medium text-orange-800 mb-2">Files Needing Information</h3>
                <p className="text-sm text-orange-700 mb-3">
                  Assign facility and/or date information, then click "Apply Overrides" to revalidate.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {validationResults.results
                    .filter(r => r.needsFacility || r.needsDateOverride)
                    .map(r => (
                      <div key={r.filename} className="flex items-center gap-3 bg-white rounded p-2 flex-wrap">
                        <span className="flex-1 text-sm truncate min-w-[150px]" title={r.filename}>
                          {r.filename}
                        </span>
                        {r.needsFacility && (
                          <select
                            value={facilityOverrides[r.filename]?.id || ''}
                            onChange={(e) => handleFacilityOverride(r.filename, e.target.value)}
                            className="border rounded px-2 py-1 text-sm min-w-[180px]"
                          >
                            <option value="">Select Facility...</option>
                            {facilities.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        )}
                        {r.needsDateOverride && (
                          <>
                            <select
                              value={dateOverrides[r.filename]?.month || ''}
                              onChange={(e) => handleDateOverride(r.filename, 'month', e.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                            >
                              <option value="">Month</option>
                              {MONTH_NAMES.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Year"
                              min="2000"
                              max="2030"
                              value={dateOverrides[r.filename]?.year || ''}
                              onChange={(e) => handleDateOverride(r.filename, 'year', e.target.value)}
                              className="border rounded px-2 py-1 text-sm w-20"
                            />
                          </>
                        )}
                      </div>
                    ))}
                </div>
                <button
                  onClick={revalidateWithOverrides}
                  disabled={loading}
                  className="mt-3 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  {loading ? 'Revalidating...' : 'Apply Overrides'}
                </button>
              </div>
            )}

            {/* Results Table with Checkboxes */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedValidCount === validCount && validCount > 0}
                        onChange={(e) => handleToggleAll(e.target.checked)}
                        className="rounded border-gray-300"
                        title="Select/deselect all valid files"
                      />
                    </th>
                    <th className="px-3 py-2 text-left">File</th>
                    <th className="px-3 py-2 text-left">Format</th>
                    <th className="px-3 py-2 text-left">Facility</th>
                    <th className="px-3 py-2 text-left">Period</th>
                    <th className="px-3 py-2 text-left">Score</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {validationResults.results.map((r, i) => (
                    <tr key={i} className={
                      r.isValid
                        ? (selectedFiles[r.filename] ? 'bg-green-50' : 'bg-gray-50')
                        : 'bg-red-50'
                    }>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedFiles[r.filename]}
                          onChange={() => handleFileToggle(r.filename)}
                          disabled={!r.isValid}
                          className="rounded border-gray-300 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-3 py-2 max-w-[200px] truncate" title={r.filename}>
                        {r.filename}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{r.format || '-'}</td>
                      <td className="px-3 py-2">
                        {r.needsFacility ? (
                          <span className="text-orange-600 text-xs">Select facility above</span>
                        ) : (
                          <>
                            <div className="truncate max-w-[150px]" title={r.matchedFacility || r.facilityName}>
                              {r.matchedFacility || r.facilityName || '-'}
                            </div>
                            {r.matchScore && r.matchScore < 1 && r.matchScore > 0 && (
                              <span className="text-xs text-yellow-600">
                                ({Math.round(r.matchScore * 100)}% match)
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {r.month && r.year ? (
                          <span>
                            {MONTH_NAMES[r.month - 1]} {r.year}
                            {r.dateSource === 'manual' && (
                              <span className="ml-1 text-xs text-blue-600">(manual)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-orange-600 text-xs">Set date above</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {r.overallScore ? `${r.overallScore}%` :
                         r.totalMet && r.totalPossible ?
                         `${Math.round((r.totalMet / r.totalPossible) * 100)}%` : '-'}
                      </td>
                      <td className="px-3 py-2">
                        {r.isValid ? (
                          <span className="text-green-600 text-sm">Valid</span>
                        ) : (
                          <div>
                            <span className="text-red-600 text-sm">Invalid</span>
                            {r.errors?.length > 0 && (
                              <div className="text-xs text-red-500 mt-1 max-w-[150px]">
                                {r.errors.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handleReset}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
              >
                Start Over
              </button>
              <div className="flex items-center gap-4">
                {(Object.keys(facilityOverrides).length > 0 || Object.keys(dateOverrides).length > 0) && (
                  <button
                    onClick={revalidateWithOverrides}
                    disabled={loading}
                    className="px-4 py-2 border border-orange-600 text-orange-600 rounded hover:bg-orange-50 text-sm"
                  >
                    Revalidate
                  </button>
                )}
                <button
                  onClick={() => setCurrentStep('confirm')}
                  disabled={selectedValidCount === 0}
                  className={`px-6 py-2 rounded text-white ${
                    selectedValidCount > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Continue with {selectedValidCount} Selected File{selectedValidCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {currentStep === 'confirm' && validationResults && (
          <div>
            <h2 className="text-lg font-medium mb-4">Confirm Import</h2>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2">Import Summary</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>Files to import: <strong>{selectedValidCount}</strong></li>
                <li>Files skipped (invalid or not selected): <strong>{validationResults.total - selectedValidCount}</strong></li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-3">Files to Import</h3>
              <div className="max-h-64 overflow-y-auto border rounded">
                {getSelectedValidFiles().map((r, i) => (
                    <div key={i} className="px-4 py-2 border-b last:border-0 flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{r.matchedFacility || r.facilityName}</span>
                        <span className="ml-2 text-gray-600">
                          {MONTH_NAMES[r.month - 1]} {r.year}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{r.overallScore || Math.round((r.totalMet / r.totalPossible) * 100)}%</span>
                        <span className="ml-2 text-gray-500">({r.qualityAreas?.length || 0} categories)</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will import cover sheet data only (facility, date, auditor, category scores).
                Individual audit items will not be imported.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('validate')}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {loading ? 'Importing...' : `Import ${selectedValidCount} File${selectedValidCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {/* Import Complete Step */}
        {currentStep === 'import' && importResults && (
          <div>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">
                {importResults.failed === 0 ? '✅' : '⚠️'}
              </div>
              <h2 className="text-xl font-medium">
                {importResults.failed === 0 ? 'Import Complete!' : 'Import Completed with Errors'}
              </h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-gray-600">Imported Successfully</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
            </div>

            {importResults.errors?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2 text-red-700">Errors</h3>
                <div className="bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {importResults.errors.map((err, i) => (
                    <div key={i} className="text-sm text-red-600 mb-1">
                      <strong>{err.filename}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Import More Files
              </button>
              <button
                onClick={() => navigate('/facilities')}
                className="px-6 py-2 border rounded text-gray-600 hover:bg-gray-50"
              >
                View Facilities
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default KevHistoricalImport;
