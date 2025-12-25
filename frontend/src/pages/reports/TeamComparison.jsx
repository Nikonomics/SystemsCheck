import { useState, useEffect } from 'react';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

export function TeamComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      try {
        const result = await reportsApi.getTeams(filters);
        setData(result);
      } catch (err) {
        console.error('Error loading team data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
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

      {/* Bar Chart */}
      {data?.teams?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Average Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
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
                  <YAxis domain={[0, 700]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const team = payload[0].payload;
                      return (
                        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                          <p className="font-medium">{team.name}</p>
                          <p className="text-sm text-gray-600">{team.company?.name}</p>
                          <p className="text-sm">
                            Avg Score: <span className="font-medium">{team.avgScore || '—'}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {team.facilityCount} facilities, {team.completionRate}% completion
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avgScore">
                    {data.teams.map((entry, index) => (
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
