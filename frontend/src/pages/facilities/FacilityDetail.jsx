import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Eye,
  Pencil,
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
import { facilitiesApi } from '../../api/facilities';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const facilityTypeBadges = {
  SNF: { label: 'Skilled Nursing Facility', variant: 'primary' },
  ALF: { label: 'Assisted Living Facility', variant: 'success' },
  ILF: { label: 'Independent Living Facility', variant: 'warning' },
};

const scorecardStatusBadges = {
  hard_close: { label: 'Completed', variant: 'success' },
  trial_close: { label: 'In Review', variant: 'warning' },
  draft: { label: 'In Progress', variant: 'primary' },
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function FacilityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [facility, setFacility] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentMonthScorecard, setCurrentMonthScorecard] = useState(null);
  const [scorecards, setScorecards] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scorecardPage, setScorecardPage] = useState(1);
  const [scorecardPagination, setScorecardPagination] = useState(null);

  // Load facility data
  useEffect(() => {
    const loadFacility = async () => {
      setLoading(true);
      setError(null);
      try {
        const [facilityData, scorecardsData, trendResponse] = await Promise.all([
          facilitiesApi.get(id),
          facilitiesApi.getScorecards(id, { page: 1, limit: 12 }),
          facilitiesApi.getTrend(id),
        ]);

        setFacility(facilityData.facility);
        setStats(facilityData.stats);
        setCurrentMonthScorecard(facilityData.currentMonthScorecard);
        setScorecards(scorecardsData.scorecards);
        setScorecardPagination(scorecardsData.pagination);
        setTrendData(trendResponse.trendData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load facility');
      } finally {
        setLoading(false);
      }
    };
    loadFacility();
  }, [id]);

  // Load more scorecards
  const loadMoreScorecards = async () => {
    if (!scorecardPagination || scorecardPage >= scorecardPagination.totalPages) return;

    try {
      const nextPage = scorecardPage + 1;
      const data = await facilitiesApi.getScorecards(id, { page: nextPage, limit: 12 });
      setScorecards(prev => [...prev, ...data.scorecards]);
      setScorecardPagination(data.pagination);
      setScorecardPage(nextPage);
    } catch (err) {
      console.error('Error loading more scorecards:', err);
    }
  };

  const formatAddress = () => {
    if (!facility) return '';
    const parts = [facility.address, facility.city, facility.state, facility.zipCode].filter(Boolean);
    return parts.join(', ');
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
        <Button variant="ghost" onClick={() => navigate('/facilities')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Facilities
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!facility) return null;

  const typeBadge = facilityTypeBadges[facility.facilityType];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/facilities')} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Facilities
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{facility.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
            <Badge variant="default">{facility.team.name}</Badge>
            <Badge variant="default">{facility.company.name}</Badge>
          </div>
          {formatAddress() && (
            <p className="text-sm text-gray-500 mt-2">{formatAddress()}</p>
          )}
        </div>

        {/* New Scorecard button */}
        {!currentMonthScorecard && (
          <Link to={`/facilities/${id}/scorecards/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Scorecard
            </Button>
          </Link>
        )}
        {currentMonthScorecard && currentMonthScorecard.status === 'draft' && (
          <Link to={`/scorecards/${currentMonthScorecard.id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Continue Current Scorecard
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.averageScore ? `${stats.averageScore}/800` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Highest Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.highestScore ? `${stats.highestScore}/800` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Lowest Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.lowestScore ? `${stats.lowestScore}/800` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.completionRate ?? 0}%
                </p>
                <p className="text-xs text-gray-400">
                  {stats?.completedCount ?? 0} of 12 months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 800]}
                    ticks={[0, 200, 400, 600, 800]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value}/800`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scorecard History */}
      <Card>
        <CardHeader>
          <CardTitle>Scorecard History</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          {scorecards.length === 0 ? (
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No scorecards found for this facility.</p>
            </CardContent>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month/Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scorecards.map((scorecard) => {
                  const statusBadge = scorecardStatusBadges[scorecard.status];
                  return (
                    <tr key={scorecard.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {monthNames[scorecard.month - 1]} {scorecard.year}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {scorecard.totalScore || 0}/800
                        </div>
                        <div className="text-xs text-gray-500">
                          {((parseFloat(scorecard.totalScore) || 0) / 800 * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(scorecard.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/scorecards/${scorecard.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {scorecard.status === 'draft' && (
                            <Link to={`/scorecards/${scorecard.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Load More */}
        {scorecardPagination && scorecardPage < scorecardPagination.totalPages && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Button variant="secondary" className="w-full" onClick={loadMoreScorecards}>
              Load More
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
