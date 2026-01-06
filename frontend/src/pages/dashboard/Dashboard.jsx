import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Users,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { reportsApi } from '../../api/reports';
import { FacilityLeaderDashboard } from './FacilityLeaderDashboard';
import { PerformanceTrendChart } from '../../components/charts/PerformanceTrendChart';

const statusColors = {
  draft: 'warning',
  trial_close: 'primary',
  hard_close: 'success',
};

const statusLabels = {
  draft: 'Draft',
  trial_close: 'Trial Close',
  hard_close: 'Hard Close',
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TOTAL_POSSIBLE_SCORE = 700;

function getScoreColor(score) {
  const pct = (score / TOTAL_POSSIBLE_SCORE) * 100;
  if (pct >= 90) return 'text-green-600';
  if (pct >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgClass(score) {
  const pct = (score / TOTAL_POSSIBLE_SCORE) * 100;
  if (pct >= 90) return 'bg-green-50 border-green-200';
  if (pct >= 70) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

function TrendIcon({ trend }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

/**
 * Clinical Resource Dashboard
 */
function ClinicalResourceDashboard({ data }) {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Due This Month Alert */}
      {data.dueThisMonth?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Due This Month ({data.dueThisMonth.length})
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                The following facilities need completed scorecards for {currentMonth}:
              </p>
              <ul className="mt-2 space-y-1">
                {data.dueThisMonth.slice(0, 5).map(f => (
                  <li key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-yellow-800">{f.name}</span>
                    <Link to={f.currentScorecard ? `/scorecards/${f.currentScorecard.id}/edit` : `/facilities/${f.id}/scorecards/new`}>
                      <Button variant="ghost" size="sm" className="text-yellow-700">
                        {f.currentScorecard ? 'Continue' : 'Start'} <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* My Facilities */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Facilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.myFacilities?.map(facility => (
            <Card key={facility.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Link
                      to={`/facilities/${facility.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {facility.name}
                    </Link>
                    <p className="text-sm text-gray-500">{facility.team}</p>
                  </div>
                  <Badge variant="secondary">{facility.facilityType}</Badge>
                </div>

                {facility.currentScorecard ? (
                  <div className={`p-3 rounded-lg border ${getScoreBgClass(facility.currentScorecard.totalScore)}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <Badge variant={statusColors[facility.currentScorecard.status]}>
                          {statusLabels[facility.currentScorecard.status]}
                        </Badge>
                        <p className={`text-lg font-bold mt-1 ${getScoreColor(facility.currentScorecard.totalScore)}`}>
                          {facility.currentScorecard.totalScore}/{TOTAL_POSSIBLE_SCORE}
                        </p>
                      </div>
                      <Link to={`/scorecards/${facility.currentScorecard.id}${facility.currentScorecard.status === 'hard_close' ? '' : '/edit'}`}>
                        <Button variant="secondary" size="sm">
                          {facility.currentScorecard.status === 'hard_close' ? 'View' : 'Continue'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">No scorecard this month</p>
                    <Link to={`/facilities/${facility.id}/scorecards/new`}>
                      <Button variant="primary" size="sm" className="w-full">
                        <PlayCircle className="h-4 w-4 mr-1" /> Start Scorecard
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>My Recent Activity</CardTitle>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          {data.recentActivity?.length > 0 ? (
            data.recentActivity.map(activity => (
              <Link
                key={activity.id}
                to={`/scorecards/${activity.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.facilityName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {monthNames[activity.month - 1]} {activity.year}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={statusColors[activity.status]}>
                    {statusLabels[activity.status]}
                  </Badge>
                  <p className={`text-sm font-medium mt-1 ${getScoreColor(activity.totalScore)}`}>
                    {activity.totalScore}/{TOTAL_POSSIBLE_SCORE}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="p-4 text-sm text-gray-500">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Team Leader Dashboard
 */
function TeamLeaderDashboard({ data }) {
  return (
    <div className="space-y-6">
      {/* Team Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Team</p>
              <h2 className="text-2xl font-bold text-gray-900">{data.team?.name}</h2>
              <p className="text-sm text-gray-500">{data.team?.company}</p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-900">{data.summary?.totalFacilities}</p>
                <p className="text-sm text-gray-500">Facilities</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-600">
                  {data.summary?.completedThisMonth}/{data.summary?.totalFacilities}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
              <div>
                <p className={`text-3xl font-bold ${data.summary?.avgScoreThisMonth >= 630 ? 'text-green-600' : data.summary?.avgScoreThisMonth >= 490 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {data.summary?.avgScoreThisMonth || '—'}
                </p>
                <p className="text-sm text-gray-500">Avg Score</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      {data.trendData?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, TOTAL_POSSIBLE_SCORE]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                          <p className="font-medium">{payload[0].payload.month}</p>
                          <p className="text-sm text-gray-600">
                            Avg: <span className="font-medium">{payload[0].value}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {payload[0].payload.count} scorecards
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ fill: '#0284c7', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Facility Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Status</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.facilities?.map(facility => (
                <tr key={facility.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/facilities/${facility.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                      {facility.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{facility.facilityType}</td>
                  <td className="px-4 py-3 text-center">
                    {facility.currentScorecard ? (
                      <Badge variant={statusColors[facility.currentScorecard.status]}>
                        {statusLabels[facility.currentScorecard.status]}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not Started</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {facility.currentScorecard ? (
                      <span className={`font-medium ${getScoreColor(facility.currentScorecard.totalScore)}`}>
                        {facility.currentScorecard.totalScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={facility.currentScorecard ? `/scorecards/${facility.currentScorecard.id}` : `/facilities/${facility.id}/scorecards/new`}>
                      <Button variant="ghost" size="sm">
                        {facility.currentScorecard ? 'View' : 'Start'}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/**
 * Company Leader Dashboard
 */
function CompanyLeaderDashboard({ data }) {
  const [teamTrends, setTeamTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(true);

  useEffect(() => {
    const loadTrends = async () => {
      try {
        // For company_leader, the backend will determine company from auth context
        const result = await reportsApi.getTeamTrends({ months: 12 });
        setTeamTrends(result.teams || []);
      } catch (err) {
        console.error('Error loading team trends:', err);
      } finally {
        setTrendsLoading(false);
      }
    };
    loadTrends();
  }, []);

  return (
    <div className="space-y-6">
      {/* Company Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Teams</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.totalTeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.totalFacilities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.avgScoreThisMonth || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Trend Chart */}
      <PerformanceTrendChart
        entities={teamTrends}
        title="Team Performance Trends"
        defaultMetric="score"
        loading={trendsLoading}
        emptyMessage="No team trend data available"
      />

      {/* Team Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Summary (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilities</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.teamStats?.map(team => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{team.name}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">{team.facilityCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${team.avgScore >= 630 ? 'text-green-600' : team.avgScore >= 490 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {team.avgScore || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm ${team.completionRate >= 80 ? 'text-green-600' : team.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {team.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top/Bottom Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Top Performers</CardTitle>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {data.topPerformers?.map((f, i) => (
              <Link key={f.facilityId} to={`/facilities/${f.facilityId}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold mr-3">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{f.facilityName}</span>
                </div>
                <span className="text-sm font-bold text-green-600">{f.score}/{TOTAL_POSSIBLE_SCORE}</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Needs Improvement</CardTitle>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {data.bottomPerformers?.map((f, i) => (
              <Link key={f.facilityId} to={`/facilities/${f.facilityId}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold mr-3">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{f.facilityName}</span>
                </div>
                <span className="text-sm font-bold text-red-600">{f.score}/{TOTAL_POSSIBLE_SCORE}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Corporate/Admin Dashboard
 */
function CorporateDashboard({ data }) {
  const [companyTrends, setCompanyTrends] = useState([]);
  const [trendsLoading, setTrendsLoading] = useState(true);

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const result = await reportsApi.getCompanyTrends({ months: 12 });
        setCompanyTrends(result.companies || []);
      } catch (err) {
        console.error('Error loading company trends:', err);
      } finally {
        setTrendsLoading(false);
      }
    };
    loadTrends();
  }, []);

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Companies</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.totalCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.totalFacilities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completion</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                {data.summary?.trendDirection === 'up' ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : data.summary?.trendDirection === 'down' ? (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                ) : (
                  <Minus className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary?.avgScoreThisMonth || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Performance Trend Chart */}
      <PerformanceTrendChart
        entities={companyTrends}
        title="Company Performance Trends"
        defaultMetric="score"
        loading={trendsLoading}
        emptyMessage="No company trend data available"
      />

      {/* Company Summary Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Company Summary (This Month)</CardTitle>
            <Link to="/reports/companies">
              <Button variant="ghost" size="sm">View Details <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Teams</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilities</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.companyStats?.map(company => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.name}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">{company.teamCount}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">{company.facilityCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${company.avgScore >= 630 ? 'text-green-600' : company.avgScore >= 490 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {company.avgScore || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm ${company.completionRate >= 80 ? 'text-green-600' : company.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {company.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* At Risk Section */}
      {data.atRisk?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              At Risk Facilities
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {data.atRisk.map((f, i) => (
              <Link
                key={`${f.facilityId}-${i}`}
                to={`/facilities/${f.facilityId}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.facilityName}</p>
                  <p className="text-xs text-gray-500">
                    {f.reason === 'low_score' ? 'Score below 600' : 'Missing multiple months'}
                  </p>
                </div>
                {f.score && (
                  <span className="text-sm font-bold text-red-600">{f.score}/{TOTAL_POSSIBLE_SCORE}</span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Main Dashboard Component
 */
export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const dashboardData = await reportsApi.getDashboard();
        setData(dashboardData);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h2>
          <p className="text-gray-500 mt-1">
            {currentMonth} Overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/facilities">
            <Button variant="secondary">
              <Building2 className="h-4 w-4 mr-2" /> Facilities
            </Button>
          </Link>
          {['corporate', 'admin'].includes(user?.role) && (
            <>
              <Link to="/reports/teams">
                <Button variant="secondary">Team Reports</Button>
              </Link>
              <Link to="/reports/systems">
                <Button variant="secondary">System Analysis</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Role-based Dashboard */}
      {data?.role === 'clinical_resource' && <ClinicalResourceDashboard data={data} />}
      {data?.role === 'facility_leader' && <FacilityLeaderDashboard />}
      {data?.role === 'team_leader' && <TeamLeaderDashboard data={data} />}
      {data?.role === 'company_leader' && <CompanyLeaderDashboard data={data} />}
      {['corporate', 'admin'].includes(data?.role) && <CorporateDashboard data={data} />}
    </div>
  );
}
