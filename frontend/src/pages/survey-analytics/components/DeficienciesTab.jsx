import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { getDeficiencyAnalysis } from '../../../api/cms';
import { SeverityBadge } from './SeverityBadge';

// Severity colors for charts
const SEVERITY_COLORS = {
  A: '#9CA3AF', // gray
  B: '#3B82F6', // blue
  C: '#3B82F6',
  D: '#3B82F6',
  E: '#F59E0B', // amber
  F: '#F59E0B',
  G: '#F97316', // orange
  H: '#EF4444', // red
  I: '#EF4444',
  J: '#DC2626',
  K: '#DC2626',
  L: '#B91C1C',
};

// Category colors for chart
const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export function DeficienciesTab({ ccn }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReference, setShowReference] = useState(false);

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [surveyType, setSurveyType] = useState('all');

  useEffect(() => {
    if (ccn) {
      loadDeficiencyAnalysis();
    }
  }, [ccn]);

  const loadDeficiencyAnalysis = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.surveyType && filters.surveyType !== 'all') {
        params.surveyType = filters.surveyType;
      }

      const result = await getDeficiencyAnalysis(ccn, params);
      if (result.success) {
        setData(result.analysis);
      } else {
        setError(result.error || 'Failed to load deficiency analysis');
      }
    } catch (err) {
      console.error('Error loading deficiency analysis:', err);
      setError('Failed to load deficiency data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadDeficiencyAnalysis({ startDate, endDate, surveyType });
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!data) return null;

    const mostCommonCategory = data.byCategory?.[0];
    const mostCommonSeverity = data.bySeverity?.reduce((max, curr) =>
      curr.count > (max?.count || 0) ? curr : max, null
    );

    return {
      total: data.totalDeficiencies || 0,
      mostCommonCategory,
      mostCommonSeverity,
    };
  }, [data]);

  // Prepare chart data
  const categoryChartData = useMemo(() => {
    if (!data?.byCategory) return [];
    const total = data.totalDeficiencies || 1;
    return data.byCategory.slice(0, 10).map((item, index) => ({
      name: truncateCategory(item.category),
      fullName: item.category,
      count: item.count,
      percentage: ((item.count / total) * 100).toFixed(1),
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [data]);

  const severityChartData = useMemo(() => {
    if (!data?.bySeverity) return [];
    return data.bySeverity.map(item => ({
      severity: item.severity,
      count: item.count,
      fill: SEVERITY_COLORS[item.severity] || '#9CA3AF',
    }));
  }, [data]);

  const yearlyTrendData = useMemo(() => {
    if (!data?.byYear) return [];
    const sorted = [...data.byYear].sort((a, b) => a.year - b.year);
    return sorted.map((item, index) => {
      const prevCount = index > 0 ? sorted[index - 1].count : item.count;
      const change = item.count - prevCount;
      return {
        year: item.year.toString(),
        count: item.count,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
      };
    });
  }, [data]);

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

  if (!data || data.totalDeficiencies === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No deficiency data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Deficiencies"
          value={summaryStats?.total || 0}
          icon={AlertTriangle}
          color="text-amber-600"
        />
        <SummaryCard
          title="Most Common Category"
          value={truncateCategory(summaryStats?.mostCommonCategory?.category) || 'N/A'}
          subtitle={summaryStats?.mostCommonCategory ? `${summaryStats.mostCommonCategory.count} citations` : null}
          icon={Tag}
        />
        <SummaryCard
          title="Most Common Severity"
          value={summaryStats?.mostCommonSeverity?.severity || 'N/A'}
          subtitle={summaryStats?.mostCommonSeverity ? `${summaryStats.mostCommonSeverity.count} citations` : null}
          icon={AlertCircle}
          badge={summaryStats?.mostCommonSeverity?.severity}
        />
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="start-date" className="text-xs text-gray-500">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="end-date" className="text-xs text-gray-500">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="survey-type" className="text-xs text-gray-500">
                Survey Type
              </label>
              <select
                id="survey-type"
                value={surveyType}
                onChange={(e) => setSurveyType(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Standard">Standard</option>
                <option value="Complaint">Complaint</option>
              </select>
            </div>

            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Deficiencies by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow-lg">
                              <p className="font-medium text-sm">{data.fullName}</p>
                              <p className="text-sm text-gray-600">
                                {data.count} deficiencies ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            )}
          </CardContent>
        </Card>

        {/* Severity Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {severityChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={severityChartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="severity" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow-lg">
                              <div className="flex items-center gap-2">
                                <SeverityBadge code={data.severity} />
                                <span className="text-sm">{data.count} deficiencies</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {severityChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No severity data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Yearly Trend */}
      {yearlyTrendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Yearly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={yearlyTrendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border rounded shadow-lg">
                            <p className="font-medium">{data.year}</p>
                            <p className="text-sm text-gray-600">{data.count} deficiencies</p>
                            {data.change !== 0 && (
                              <p className={`text-sm ${data.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {data.change > 0 ? '+' : ''}{data.change} from previous year
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Trend Summary Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Year</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Count</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyTrendData.map((item, index) => (
                    <tr key={item.year} className="border-b last:border-0">
                      <td className="py-2 px-3">{item.year}</td>
                      <td className="py-2 px-3 text-right font-medium">{item.count}</td>
                      <td className="py-2 px-3 text-right">
                        {index === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span className={`flex items-center justify-end gap-1 ${
                            item.change > 0 ? 'text-red-600' : item.change < 0 ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {item.change > 0 ? <TrendingUp className="h-4 w-4" /> :
                             item.change < 0 ? <TrendingDown className="h-4 w-4" /> :
                             <Minus className="h-4 w-4" />}
                            {item.change !== 0 && (item.change > 0 ? '+' : '')}{item.change}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top F-Tags Table */}
      {data.topTags && data.topTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Cited F-Tags</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      F-Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-sm">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Max Severity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topTags.slice(0, 15).map((tag, index) => (
                    <tr key={tag.tag} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-blue-600">
                          {formatFTag(tag.tag)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {truncateCategory(tag.category)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">
                        <p className="line-clamp-2" title={tag.description}>
                          {tag.description || 'No description available'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-amber-600">{tag.count}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SeverityBadge code={tag.maxSeverity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope/Severity Reference */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowReference(!showReference)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Scope/Severity Reference</CardTitle>
            {showReference ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </CardHeader>
        {showReference && (
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Code</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Scope</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Severity</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {SEVERITY_REFERENCE.map(item => (
                    <tr key={item.code} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        <SeverityBadge code={item.code} size="sm" />
                      </td>
                      <td className="py-2 px-3 text-gray-600">{item.scope}</td>
                      <td className="py-2 px-3 text-gray-600">{item.severity}</td>
                      <td className="py-2 px-3 text-gray-500">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, color, badge }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              {badge ? (
                <SeverityBadge code={badge} size="lg" />
              ) : (
                <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>
                  {value}
                </p>
              )}
            </div>
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

function truncateCategory(category) {
  if (!category) return 'Unknown';
  // Remove common suffixes and truncate
  return category
    .replace(' Deficiencies', '')
    .replace(' Requirements', '')
    .substring(0, 30) + (category.length > 30 ? '...' : '');
}

function formatFTag(tag) {
  if (!tag) return 'N/A';
  // Ensure F-tag format like "F-0880"
  const cleaned = tag.replace(/[^0-9]/g, '');
  return `F-${cleaned.padStart(4, '0')}`;
}

const SEVERITY_REFERENCE = [
  { code: 'A', scope: 'Isolated', severity: 'No actual harm', description: 'Potential for minimal harm' },
  { code: 'B', scope: 'Pattern', severity: 'No actual harm', description: 'Potential for minimal harm' },
  { code: 'C', scope: 'Widespread', severity: 'No actual harm', description: 'Potential for minimal harm' },
  { code: 'D', scope: 'Isolated', severity: 'No actual harm', description: 'Potential for more than minimal harm' },
  { code: 'E', scope: 'Pattern', severity: 'No actual harm', description: 'Potential for more than minimal harm' },
  { code: 'F', scope: 'Widespread', severity: 'No actual harm', description: 'Potential for more than minimal harm' },
  { code: 'G', scope: 'Isolated', severity: 'Actual harm', description: 'Not immediate jeopardy' },
  { code: 'H', scope: 'Pattern', severity: 'Actual harm', description: 'Not immediate jeopardy' },
  { code: 'I', scope: 'Widespread', severity: 'Actual harm', description: 'Not immediate jeopardy' },
  { code: 'J', scope: 'Isolated', severity: 'Immediate jeopardy', description: 'Serious injury, harm, impairment, or death' },
  { code: 'K', scope: 'Pattern', severity: 'Immediate jeopardy', description: 'Serious injury, harm, impairment, or death' },
  { code: 'L', scope: 'Widespread', severity: 'Immediate jeopardy', description: 'Serious injury, harm, impairment, or death' },
];

export default DeficienciesTab;
