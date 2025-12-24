import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Pencil,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { pdf } from '@react-pdf/renderer';
import { scorecardsApi } from '../../api/scorecards';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { calculateSystemTotal, calculateItemPoints } from './components/ScoreDisplay';
import { ScorecardPDF } from './ScorecardPDF';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const statusBadges = {
  draft: { label: 'Draft', variant: 'primary' },
  trial_close: { label: 'Trial Close', variant: 'warning' },
  hard_close: { label: 'Hard Close', variant: 'success' },
};

/**
 * ScorecardView - Presentation view for completed scorecards
 */
export function ScorecardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [scorecard, setScorecard] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSystems, setExpandedSystems] = useState(new Set([0, 1, 2]));
  const [exportingPdf, setExportingPdf] = useState(false);

  // Load scorecard data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [scorecardData, activityData] = await Promise.all([
          scorecardsApi.get(id),
          scorecardsApi.getActivityLog(id),
        ]);

        setScorecard(scorecardData.scorecard);
        setActivityLog(activityData.activityLogs || []);
      } catch (err) {
        console.error('Error loading scorecard:', err);
        setError(err.response?.data?.message || 'Failed to load scorecard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Calculate scores
  const scores = useMemo(() => {
    if (!scorecard?.systems) return null;

    const systemScores = scorecard.systems.map(system => ({
      systemNumber: system.systemNumber,
      systemName: system.systemName,
      score: calculateSystemTotal(system.items || []),
      maxScore: 100,
    }));

    const totalScore = systemScores.reduce((sum, s) => sum + s.score, 0);
    const percentage = (totalScore / 800) * 100;

    return {
      systemScores,
      totalScore: Math.round(totalScore * 10) / 10,
      percentage: Math.round(percentage * 10) / 10,
    };
  }, [scorecard]);

  // Get score color class
  const getScoreColorClass = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextClass = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgClass = (percentage) => {
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Radar chart data
  const radarData = useMemo(() => {
    if (!scores) return [];
    return scores.systemScores.map(s => ({
      system: `S${s.systemNumber}`,
      fullName: s.systemName,
      score: Math.round((s.score / s.maxScore) * 100),
      actual: s.score,
    }));
  }, [scores]);

  // Toggle system expansion
  const toggleSystem = (index) => {
    setExpandedSystems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Scroll to system section
  const scrollToSystem = (index) => {
    setExpandedSystems(prev => new Set([...prev, index]));
    setTimeout(() => {
      const element = document.getElementById(`system-${index}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Handle PDF export
  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const blob = await pdf(
        <ScorecardPDF scorecard={scorecard} scores={scores} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${scorecard.facility?.name || 'Scorecard'}-${monthNames[scorecard.month - 1]}-${scorecard.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  // Get activity icon and text
  const getActivityDisplay = (action) => {
    const displays = {
      created: { icon: FileCheck, text: 'Created', color: 'text-blue-600' },
      edited: { icon: Pencil, text: 'Edited', color: 'text-gray-600' },
      trial_closed: { icon: Clock, text: 'Trial closed', color: 'text-yellow-600' },
      reopened: { icon: FileCheck, text: 'Reopened', color: 'text-blue-600' },
      hard_closed: { icon: FileCheck, text: 'Hard closed', color: 'text-green-600' },
    };
    return displays[action] || { icon: Clock, text: action, color: 'text-gray-600' };
  };

  // Check if user can edit
  const canEdit = scorecard?.status === 'draft';

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
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!scorecard || !scores) return null;

  const statusBadge = statusBadges[scorecard.status];
  const overallPercentage = scores.percentage;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className={`-mx-6 -mt-6 px-6 py-6 border-b ${getScoreBgClass(overallPercentage)} print:bg-white print:border-gray-200`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Back and title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/facilities/${scorecard.facilityId}`)}
              className="print:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {scorecard.facility?.name || 'Scorecard'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-600">
                  {monthNames[scorecard.month - 1]} {scorecard.year}
                </span>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              </div>
            </div>
          </div>

          {/* Right: Score and actions */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-500 uppercase">Total Score</div>
              <div className={`text-4xl font-bold ${getScoreTextClass(overallPercentage)}`}>
                {scores.totalScore}
                <span className="text-2xl text-gray-400">/800</span>
              </div>
              <div className={`text-lg font-medium ${getScoreTextClass(overallPercentage)}`}>
                {overallPercentage}%
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              {canEdit && (
                <Link to={`/scorecards/${id}/edit`}>
                  <Button variant="secondary" size="sm">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportPdf}
                loading={exportingPdf}
              >
                <Download className="h-4 w-4 mr-1" />
                Export PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Score Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 print:grid-cols-4">
        {scores.systemScores.map((system, index) => {
          const pct = (system.score / system.maxScore) * 100;
          return (
            <button
              key={system.systemNumber}
              onClick={() => scrollToSystem(index)}
              className={`
                p-3 rounded-lg border text-left transition-all
                hover:shadow-md print:shadow-none
                ${getScoreBgClass(pct)}
              `}
            >
              <div className="text-xs text-gray-500 mb-1">
                System {system.systemNumber}
              </div>
              <div className={`text-lg font-bold ${getScoreTextClass(pct)}`}>
                {system.score.toFixed(0)}/100
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreColorClass(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Radar Chart */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Systems Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="system"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke={overallPercentage >= 90 ? '#22c55e' : overallPercentage >= 70 ? '#eab308' : '#ef4444'}
                  fill={overallPercentage >= 90 ? '#22c55e' : overallPercentage >= 70 ? '#eab308' : '#ef4444'}
                  fillOpacity={0.3}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200">
                        <div className="font-medium">{data.fullName}</div>
                        <div className="text-sm text-gray-600">
                          Score: {data.actual}/100 ({data.score}%)
                        </div>
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* System Details */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">System Details</h2>

        {scorecard.systems.map((system, index) => {
          const isExpanded = expandedSystems.has(index);
          const systemScore = calculateSystemTotal(system.items || []);
          const pct = systemScore;

          return (
            <Card
              key={system.id}
              id={`system-${index}`}
              className="print:break-inside-avoid"
            >
              <button
                onClick={() => toggleSystem(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 print:hover:bg-white"
              >
                <div className="flex items-center gap-4">
                  <span className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                    ${getScoreBgClass(pct)} ${getScoreTextClass(pct)}
                  `}>
                    {system.systemNumber}
                  </span>
                  <div>
                    <h3 className="font-medium text-gray-900">{system.systemName}</h3>
                    <div className="text-sm text-gray-500">
                      {system.items?.length || 0} audit items
                      {system.residents?.length > 0 && (
                        <span> • {system.residents.length} residents reviewed</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${getScoreTextClass(pct)}`}>
                    {systemScore.toFixed(1)}/100
                  </span>
                  <span className="print:hidden">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </span>
                </div>
              </button>

              {(isExpanded || true) && (
                <div className={`border-t border-gray-200 ${!isExpanded ? 'hidden print:block' : ''}`}>
                  {/* Audit items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">
                            #
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Audit Item
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                            # Met
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                            Sample
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                            Points
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(system.items || []).map((item, itemIndex) => {
                          const points = calculateItemPoints(
                            item.maxPoints,
                            item.chartsMet,
                            item.sampleSize
                          );
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {itemIndex + 1}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {item.criteriaText}
                              </td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">
                                {item.chartsMet ?? '—'}
                              </td>
                              <td className="px-4 py-2 text-sm text-center text-gray-900">
                                {item.sampleSize ?? '—'}
                              </td>
                              <td className="px-4 py-2 text-sm text-center font-medium">
                                <span className={getScoreTextClass((points / item.maxPoints) * 100)}>
                                  {points.toFixed(1)}
                                </span>
                                <span className="text-gray-400">/{item.maxPoints}</span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {item.notes || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-right font-medium text-gray-900">
                            Subtotal:
                          </td>
                          <td className="px-4 py-2 text-center font-bold">
                            <span className={getScoreTextClass(pct)}>
                              {systemScore.toFixed(1)}
                            </span>
                            <span className="text-gray-400">/100</span>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Residents reviewed */}
                  {system.residents?.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Residents Reviewed ({system.residents.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {system.residents.map((resident, idx) => (
                          <span
                            key={resident.id || idx}
                            className="px-2 py-1 bg-white rounded border text-sm"
                          >
                            {resident.initials}
                            {resident.patientRecordNumber && (
                              <span className="text-gray-400 ml-1">
                                #{resident.patientRecordNumber}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Activity Timeline */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLog.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded.</p>
          ) : (
            <div className="space-y-4">
              {activityLog.map((activity, index) => {
                const display = getActivityDisplay(activity.action);
                const Icon = display.icon;
                return (
                  <div key={activity.id || index} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full bg-gray-100 ${display.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {display.text}
                        </span>
                        <span className="text-gray-500">by</span>
                        <span className="text-gray-900">
                          {activity.user
                            ? `${activity.user.firstName} ${activity.user.lastName}`
                            : 'Unknown'}
                        </span>
                      </div>
                      <div
                        className="text-sm text-gray-500"
                        title={new Date(activity.createdAt).toLocaleString()}
                      >
                        {formatRelativeTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
