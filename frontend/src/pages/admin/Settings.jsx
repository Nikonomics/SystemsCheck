import { useState, useEffect } from 'react';
import { organizationApi } from '../../api/organization';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'export', name: 'Data Export' },
    { id: 'audit', name: 'Audit Log' },
  ];

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    // Placeholder - would fetch from an audit log endpoint
    // For now, simulate some sample data
    setTimeout(() => {
      setAuditLogs([
        { id: 1, action: 'User Created', user: 'admin@cascadia.com', target: 'john.doe@cascadia.com', timestamp: new Date().toISOString() },
        { id: 2, action: 'Scorecard Submitted', user: 'clinician@cascadia.com', target: 'Cascadia SNF - Portland', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, action: 'Facility Updated', user: 'admin@cascadia.com', target: 'Cascadia SNF - Seattle', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, action: 'Team Created', user: 'admin@cascadia.com', target: 'Oregon Region', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { id: 5, action: 'Password Reset', user: 'admin@cascadia.com', target: 'nurse.jane@cascadia.com', timestamp: new Date(Date.now() - 172800000).toISOString() },
      ]);
      setLogsLoading(false);
    }, 500);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      const data = await organizationApi.exportScorecards();

      // Convert to CSV
      if (data.scorecards && data.scorecards.length > 0) {
        const headers = [
          'Facility',
          'Date',
          'Submitted By',
          'ADL',
          'Behavior',
          'Continence',
          'Infection',
          'Medication',
          'Nutrition',
          'Skin',
          'Discharge',
          'Overall Score',
        ];

        const rows = data.scorecards.map((sc) => [
          sc.facilityName,
          new Date(sc.scorecardDate).toLocaleDateString(),
          sc.submittedBy,
          sc.adlScore,
          sc.behaviorScore,
          sc.continenceScore,
          sc.infectionScore,
          sc.medicationScore,
          sc.nutritionScore,
          sc.skinScore,
          sc.dischargeScore,
          sc.overallScore,
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `scorecards-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      } else {
        setExportError('No scorecards found to export');
      }
    } catch (err) {
      setExportError(err.response?.data?.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage system settings and view audit logs
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
          </div>
          <div className="px-6 py-8">
            <div className="text-center text-gray-500">
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Application Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                System configuration options will be available here in a future update.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Export Tab */}
      {activeTab === 'export' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Data Export</h2>
          </div>
          <div className="px-6 py-6 space-y-6">
            {/* Scorecards Export */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Export All Scorecards</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Download a CSV file containing all scorecard data across all facilities.
                  Includes scores for all 8 clinical systems and submission metadata.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </>
                )}
              </button>
            </div>

            {exportError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {exportError}
              </div>
            )}

            {exportSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                Export completed successfully. Check your downloads folder.
              </div>
            )}

            {/* Future exports placeholder */}
            <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-500">Additional Export Options</h3>
              <p className="mt-1 text-sm text-gray-400">
                User data export, facility reports, and custom date range exports will be available in future updates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Audit Log</h2>
            <button
              onClick={fetchAuditLogs}
              disabled={logsLoading}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Refresh
            </button>
          </div>

          {logsLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading audit logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.action.includes('Created') ? 'bg-green-100 text-green-800' :
                          log.action.includes('Updated') ? 'bg-blue-100 text-blue-800' :
                          log.action.includes('Deleted') ? 'bg-red-100 text-red-800' :
                          log.action.includes('Reset') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {auditLogs.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-500">
                  No audit log entries found
                </div>
              )}
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing recent system activity. Full audit log history with filtering will be available in a future update.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
