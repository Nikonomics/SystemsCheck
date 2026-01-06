import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { reportsApi } from '../../api/reports';
import { facilitiesApi } from '../../api/facilities';

// US State names for display
const stateNames = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

const dateRangeOptions = [
  { value: '3', label: 'Last 3 Months' },
  { value: '6', label: 'Last 6 Months' },
  { value: '12', label: 'Last 12 Months' },
];

function TrendIcon({ trend }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function getBarColor(score) {
  if (score >= 630) return '#22c55e';  // 90% of 700
  if (score >= 490) return '#eab308';  // 70% of 700
  return '#ef4444';
}

function getScoreClass(score) {
  if (score >= 630) return 'text-green-600';  // 90% of 700
  if (score >= 490) return 'text-yellow-600'; // 70% of 700
  return 'text-red-600';
}

function getCompletionClass(rate) {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

// Format month key (2024-07) to display format (Jul)
function formatMonth(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

// Format month key with year for tooltip (Jul 2024)
function formatMonthFull(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function TeamComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [teamTrends, setTeamTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metric, setMetric] = useState('score'); // 'score' or 'completion'
  const [filters, setFilters] = useState({
    company_id: searchParams.get('company_id') || '',
    date_range: searchParams.get('date_range') || '6',
    state: searchParams.get('state') || '',
  });
  const [filterOptions, setFilterOptions] = useState({ companies: [], states: [] });
  const [showFilters, setShowFilters] = useState(!!searchParams.get('state'));
  const [expandedTeam, setExpandedTeam] = useState(null);

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [companyOptions, stateOptions] = await Promise.all([
          facilitiesApi.getFilters(),
          reportsApi.getStates()
        ]);
        setFilterOptions({
          companies: companyOptions.companies || [],
          states: stateOptions.states || []
        });
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFilters();
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setTrendsLoading(true);
      try {
        const [teamsResult, trendsResult] = await Promise.all([
          reportsApi.getTeams(filters),
          reportsApi.getTeamTrends({
            companyId: filters.company_id || undefined,
            months: parseInt(filters.date_range) || 6
          }),
        ]);
        setData(teamsResult);
        setTeamTrends(trendsResult.teams || []);
      } catch (err) {
        console.error('Error loading team data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
        setTrendsLoading(false);
      }
    };
    loadData();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Update URL params for shareable links
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Comparison</h1>
            <p className="text-sm text-gray-500">
              Compare performance across teams
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" /> Filters
          {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  value={filters.company_id}
                  onChange={(e) => handleFilterChange('company_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Companies</option>
                  {filterOptions.companies?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  State
                </label>
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All States</option>
                  {filterOptions.states?.map(s => (
                    <option key={s.code} value={s.code}>
                      {stateNames[s.code] || s.code} ({s.count})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={filters.date_range}
                  onChange={(e) => handleFilterChange('date_range', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {dateRangeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Active filter indicator */}
            {filters.state && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">Filtering by:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <MapPin className="h-3 w-3 mr-1" />
                  {stateNames[filters.state] || filters.state}
                  <button
                    onClick={() => handleFilterChange('state', '')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend Chart with Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Performance Over Time</CardTitle>
            {/* Metric Toggle */}
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => setMetric('score')}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  metric === 'score'
                    ? 'bg-white shadow text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Avg Score
              </button>
              <button
                onClick={() => setMetric('completion')}
                className={`px-3 py-1 text-sm rounded-md transition ${
                  metric === 'completion'
                    ? 'bg-white shadow text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Completion %
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : teamTrends.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={(() => {
                    // Transform data for Recharts - needs flat array with month as key
                    if (!teamTrends.length) return [];
                    const months = teamTrends[0]?.data?.map(d => d.month) || [];
                    return months.map(month => {
                      const point = { month };
                      teamTrends.forEach(team => {
                        const monthData = team.data.find(d => d.month === month);
                        if (monthData) {
                          point[`${team.id}_score`] = monthData.avgScore;
                          point[`${team.id}_completion`] = monthData.completionPct;
                        }
                      });
                      return point;
                    });
                  })()}
                  margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatMonth}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={metric === 'score' ? [0, 700] : [0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={metric === 'completion' ? (v) => `${v}%` : undefined}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border text-sm">
                          <p className="font-medium text-gray-900 mb-2">{formatMonthFull(label)}</p>
                          <div className="space-y-1">
                            {payload.map((p, i) => {
                              const teamId = p.dataKey.split('_')[0];
                              const team = teamTrends.find(t => String(t.id) === teamId);
                              return (
                                <div key={i} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: p.color }}
                                    />
                                    <span className="text-gray-700">{team?.name || teamId}</span>
                                  </div>
                                  <span className="font-medium">
                                    {p.value !== null && p.value !== undefined
                                      ? metric === 'completion'
                                        ? `${p.value}%`
                                        : p.value
                                      : '—'
                                    }
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      const teamId = value.split('_')[0];
                      const team = teamTrends.find(t => String(t.id) === teamId);
                      return <span className="text-xs">{team?.name || teamId}</span>;
                    }}
                    iconType="line"
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                  {teamTrends.map((team) => (
                    <Line
                      key={team.id}
                      type="monotone"
                      dataKey={`${team.id}_${metric}`}
                      name={`${team.id}_${metric}`}
                      stroke={team.color}
                      strokeWidth={2}
                      dot={{ fill: team.color, r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No trend data available for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Bar Chart */}
      {data?.teams?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team {metric === 'score' ? 'Average Scores' : 'Completion Rates'} Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.teams}
                  margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    domain={metric === 'score' ? [0, 700] : [0, 100]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={metric === 'completion' ? (v) => `${v}%` : undefined}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const team = payload[0].payload;
                      return (
                        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                          <p className="font-medium">{team.name}</p>
                          <p className="text-sm text-gray-600">{team.company?.name}</p>
                          <p className="text-sm">
                            {metric === 'score' ? 'Avg Score' : 'Completion'}:
                            <span className="font-medium ml-1">
                              {metric === 'score' ? (team.avgScore || '—') : `${team.completionRate}%`}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {team.facilityCount} facilities
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey={metric === 'score' ? 'avgScore' : 'completionRate'}>
                    {data.teams.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={metric === 'score'
                          ? getBarColor(entry.avgScore || 0)
                          : (entry.completionRate >= 80 ? '#22c55e' : entry.completionRate >= 50 ? '#eab308' : '#ef4444')
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilities</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.teams?.map(team => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{team.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{team.company?.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{team.facilityCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${getScoreClass(team.avgScore || 0)}`}>
                      {team.avgScore || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm ${getCompletionClass(team.completionRate)}`}>
                      {team.completionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <TrendIcon trend={team.trend} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/facilities?team_id=${team.id}`}>
                      <Button variant="ghost" size="sm">View Facilities</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.teams || data.teams.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            No team data available for the selected filters.
          </div>
        )}
      </Card>
    </div>
  );
}
