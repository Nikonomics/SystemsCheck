import { useState, useEffect } from 'react';
import { importApi } from '../../api/import';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Colors for category lines in the trend chart
const CATEGORY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
];

const OVERALL_COLOR = '#1F2937'; // dark gray for overall

export function KevHistoricalPanel({ facilityId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (facilityId) {
      loadData();
    }
  }, [facilityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: records } = await importApi.getKevHistoricalByFacility(facilityId);
      setData(records || []);
    } catch (err) {
      setError(err.message || 'Failed to load KEV historical data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      const response = await importApi.downloadKevHistoricalFile(record.id);

      // Create blob URL and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = record.originalFilename || `KEV-${record.year}-${record.month}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete KEV scorecard for ${MONTH_NAMES[record.month - 1]} ${record.year}? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(record.id);
      await importApi.deleteKevHistorical(record.id);
      // Refresh data
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(null);
    }
  };

  // Get sorted data for trend (oldest to newest)
  const sortedForTrend = [...data].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Get unique category names across all records
  const categoryNames = [...new Set(
    data.flatMap(d => d.categories?.map(c => c.categoryName) || [])
  )].slice(0, 4);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">KEV Historical Scorecards</h3>
        <div className="text-gray-500 text-center py-4">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">KEV Historical Scorecards</h3>
        <div className="text-red-600 text-center py-4">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">KEV Historical Scorecards</h3>
        <div className="text-gray-500 text-center py-4">
          No historical KEV scorecards imported for this facility.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">KEV Historical Scorecards</h3>

      {/* Trend Chart - Show if more than 1 data point */}
      {sortedForTrend.length > 1 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Score Trends Over Time</h4>

          {/* Chart Area - Hybrid HTML/SVG approach */}
          <div className="flex">
            {/* Y-axis labels (HTML) */}
            <div className="flex flex-col justify-between pr-2 text-xs text-gray-500" style={{ height: '200px' }}>
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* Chart area */}
            <div className="flex-1 flex flex-col">
              {/* SVG for lines and dots only */}
              <div className="relative flex-1" style={{ height: '200px' }}>
                {/* Grid lines (HTML) */}
                <div className="absolute inset-0">
                  {[0, 25, 50, 75, 100].map(pct => (
                    <div
                      key={pct}
                      className="absolute w-full border-t border-gray-200"
                      style={{ top: `${100 - pct}%` }}
                    />
                  ))}
                </div>

                {/* SVG overlay for lines and dots */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {/* Overall score line */}
                  <polyline
                    fill="none"
                    stroke={OVERALL_COLOR}
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                    style={{ strokeWidth: '3px' }}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={sortedForTrend.map((d, i) => {
                      const x = sortedForTrend.length === 1 ? 50 : (i / (sortedForTrend.length - 1)) * 100;
                      const y = 100 - (d.overallScore || 0);
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Category lines */}
                  {categoryNames.map((catName, catIdx) => (
                    <polyline
                      key={catName}
                      fill="none"
                      stroke={CATEGORY_COLORS[catIdx]}
                      strokeWidth="0.3"
                      vectorEffect="non-scaling-stroke"
                      style={{ strokeWidth: '2px', strokeDasharray: '6,3' }}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={sortedForTrend.map((d, i) => {
                        const cat = d.categories?.find(c => c.categoryName === catName);
                        const x = sortedForTrend.length === 1 ? 50 : (i / (sortedForTrend.length - 1)) * 100;
                        const y = 100 - (cat?.percentage || 0);
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  ))}
                </svg>

                {/* Dots positioned with HTML for consistent sizing */}
                {sortedForTrend.map((d, i) => {
                  const leftPct = sortedForTrend.length === 1 ? 50 : (i / (sortedForTrend.length - 1)) * 100;
                  const topPct = 100 - (d.overallScore || 0);
                  return (
                    <div
                      key={`overall-dot-${i}`}
                      className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        backgroundColor: OVERALL_COLOR
                      }}
                      title={`${MONTH_NAMES[d.month - 1]} ${d.year}: ${d.overallScore}%`}
                    />
                  );
                })}

                {/* Category dots */}
                {categoryNames.map((catName, catIdx) => (
                  sortedForTrend.map((d, i) => {
                    const cat = d.categories?.find(c => c.categoryName === catName);
                    if (!cat) return null;
                    const leftPct = sortedForTrend.length === 1 ? 50 : (i / (sortedForTrend.length - 1)) * 100;
                    const topPct = 100 - cat.percentage;
                    return (
                      <div
                        key={`${catName}-dot-${i}`}
                        className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          backgroundColor: CATEGORY_COLORS[catIdx]
                        }}
                        title={`${cat.categoryName}: ${cat.percentage}%`}
                      />
                    );
                  })
                ))}
              </div>

              {/* X-axis labels (HTML) */}
              <div className="flex justify-between text-xs text-gray-500 pt-2">
                {sortedForTrend.map((d, i) => (
                  <span key={i} className="text-center">
                    {MONTH_NAMES[d.month - 1]} {String(d.year).slice(-2)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-0.5 rounded" style={{ backgroundColor: OVERALL_COLOR }} />
              <span className="font-medium">Overall</span>
            </div>
            {categoryNames.map((name, idx) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-5 h-0.5 rounded" style={{ backgroundColor: CATEGORY_COLORS[idx], backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, white 2px, white 4px)' }} />
                <span className="truncate max-w-[150px]" title={name}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Period</th>
              {categoryNames.map((name, idx) => (
                <th key={name} className="px-3 py-2 text-center font-medium" style={{ color: CATEGORY_COLORS[idx] }}>
                  <span className="truncate block max-w-[80px]" title={name}>
                    {name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 text-center font-medium text-gray-900">Overall</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">
                  {MONTH_NAMES[record.month - 1]} {record.year}
                </td>
                {categoryNames.map((catName, idx) => {
                  const cat = record.categories?.find(c => c.categoryName === catName);
                  return (
                    <td key={catName} className="px-3 py-2 text-center">
                      {cat ? (
                        <span className={`font-medium ${
                          cat.percentage >= 80 ? 'text-green-600' :
                          cat.percentage >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {cat.percentage}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center">
                  <span className={`font-bold ${
                    record.overallScore >= 80 ? 'text-green-600' :
                    record.overallScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {record.overallScore}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setExpanded(expanded === record.id ? null : record.id)}
                      className="text-gray-500 hover:text-gray-700 text-xs"
                    >
                      {expanded === record.id ? 'Hide' : 'Details'}
                    </button>
                    {record.filePath && (
                      <button
                        onClick={() => handleDownload(record)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(record)}
                      disabled={deleting === record.id}
                      className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
                    >
                      {deleting === record.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          {(() => {
            const record = data.find(r => r.id === expanded);
            if (!record) return null;
            return (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{MONTH_NAMES[record.month - 1]} {record.year} Details</h4>
                  <button
                    onClick={() => setExpanded(null)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Close
                  </button>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Format:</span>
                    <div className="font-medium">{record.format || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed By:</span>
                    <div className="font-medium">{record.auditCompletedBy || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Date Completed:</span>
                    <div className="font-medium">{record.dateOfCompletion || '-'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Score:</span>
                    <div className="font-medium">{record.totalMet} / {record.totalPossible}</div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Quality Areas</h5>
                  <div className="space-y-2">
                    {record.categories?.map((cat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-sm w-48 truncate" title={cat.categoryName}>
                          {cat.categoryName}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cat.percentage >= 80 ? 'bg-green-500' :
                              cat.percentage >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, cat.percentage)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {cat.percentage}%
                        </span>
                        <span className="text-sm text-gray-500 w-20 text-right">
                          {cat.metScore}/{cat.possibleScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default KevHistoricalPanel;
