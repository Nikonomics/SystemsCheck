import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { importApi } from '../../api/import';
import { parseExcelFile, downloadTemplate } from '../../utils/excelUtils';

const STEPS = ['upload', 'validate', 'confirm', 'import'];

export function HistoricalImport() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.xlsx?$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);

    try {
      setLoading(true);
      const data = await parseExcelFile(selectedFile);
      if (data.length === 0) {
        setError('No data found in the file');
        return;
      }
      setParsedData(data);

      // Validate the data
      const results = await importApi.validate(data);
      setValidationResults(results);
      setCurrentStep('validate');
    } catch (err) {
      setError(err.message || 'Failed to parse file');
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

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
    if (validationResults?.valid > 0) {
      setCurrentStep('confirm');
    }
  };

  // Perform import
  const handleImport = async () => {
    const validRows = validationResults.rows.filter((r) => r.isValid);
    const validData = validRows.map((r) => {
      const original = parsedData[r.row - 1];
      return original;
    });

    try {
      setLoading(true);
      setCurrentStep('import');
      const results = await importApi.importHistorical(validData);
      setImportResults(results);
    } catch (err) {
      setError(err.message || 'Import failed');
      setCurrentStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  // Reset and start over
  const handleReset = () => {
    setCurrentStep('upload');
    setFile(null);
    setParsedData([]);
    setValidationResults(null);
    setImportResults(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historical Data Import</h1>
        <p className="mt-1 text-sm text-gray-500">
          Import scorecard data from previous months before system launch
        </p>
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Excel File</h2>

          {/* Download Template Button */}
          <div className="mb-6">
            <button
              onClick={handleDownloadTemplate}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Template
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Download the Excel template with correct column format and facility list
            </p>
          </div>

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
                <p className="mt-4 text-sm text-gray-600">Processing file...</p>
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
                  Drag and drop your Excel file here, or{' '}
                  <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFile(e.target.files[0])}
                    />
                  </label>
                </p>
                <p className="mt-2 text-xs text-gray-500">Excel files only (.xlsx, .xls)</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Validate */}
      {currentStep === 'validate' && validationResults && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Validation Results</h2>
            <p className="mt-1 text-sm text-gray-500">
              {validationResults.valid} of {validationResults.total} rows are valid
            </p>
          </div>

          {/* Summary */}
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

          {/* Results Table */}
          <div className="max-h-96 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Row
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Facility
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationResults.rows.map((row) => (
                  <tr
                    key={row.row}
                    className={row.isValid ? 'bg-green-50' : 'bg-red-50'}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">{row.row}</td>
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Invalid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.facilityName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {row.month}/{row.year}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.totalScore}</td>
                    <td className="px-4 py-3 text-sm text-red-600">
                      {row.errors.join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
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
              </p>
            </div>

            {/* Preview of valid rows */}
            <h4 className="font-medium text-gray-900 mb-3">Scorecards to Import:</h4>
            <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Facility
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Period
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {validationResults.rows
                    .filter((r) => r.isValid)
                    .map((row) => (
                      <tr key={row.row}>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.facilityName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {row.month}/{row.year}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.totalScore}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
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
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
                </div>
              </div>
            ) : importResults ? (
              <div className="text-center">
                {importResults.success > 0 ? (
                  <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Import Complete</h3>
                    <p className="mt-2 text-gray-600">
                      Successfully imported {importResults.success} scorecards
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                      <svg
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Import Failed</h3>
                  </>
                )}

                {importResults.failed > 0 && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium text-red-800">
                      {importResults.failed} rows failed to import:
                    </p>
                    <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                      {importResults.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>
                          Row {err.row}: {err.error}
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
    </div>
  );
}

export default HistoricalImport;
