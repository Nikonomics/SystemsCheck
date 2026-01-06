import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ArrowRight,
  PlayCircle,
  CheckCircle,
  Clock,
  FileText,
  Brain,
  ExternalLink,
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
import { facilitiesApi } from '../../api/facilities';
import { getRiskScore } from '../../api/surveyIntel';

const TOTAL_POSSIBLE_SCORE = 700;

const statusColors = {
  draft: 'warning',
  trial_close: 'primary',
  hard_close: 'success',
};

const statusLabels = {
  draft: 'Draft',
  trial_close: 'Trial Close',
  hard_close: 'Closed',
};

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

function getRiskBadgeColor(score) {
  if (score >= 70) return 'destructive';
  if (score >= 40) return 'warning';
  return 'success';
}

export function FacilityLeaderDashboard() {
  const [facility, setFacility] = useState(null);
  const [scorecards, setScorecards] = useState([]);
  const [riskScore, setRiskScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get user's assigned facilities (facility_leader typically has one)
        const facilitiesData = await facilitiesApi.list();
        const facilities = facilitiesData.facilities || facilitiesData;

        if (!facilities || facilities.length === 0) {
          setError('No facility assigned. Please contact an administrator.');
          setLoading(false);
          return;
        }

        const myFacility = facilities[0];
        setFacility(myFacility);

        // Get scorecards for this facility
        const scorecardsData = await facilitiesApi.getScorecards(myFacility.id, { limit: 10 });
        setScorecards(scorecardsData.scorecards || scorecardsData || []);

        // Try to get survey intelligence risk score (graceful fallback)
        try {
          const riskData = await getRiskScore(myFacility.id);
          setRiskScore(riskData);
        } catch {
          // Survey intelligence may not be available - that's okay
          setRiskScore(null);
        }
      } catch (err) {
        console.error('Error loading facility leader dashboard:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  // Calculate metrics
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const pendingAudits = scorecards.filter(sc => sc.status === 'draft' || sc.status === 'trial_close');
  const closedScorecards = scorecards.filter(sc => sc.status === 'hard_close');
  const recentScorecards = scorecards.slice(0, 5);

  // Calculate average score from last 6 months
  const last6Months = closedScorecards.slice(0, 6);
  const avgScore = last6Months.length > 0
    ? Math.round(last6Months.reduce((sum, sc) => sum + (sc.totalScore || 0), 0) / last6Months.length)
    : null;

  // Calculate trend
  let trend = 'flat';
  if (last6Months.length >= 2) {
    const recent = last6Months.slice(0, 3).reduce((sum, sc) => sum + (sc.totalScore || 0), 0) / Math.min(3, last6Months.length);
    const older = last6Months.slice(3, 6).reduce((sum, sc) => sum + (sc.totalScore || 0), 0) / Math.min(3, last6Months.slice(3).length || 1);
    if (recent > older + 20) trend = 'up';
    else if (recent < older - 20) trend = 'down';
  }

  // Prepare trend chart data
  const trendData = [...closedScorecards]
    .slice(0, 6)
    .reverse()
    .map(sc => ({
      month: new Date(sc.month + '-01').toLocaleString('default', { month: 'short' }),
      score: sc.totalScore || 0,
    }));

  // Check if there's a current month scorecard
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentScorecard = scorecards.find(sc => sc.month === currentMonthKey);

  return (
    <div className="space-y-6">
      {/* Facility Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Building2 className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <Link
                  to={`/facilities/${facility.id}`}
                  className="text-xl font-bold text-gray-900 hover:text-primary-600 flex items-center"
                >
                  {facility.name}
                  <ExternalLink className="h-4 w-4 ml-2 text-gray-400" />
                </Link>
                <p className="text-sm text-gray-500">
                  {facility.city}, {facility.state} {facility.ccn && `| CCN: ${facility.ccn}`}
                </p>
              </div>
            </div>
            {riskScore && (
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Survey Risk</p>
                <Badge variant={getRiskBadgeColor(riskScore.overallScore || riskScore.score || 0)}>
                  {riskScore.overallScore || riskScore.score || 0}/100
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Audits Alert */}
      {pendingAudits.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Pending Audits ({pendingAudits.length})
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You have incomplete scorecards that need attention:
              </p>
              <ul className="mt-2 space-y-2">
                {pendingAudits.map(sc => (
                  <li key={sc.id} className="flex items-center justify-between">
                    <span className="text-sm text-yellow-800">
                      {new Date(sc.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                      <Badge variant={statusColors[sc.status]} className="ml-2">
                        {statusLabels[sc.status]}
                      </Badge>
                    </span>
                    <Link to={`/scorecards/${sc.id}/edit`}>
                      <Button variant="ghost" size="sm" className="text-yellow-700">
                        Continue <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Score Summary + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Score Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">6-Month Average</p>
                {avgScore !== null ? (
                  <div className="flex items-center mt-1">
                    <span className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
                      {avgScore}
                    </span>
                    <span className="text-gray-400 text-lg ml-1">/{TOTAL_POSSIBLE_SCORE}</span>
                    <div className="ml-3">
                      <TrendIcon trend={trend} />
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-400 mt-1">No data</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${avgScore ? getScoreBgClass(avgScore) : 'bg-gray-100'}`}>
                <FileText className={`h-6 w-6 ${avgScore ? getScoreColor(avgScore) : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed This Month */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{currentMonth}</p>
                {currentScorecard ? (
                  <div className="mt-1">
                    <Badge variant={statusColors[currentScorecard.status]}>
                      {statusLabels[currentScorecard.status]}
                    </Badge>
                    {currentScorecard.totalScore > 0 && (
                      <p className={`text-lg font-bold mt-1 ${getScoreColor(currentScorecard.totalScore)}`}>
                        {currentScorecard.totalScore}/{TOTAL_POSSIBLE_SCORE}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-lg font-medium text-gray-400 mt-1">Not started</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${currentScorecard?.status === 'hard_close' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {currentScorecard?.status === 'hard_close' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Survey Intelligence Link */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Survey Intelligence</p>
                <p className="text-xs text-indigo-500 mt-1">View detailed risk analysis</p>
              </div>
              <Link to={`/survey-intelligence?facilityId=${facility.id}`}>
                <Button variant="secondary" size="sm" className="bg-white">
                  <Brain className="h-4 w-4 mr-1" /> View
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart + Recent Scorecards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 1 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, TOTAL_POSSIBLE_SCORE]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                            <p className="font-medium">{data.month}</p>
                            <p className={`text-sm ${getScoreColor(data.score)}`}>
                              Score: <span className="font-bold">{data.score}</span>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                Not enough data for trend chart
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scorecards */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Scorecards</CardTitle>
              <Link to={`/facilities/${facility.id}`}>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {recentScorecards.length > 0 ? (
              recentScorecards.map(sc => (
                <Link
                  key={sc.id}
                  to={sc.status === 'hard_close' ? `/scorecards/${sc.id}` : `/scorecards/${sc.id}/edit`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${getScoreBgClass(sc.totalScore || 0)}`}>
                      <FileText className={`h-4 w-4 ${getScoreColor(sc.totalScore || 0)}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(sc.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </p>
                      <Badge variant={statusColors[sc.status]} className="mt-1">
                        {statusLabels[sc.status]}
                      </Badge>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${getScoreColor(sc.totalScore || 0)}`}>
                    {sc.totalScore || 0}/{TOTAL_POSSIBLE_SCORE}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                No scorecards yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentScorecard && currentScorecard.status !== 'hard_close' ? (
              <Link to={`/scorecards/${currentScorecard.id}/edit`} className="block">
                <Button variant="primary" className="w-full justify-center">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Continue {currentMonth} Audit
                </Button>
              </Link>
            ) : !currentScorecard ? (
              <Link to={`/facilities/${facility.id}/scorecards/new`} className="block">
                <Button variant="primary" className="w-full justify-center">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start {currentMonth} Audit
                </Button>
              </Link>
            ) : (
              <Link to={`/scorecards/${currentScorecard.id}`} className="block">
                <Button variant="secondary" className="w-full justify-center">
                  <FileText className="h-4 w-4 mr-2" />
                  View {currentMonth} Scorecard
                </Button>
              </Link>
            )}

            <Link to={`/facilities/${facility.id}`} className="block">
              <Button variant="secondary" className="w-full justify-center">
                <Building2 className="h-4 w-4 mr-2" />
                Facility Details
              </Button>
            </Link>

            <Link to={`/survey-intelligence?facilityId=${facility.id}`} className="block">
              <Button variant="secondary" className="w-full justify-center">
                <Brain className="h-4 w-4 mr-2" />
                Survey Intelligence
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
