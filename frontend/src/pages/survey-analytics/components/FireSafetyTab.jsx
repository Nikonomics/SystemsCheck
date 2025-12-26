import { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  AlertCircle,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { getFireSafety } from '../../../api/cms';
import { SeverityBadge } from './SeverityBadge';

const TAG_FILTERS = [
  { value: 'all', label: 'All Tags' },
  { value: 'K', label: 'K-Tags (Life Safety)' },
  { value: 'E', label: 'E-Tags (Emergency Prep)' },
];

export function FireSafetyTab({ ccn }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tagFilter, setTagFilter] = useState('all');

  useEffect(() => {
    if (ccn) {
      loadFireSafety();
    }
  }, [ccn]);

  const loadFireSafety = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFireSafety(ccn);
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to load fire safety data');
      }
    } catch (err) {
      console.error('Error loading fire safety:', err);
      setError('Failed to load fire safety data');
    } finally {
      setLoading(false);
    }
  };

  // Filter deficiencies based on tag filter
  const filteredDeficiencies = useMemo(() => {
    if (!data?.deficiencies) return [];
    if (tagFilter === 'all') return data.deficiencies;
    return data.deficiencies.filter(d => d.prefix === tagFilter);
  }, [data?.deficiencies, tagFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Flame className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No fire safety data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { surveys, summary } = data;
  const lastSurvey = surveys?.[0];

  return (
    <div className="space-y-6">
      {/* Sprinkler Status Banner */}
      <SprinklerStatusBanner />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Last Fire Safety Survey"
          value={formatDate(lastSurvey?.date)}
          subtitle={lastSurvey ? `${lastSurvey.deficiencyCount} deficiencies` : null}
          icon={Calendar}
        />
        <MetricCard
          title="Cycle 1 Deficiencies"
          value={summary?.totalDeficiencies || 0}
          icon={AlertTriangle}
          color={summary?.totalDeficiencies > 0 ? 'text-amber-600' : 'text-green-600'}
        />
        <MetricCard
          title="K-Tags (Life Safety)"
          value={summary?.lifeSafetyCount || 0}
          icon={Shield}
          color={summary?.lifeSafetyCount > 0 ? 'text-amber-600' : 'text-green-600'}
        />
        <MetricCard
          title="E-Tags (Emergency Prep)"
          value={summary?.emergencyPrepCount || 0}
          icon={AlertCircle}
          color={summary?.emergencyPrepCount > 0 ? 'text-amber-600' : 'text-green-600'}
        />
      </div>

      {/* Category Breakdown */}
      {summary?.categoryBreakdown && Object.keys(summary.categoryBreakdown).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Object.entries(summary.categoryBreakdown).map(([category, count]) => (
              <CategoryCard key={category} category={category} count={count} />
            ))}
          </div>
        </div>
      )}

      {/* Fire Safety Survey List */}
      {surveys && surveys.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Survey History</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cycle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deficiencies
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Severity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {surveys.map((survey, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(survey.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {survey.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {survey.cycle && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Cycle {survey.cycle}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${survey.deficiencyCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          {survey.deficiencyCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SeverityBadge code={survey.maxSeverity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Deficiency Table */}
      {data.deficiencies && data.deficiencies.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Deficiency Details</h2>

            {/* Tag Filter Toggle */}
            <div className="flex items-center gap-2">
              {TAG_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setTagFilter(filter.value)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                    ${tagFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-md">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeficiencies.slice(0, 50).map((deficiency, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {deficiency.prefix}-{deficiency.tag?.padStart(4, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {deficiency.category || 'General'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        <p className="line-clamp-2" title={deficiency.description}>
                          {deficiency.description || 'No description available'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SeverityBadge code={deficiency.severity} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge corrected={deficiency.corrected} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDeficiencies.length > 50 && (
              <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500 text-center">
                Showing 50 of {filteredDeficiencies.length} deficiencies
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function SprinklerStatusBanner() {
  // TODO: Get actual sprinkler status from API
  // For now, just show an informational banner
  return null;
}

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-gray-100">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ category, count }) {
  const isClean = count === 0;

  return (
    <Card className={`border ${isClean ? 'border-green-200' : 'border-amber-200'}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 truncate" title={category}>
            {formatCategoryName(category)}
          </span>
          <span className={`font-bold ${isClean ? 'text-green-600' : 'text-amber-600'}`}>
            {count}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ corrected }) {
  if (corrected) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
        <CheckCircle className="h-3 w-3" />
        Corrected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
      <XCircle className="h-3 w-3" />
      Open
    </span>
  );
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function formatCategoryName(category) {
  if (!category) return 'Other';
  // Shorten long category names
  return category
    .replace('Deficiencies', '')
    .replace('Requirements', '')
    .trim();
}

export default FireSafetyTab;
