import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Target,
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { reportsApi } from '../../api/reports';
import { facilitiesApi } from '../../api/facilities';

const dateRangeOptions = [
  { value: '3', label: 'Last 3 Months' },
  { value: '6', label: 'Last 6 Months' },
  { value: '12', label: 'Last 12 Months' },
];

const systemDescriptions = {
  1: 'Changes in Condition',
  2: 'Falls Prevention',
  3: 'Skin Integrity',
  4: 'Medication Management',
  5: 'Infection Control',
  6: 'Transfer/Discharge',
  7: 'Abuse Prevention',
  8: 'Quality of Life',
};

function TrendIcon({ trend }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function getBarColor(score) {
  if (score >= 90) return '#22c55e';
  if (score >= 70) return '#eab308';
  return '#ef4444';
}

function getScoreClass(score) {
  if (score >= 90) return 'text-green-600 bg-green-50';
  if (score >= 70) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function getScoreTextClass(score) {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

export function SystemAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    company_id: '',
    team_id: '',
    date_range: '6',
  });
  const [filterOptions, setFilterOptions] = useState({ companies: [], teams: [] });
  const [showFilters, setShowFilters] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const options = await facilitiesApi.getFilters();
        setFilterOptions(options);
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
      try {
        const result = await reportsApi.getSystems(filters);
        setData(result);
      } catch (err) {
        console.error('Error loading system data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Get filtered teams based on company selection
  const filteredTeams = useMemo(() => {
    if (!filters.company_id) return filterOptions.teams || [];
    return (filterOptions.teams || []).filter(
      t => t.companyId === parseInt(filters.company_id)
    );
  }, [filterOptions.teams, filters.company_id]);

  // Identify problem areas (systems with avg < 80)
  const problemAreas = useMemo(() => {
    if (!data?.systems) return [];
    return data.systems.filter(s => s.avgScore && s.avgScore < 80);
  }, [data]);

  // Identify strengths (systems with avg >= 90)
  const strengths = useMemo(() => {
    if (!data?.systems) return [];
    return data.systems.filter(s => s.avgScore && s.avgScore >= 90);
  }, [data]);

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
            <h1 className="text-2xl font-bold text-gray-900">System Analysis</h1>
            <p className="text-sm text-gray-500">
              Identify training needs and performance patterns across all systems
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
                  Team
                </label>
                <select
                  value={filters.team_id}
                  onChange={(e) => handleFilterChange('team_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Teams</option>
                  {filteredTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
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
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Facilities</p>
                <p className="text-3xl font-bold text-gray-900">{data?.summary?.totalFacilities || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scorecards Analyzed</p>
                <p className="text-3xl font-bold text-gray-900">{data?.summary?.totalScorecards || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Systems Below 80%</p>
                <p className="text-3xl font-bold text-red-600">{problemAreas.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Problem Areas */}
        {problemAreas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Training Opportunities
              </CardTitle>
            </CardHeader>
            <div className="divide-y divide-gray-100">
              {problemAreas.map(sys => (
                <div key={sys.systemNumber} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900">
                        System {sys.systemNumber}: {sys.systemName}
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${getScoreTextClass(sys.avgScore)}`}>
                      {sys.avgScore?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{sys.facilitiesBelow80} facilities below 80%</span>
                    <span>•</span>
                    <span>{sys.totalDataPoints} data points</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Areas of Strength
              </CardTitle>
            </CardHeader>
            <div className="divide-y divide-gray-100">
              {strengths.map(sys => (
                <div key={sys.systemNumber} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-900">
                        System {sys.systemNumber}: {sys.systemName}
                      </span>
                    </div>
                    <span className={`text-lg font-bold ${getScoreTextClass(sys.avgScore)}`}>
                      {sys.avgScore?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{sys.facilitiesBelow80} facilities below 80%</span>
                    <span>•</span>
                    <span>{sys.totalDataPoints} data points</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Bar Chart */}
      {data?.systems?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>System Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.systems.map(s => ({
                    ...s,
                    name: `S${s.systemNumber}`,
                  }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const sys = payload[0].payload;
                      return (
                        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                          <p className="font-medium">{sys.systemName}</p>
                          <p className="text-sm">
                            Avg Score: <span className="font-medium">{sys.avgScore?.toFixed(1)}%</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {sys.facilitiesBelow80} facilities below 80%
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avgScore">
                    {data.systems.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.avgScore || 0)} />
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
          <CardTitle>System Details</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Below 80%</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Data Points</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.systems?.map(sys => (
                <tr key={sys.systemNumber} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${getScoreClass(sys.avgScore || 0)}
                    `}>
                      {sys.systemNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{sys.systemName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${getScoreTextClass(sys.avgScore || 0)}`}>
                      {sys.avgScore?.toFixed(1) || '—'}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {sys.facilitiesBelow80 > 0 ? (
                      <Badge variant="destructive">{sys.facilitiesBelow80}</Badge>
                    ) : (
                      <Badge variant="success">0</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">
                    {sys.totalDataPoints}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <TrendIcon trend={sys.trend} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.systems || data.systems.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            No system data available for the selected filters.
          </div>
        )}
      </Card>
    </div>
  );
}
