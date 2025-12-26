import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ClipboardCheck,
  AlertCircle,
  ChevronRight,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { getSurveys } from '../../../api/cms';
import { SeverityBadge } from './SeverityBadge';

const SURVEY_TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'standard', label: 'Standard' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'infection', label: 'Infection Control' },
];

const CYCLE_FILTERS = [
  { value: 'all', label: 'All Cycles' },
  { value: '1', label: 'Cycle 1' },
  { value: '2', label: 'Cycle 2' },
  { value: '3', label: 'Cycle 3' },
];

export function HealthSurveysTab({ ccn }) {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [cycleFilter, setCycleFilter] = useState('all');

  useEffect(() => {
    if (ccn) {
      loadSurveys();
    }
  }, [ccn]);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSurveys(ccn);
      if (result.success) {
        // Filter to health surveys only
        const healthSurveys = (result.surveys || []).filter(
          s => s.category === 'health' || s.surveyType?.toLowerCase().includes('health')
        );
        setSurveys(healthSurveys);
      } else {
        setError(result.error || 'Failed to load surveys');
      }
    } catch (err) {
      console.error('Error loading surveys:', err);
      setError('Failed to load survey data');
    } finally {
      setLoading(false);
    }
  };

  // Filter surveys based on selected filters
  const filteredSurveys = useMemo(() => {
    return surveys.filter(survey => {
      // Type filter
      if (typeFilter !== 'all') {
        const surveyType = survey.surveyType?.toLowerCase() || '';
        if (typeFilter === 'standard' && !surveyType.includes('standard') && surveyType !== 'health') {
          return false;
        }
        if (typeFilter === 'complaint' && !surveyType.includes('complaint')) {
          return false;
        }
        if (typeFilter === 'infection' && !surveyType.includes('infection')) {
          return false;
        }
      }

      // Cycle filter
      if (cycleFilter !== 'all') {
        if (survey.cycle !== parseInt(cycleFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [surveys, typeFilter, cycleFilter]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalSurveys = filteredSurveys.length;
    const totalDeficiencies = filteredSurveys.reduce(
      (sum, s) => sum + (s.totalDeficiencies || 0),
      0
    );
    const avgDeficiencies = totalSurveys > 0
      ? (totalDeficiencies / totalSurveys).toFixed(1)
      : 0;

    return { totalSurveys, totalDeficiencies, avgDeficiencies };
  }, [filteredSurveys]);

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

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Surveys"
          value={stats.totalSurveys}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Total Deficiencies"
          value={stats.totalDeficiencies}
          icon={AlertCircle}
          color={stats.totalDeficiencies > 0 ? 'text-amber-600' : 'text-green-600'}
        />
        <StatCard
          title="Avg per Survey"
          value={stats.avgDeficiencies}
          icon={TrendingUp}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="type-filter" className="text-sm text-gray-600">
                Type:
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {SURVEY_TYPE_FILTERS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="cycle-filter" className="text-sm text-gray-600">
                Cycle:
              </label>
              <select
                id="cycle-filter"
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {CYCLE_FILTERS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Survey Timeline */}
      {filteredSurveys.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No health surveys found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {filteredSurveys.map((survey, index) => (
              <SurveyTimelineCard key={index} survey={survey} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>
              {value}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-gray-100">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SurveyTimelineCard({ survey }) {
  const surveyDate = formatDate(survey.surveyDate);
  const deficiencyCount = survey.totalDeficiencies || 0;

  // Get severity color class for border
  const severityBorderClass = getSeverityBorderClass(survey.maxSeverity);

  return (
    <div className="relative pl-12">
      {/* Timeline dot */}
      <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow" />

      <Card className={`border-l-4 ${severityBorderClass}`}>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Date and Type */}
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">{surveyDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{survey.surveyType || 'Health'}</span>
                {survey.cycle && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    Cycle {survey.cycle}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Deficiency count and severity */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-sm text-gray-500">Deficiencies</span>
                <p className={`text-lg font-bold ${deficiencyCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {deficiencyCount}
                </p>
              </div>

              {survey.maxSeverity && (
                <div className="text-right">
                  <span className="text-sm text-gray-500">Max Severity</span>
                  <div className="mt-1">
                    <SeverityBadge code={survey.maxSeverity} />
                  </div>
                </div>
              )}

              <button
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => {/* TODO: Show details modal */}}
              >
                Details
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
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

function getSeverityBorderClass(severity) {
  if (!severity) return 'border-gray-200';

  const code = severity.toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(code)) return 'border-blue-400';
  if (['E', 'F'].includes(code)) return 'border-amber-400';
  if (code === 'G') return 'border-orange-400';
  if (['H', 'I', 'J', 'K', 'L'].includes(code)) return 'border-red-500';

  return 'border-gray-200';
}

export default HealthSurveysTab;
