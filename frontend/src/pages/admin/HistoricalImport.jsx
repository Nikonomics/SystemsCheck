import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { importApi } from '../../api/import';
import { parseExcelFile, downloadTemplate } from '../../utils/excelUtils';
import { parseMultipleFilesAuto } from '../../utils/scorecardParser';
import { KevHistoricalImport } from './KevHistoricalImport';

const STEPS = ['upload', 'validate', 'confirm', 'import'];

const IMPORT_TABS = [
  { id: 'snf', label: 'SNF Scorecards', description: 'Clinical Systems Review (7 systems, 700 points)' },
  { id: 'kev', label: 'KEV Scorecards', description: 'KEV Historical (4 categories, cover sheet only)' }
];

export function HistoricalImport() {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('snf');

  // Mode: 'summary' for system-level scores, 'full' for item-level data
  const [importMode, setImportMode] = useState('full');

  const [currentStep, setCurrentStep] = useState('upload');
  const [files, setFiles] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear());

  // Date overrides for files that need manual input
  const [dateOverrides, setDateOverrides] = useState({});

  // Import history
  const [importHistory, setImportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load import history on mount
  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      const { batches } = await importApi.getHistory();
      setImportHistory(batches || []);
    } catch (err) {
      console.error('Failed to load import history:', err);
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

  // Re-validate with date overrides
  const revalidateWithOverrides = async () => {
    if (!files.length) return;

    try {
      setLoading(true);
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('year', defaultYear);
      formData.append('dateOverrides', JSON.stringify(dateOverrides));

      const results = await importApi.validateFull(formData);
      setValidationResults(results);
    } catch (err) {
      setError(err.message || 'Failed to revalidate');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection - supports multiple files for full mode
  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);

    // Validate file types
    const validFiles = fileArray.filter(f =>
      f.name.match(/\.xlsx?$/i) ||
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel'
    );

    if (validFiles.length === 0) {
      setError('Please upload Excel files (.xlsx or .xls)');
      return;
    }

    if (validFiles.length !== fileArray.length) {
      setError(`${fileArray.length - validFiles.length} non-Excel files were ignored`);
    }

    setFiles(validFiles);
    setError(null);
    setDateOverrides({}); // Reset overrides for new files

    try {
      setLoading(true);

      if (importMode === 'full') {
        // Full item-level import - parse locally first for preview (auto-detects format)
        const parsed = await parseMultipleFilesAuto(validFiles, { year: defaultYear });
        setParsedData(parsed);

        // Validate with server
        const formData = new FormData();
        validFiles.forEach(f => formData.append('files', f));
        formData.append('year', defaultYear);
        formData.append('dateOverrides', JSON.stringify({}));

        const results = await importApi.validateFull(formData);
        setValidationResults(results);
      } else {
        // Summary import (existing behavior - single file)
        if (validFiles.length > 1) {
          setError('Summary import only supports one file at a time');
          return;
        }
        const data = await parseExcelFile(validFiles[0]);
        if (data.length === 0) {
          setError('No data found in the file');
          return;
        }
        setParsedData(data);
        const results = await importApi.validate(data);
        setValidationResults(results);
      }

      setCurrentStep('validate');
    } catch (err) {
      setError(err.message || 'Failed to parse file(s)');
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
  }, [importMode, defaultYear]);

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const templateData = await importApi.getTemplate();
      downloadTemplate(templateData);
    } catch (err) {
      setError('Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  // Proceed to confirm step
  const handleProceedToConfirm = () => {
    const validCount = importMode === 'full'
      ? validationResults?.valid
      : validationResults?.valid;
    if (validCount > 0) {
      setCurrentStep('confirm');
    }
  };

  // Perform import
  const handleImport = async () => {
    try {
      setLoading(true);
      setCurrentStep('import');

      if (importMode === 'full') {
        // Full item-level import
        const formData = new FormData();

        // Only include valid files
        const validFilenames = validationResults.results
          .filter(r => r.isValid)
          .map(r => r.filename);

        files.filter(f => validFilenames.includes(f.name))
          .forEach(f => formData.append('files', f));
        formData.append('year', defaultYear);
        formData.append('dateOverrides', JSON.stringify(dateOverrides));

        const results = await importApi.importFull(formData);
        setImportResults(results);
        loadImportHistory(); // Refresh history
      } else {
        // Summary import
        const validRows = validationResults.rows.filter((r) => r.isValid);
        const validData = validRows.map((r) => parsedData[r.row - 1]);
        const results = await importApi.importHistorical(validData);
        setImportResults(results);
      }
    } catch (err) {
      setError(err.message || 'Import failed');
      setCurrentStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  // Rollback a batch
  const handleRollback = async (batchId) => {
    if (!confirm('Are you sure you want to rollback this import? All imported scorecards will be deleted.')) {
      return;
    }

    try {
      setLoading(true);
      await importApi.rollback(batchId);
      loadImportHistory();
    } catch (err) {
      setError('Failed to rollback: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset and start over
  const handleReset = () => {
    setCurrentStep('upload');
    setFiles([]);
    setParsedData([]);
    setValidationResults(null);
    setImportResults(null);
    setError(null);
    setDateOverrides({});
  };

  // Format date for display
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historical Data Import</h1>
          <p className="mt-1 text-sm text-gray-500">
            Import scorecard data from previous months
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {showHistory ? 'Hide History' : 'Import History'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {IMPORT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); handleReset(); }}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div>{tab.label}</div>
                <div className="text-xs font-normal text-gray-400 mt-0.5">{tab.description}</div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* KEV Import Tab */}
      {activeTab === 'kev' && (
        <KevHistoricalImport />
      )}

      {/* SNF Import Tab */}
      {activeTab === 'snf' && (
        <>
      {/* Import History Panel */}
      {showHistory && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Import History</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-auto">
            {importHistory.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                No import history
              </div>
            ) : (
              importHistory.map(batch => (
                <div key={batch.batchId} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">
                      {batch.totalFiles} files - {batch.importType}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(batch.createdAt)} by {batch.createdBy?.firstName} {batch.createdBy?.lastName}
                    </div>
                    <div className="text-sm">
                      <span className="text-green-600">{batch.successCount} imported</span>
                      {batch.failedCount > 0 && (
                        <span className="text-red-600 ml-2">{batch.failedCount} failed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                      batch.status === 'rolled_back' ? 'bg-gray-100 text-gray-800' :
                      batch.status === 'completed_with_errors' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {batch.status.replace(/_/g, ' ')}
                    </span>
                    {batch.status !== 'rolled_back' && (
                      <button
                        onClick={() => handleRollback(batch.batchId)}
                        className="text-sm text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        Rollback
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Import Mode Toggle */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Import Mode:</span>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => { setImportMode('full'); handleReset(); }}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                importMode === 'full'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Full Item Data
            </button>
            <button
              onClick={() => { setImportMode('summary'); handleReset(); }}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                importMode === 'summary'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Summary Scores Only
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {importMode === 'full'
              ? 'Import complete item-level data (chartsMet, sampleSize, notes) from multi-sheet Excel files'
              : 'Import just system scores from a simple spreadsheet'
            }
          </span>
        </div>

        {importMode === 'full' && (
          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Default Year:</label>
            <input
              type="number"
              value={defaultYear}
              onChange={(e) => setDefaultYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              min="2000"
              max={new Date().getFullYear()}
            />
            <span className="text-xs text-gray-500">
              Used when year is not found in the file
            </span>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                STEPS.indexOf(currentStep) >= index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`ml-2 text-sm ${
                STEPS.indexOf(currentStep) >= index ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-4 ${
                  STEPS.indexOf(currentStep) > index ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Step 1: Upload */}
      {currentStep === 'upload' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Upload Excel {importMode === 'full' ? 'Files' : 'File'}
          </h2>

          {importMode === 'summary' && (
            <div className="mb-6">
              <button
                onClick={handleDownloadTemplate}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Template
              </button>
              <p className="mt-2 text-sm text-gray-500">
                Download the Excel template with correct column format
              </p>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600">Processing file(s)...</p>
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-4 text-sm text-gray-600">
                  Drag and drop your Excel file{importMode === 'full' ? '(s)' : ''} here, or{' '}
                  <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      multiple={importMode === 'full'}
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </label>
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {importMode === 'full'
                    ? 'Upload multiple Excel files with full audit data (one per facility per month)'
                    : 'Excel files only (.xlsx, .xls)'
                  }
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Validate - Full Mode */}
      {currentStep === 'validate' && validationResults && importMode === 'full' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Validation Results</h2>
            <p className="mt-1 text-sm text-gray-500">
              {validationResults.valid} of {validationResults.total} files are valid
              {validationResults.needsDateOverride > 0 && (
                <span className="text-amber-600 ml-2">
                  ({validationResults.needsDateOverride} need date info)
                </span>
              )}
            </p>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Valid: {validationResults.valid}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Invalid: {validationResults.invalid}</span>
              </div>
              {Object.keys(dateOverrides).length > 0 && (
                <button
                  onClick={revalidateWithOverrides}
                  disabled={loading}
                  className="ml-auto px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Revalidating...' : 'Apply Date Overrides'}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[32rem] overflow-auto">
            <div className="divide-y divide-gray-200">
              {validationResults.results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-4 ${result.isValid ? 'bg-green-50' : result.needsDateOverride ? 'bg-amber-50' : 'bg-red-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.filename}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.matchedFacility || result.facilityName || 'Unknown facility'}
                        {result.matchScore && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({(result.matchScore * 100).toFixed(0)}% match)
                          </span>
                        )}
                      </div>

                      {/* Date display or edit */}
                      <div className="mt-2 flex items-center gap-2">
                        {result.needsDateOverride || !result.isValid ? (
                          <>
                            <label className="text-xs text-gray-500">Month:</label>
                            <select
                              value={dateOverrides[result.filename]?.month || result.month || ''}
                              onChange={(e) => handleDateOverride(result.filename, 'month', e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="">--</option>
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <label className="text-xs text-gray-500 ml-2">Year:</label>
                            <input
                              type="number"
                              value={dateOverrides[result.filename]?.year || result.year || ''}
                              onChange={(e) => handleDateOverride(result.filename, 'year', e.target.value)}
                              placeholder="2025"
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              min="2020"
                              max="2030"
                            />
                            {result.dateInferred && (
                              <span className="text-xs text-amber-600">(year inferred)</span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-700">
                            {result.month}/{result.year}
                            {result.dateSource === 'filename' && (
                              <span className="text-xs text-gray-400 ml-1">(from filename)</span>
                            )}
                            {result.dateInferred && (
                              <span className="text-xs text-amber-500 ml-1">(year inferred)</span>
                            )}
                          </span>
                        )}
                      </div>

                      {result.totalScore !== undefined && (
                        <div className="text-sm text-gray-500 mt-1">
                          Score: {result.totalScore?.toFixed(1)} / {result.totalMaxPoints} ({result.scorePercentage}%)
                          <span className="text-xs text-gray-400 ml-2">
                            Format: {result.format}{result.kevType ? ` (${result.kevType})` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      result.isValid ? 'bg-green-100 text-green-800' :
                      result.needsDateOverride ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.isValid ? 'Valid' : result.needsDateOverride ? 'Needs Date' : 'Invalid'}
                    </span>
                  </div>

                  {/* System/Category breakdown */}
                  {result.systems && result.systems.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 md:grid-cols-7 gap-2">
                      {result.systems.map(sys => (
                        <div key={sys.systemNumber} className="text-center bg-white/50 rounded p-1">
                          <div className="text-xs text-gray-500 truncate" title={sys.systemName}>
                            {result.format === 'kev' ? sys.systemName.substring(0, 8) : `S${sys.systemNumber}`}
                          </div>
                          <div className="text-sm font-medium">
                            {sys.totalPointsEarned?.toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Errors */}
                  {result.errors?.length > 0 && (
                    <div className="mt-2">
                      {result.errors.map((err, i) => (
                        <div key={i} className="text-sm text-red-600">• {err}</div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings?.length > 0 && (
                    <div className="mt-2">
                      {result.warnings.map((warn, i) => (
                        <div key={i} className="text-sm text-amber-600">⚠ {warn}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Upload Different Files
            </button>
            <div className="flex gap-2">
              {validationResults.needsDateOverride > 0 && Object.keys(dateOverrides).length > 0 && (
                <button
                  onClick={revalidateWithOverrides}
                  disabled={loading}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
                >
                  Revalidate
                </button>
              )}
              <button
                onClick={handleProceedToConfirm}
                disabled={validationResults.valid === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue with {validationResults.valid} Valid Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Validate - Summary Mode (existing) */}
      {currentStep === 'validate' && validationResults && importMode === 'summary' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Validation Results</h2>
            <p className="mt-1 text-sm text-gray-500">
              {validationResults.valid} of {validationResults.total} rows are valid
            </p>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Valid: {validationResults.valid}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Invalid: {validationResults.invalid}</span>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationResults.rows.map((row) => (
                  <tr key={row.row} className={row.isValid ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.row}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        row.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {row.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.facilityName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.month}/{row.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.totalScore}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{row.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Upload Different File
            </button>
            <button
              onClick={handleProceedToConfirm}
              disabled={validationResults.valid === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with {validationResults.valid} Valid Rows
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {currentStep === 'confirm' && validationResults && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Confirm Import</h2>
          </div>

          <div className="px-6 py-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900">
                {validationResults.valid} scorecards will be imported
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                These scorecards will be created with &quot;hard_close&quot; status and cannot be edited.
                {importMode === 'full' && ' Full item-level data will be preserved.'}
              </p>
            </div>

            <h4 className="font-medium text-gray-900 mb-3">Scorecards to Import:</h4>
            <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {importMode === 'full' ? 'File' : 'Facility'}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {importMode === 'full' ? 'Facility' : 'Period'}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {importMode === 'full' ? 'Period' : 'Total Score'}
                    </th>
                    {importMode === 'full' && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Score
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importMode === 'full' ? (
                    validationResults.results
                      .filter((r) => r.isValid)
                      .map((result, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{result.filename}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{result.matchedFacility}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {result.month}/{result.year || defaultYear}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {result.totalScore?.toFixed(1)}
                          </td>
                        </tr>
                      ))
                  ) : (
                    validationResults.rows
                      .filter((r) => r.isValid)
                      .map((row) => (
                        <tr key={row.row}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.facilityName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.month}/{row.year}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.totalScore}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setCurrentStep('validate')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Scorecards'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Import Complete */}
      {currentStep === 'import' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Import Results</h2>
          </div>

          <div className="px-6 py-8">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Importing scorecards...</p>
              </div>
            ) : importResults ? (
              <div className="text-center">
                {importResults.success > 0 ? (
                  <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Import Complete</h3>
                    <p className="mt-2 text-gray-600">
                      Successfully imported {importResults.success} scorecards
                    </p>
                    {importResults.batchId && (
                      <p className="mt-1 text-sm text-gray-500">
                        Batch ID: {importResults.batchId}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Import Failed</h3>
                  </>
                )}

                {importResults.failed > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium text-red-800">
                      {importResults.failed} {importMode === 'full' ? 'files' : 'rows'} failed to import:
                    </p>
                    <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                      {importResults.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>
                          {err.filename || `Row ${err.row}`}: {err.error}
                        </li>
                      ))}
                      {importResults.errors.length > 10 && (
                        <li>...and {importResults.errors.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Import More
                  </button>
                  <button
                    onClick={() => navigate('/facilities')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    View Facilities
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default HistoricalImport;
