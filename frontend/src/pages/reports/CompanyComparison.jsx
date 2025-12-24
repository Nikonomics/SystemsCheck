import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ChevronDown,
  ChevronUp,
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
  if (score >= 720) return '#22c55e';
  if (score >= 560) return '#eab308';
  return '#ef4444';
}

function getScoreClass(score) {
  if (score >= 720) return 'text-green-600';
  if (score >= 560) return 'text-yellow-600';
  return 'text-red-600';
}

function getCompletionClass(rate) {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function CompanyComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('6');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await reportsApi.getCompanies({ date_range: dateRange });
        setData(result);
      } catch (err) {
        console.error('Error loading company data:', err);
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateRange]);

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
            <h1 className="text-2xl font-bold text-gray-900">Company Comparison</h1>
            <p className="text-sm text-gray-500">
              Compare performance across companies
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
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {dateRangeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart */}
      {data?.companies?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Average Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.companies}
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
                  <YAxis domain={[0, 800]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const company = payload[0].payload;
                      return (
                        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm">
                            Avg Score: <span className="font-medium">{company.avgScore || '—'}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {company.teamCount} teams, {company.facilityCount} facilities
                          </p>
                          <p className="text-xs text-gray-500">
                            {company.completionRate}% completion
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avgScore">
                    {data.companies.map((entry, index) => (
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
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Teams</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilities</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.companies?.map(company => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{company.teamCount}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{company.facilityCount}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${getScoreClass(company.avgScore || 0)}`}>
                      {company.avgScore || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm ${getCompletionClass(company.completionRate)}`}>
                      {company.completionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <TrendIcon trend={company.trend} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/reports/teams?company_id=${company.id}`}>
                      <Button variant="ghost" size="sm">View Teams</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data?.companies || data.companies.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            No company data available.
          </div>
        )}
      </Card>
    </div>
  );
}
