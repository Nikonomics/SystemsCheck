import { useState, useEffect } from 'react';
import {
  Star,
  AlertTriangle,
  AlertCircle,
  Calendar,
  DollarSign,
  Flame,
  ClipboardCheck,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { getSurveySummary } from '../../../api/cms';

// Star rating colors based on CMS 5-star system
const STAR_COLORS = {
  5: '#10B981', // green
  4: '#84CC16', // lime
  3: '#EAB308', // yellow
  2: '#F97316', // orange
  1: '#EF4444', // red
};

const STAR_BG_COLORS = {
  5: 'bg-green-50 border-green-200',
  4: 'bg-lime-50 border-lime-200',
  3: 'bg-yellow-50 border-yellow-200',
  2: 'bg-orange-50 border-orange-200',
  1: 'bg-red-50 border-red-200',
};

export function OverviewTab({ ccn, facilityName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ccn) {
      loadSurveySummary();
    }
  }, [ccn]);

  const loadSurveySummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSurveySummary(ccn);
      if (result.success) {
        setData(result.summary);
      } else {
        setError(result.error || 'Failed to load survey summary');
      }
    } catch (err) {
      console.error('Error loading survey summary:', err);
      setError('Failed to load survey data');
    } finally {
      setLoading(false);
    }
  };

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

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-gray-500">No survey data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { ratings, lastHealthSurvey, lastFireSafetySurvey, cycle1Deficiencies, penalties, alerts } = data;

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <AlertsSection alerts={alerts} />
      )}

      {/* Star Ratings Row */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">CMS Star Ratings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StarRatingCard
            title="Overall Rating"
            rating={ratings?.overall}
            icon={Star}
          />
          <StarRatingCard
            title="Health Inspection"
            rating={ratings?.health}
            icon={ClipboardCheck}
          />
          <StarRatingCard
            title="Quality Measures"
            rating={ratings?.qm}
            icon={Star}
          />
          <StarRatingCard
            title="Staffing"
            rating={ratings?.staffing}
            icon={Star}
          />
        </div>
      </div>

      {/* Key Metrics Row */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Cycle 1 Health Deficiencies"
            value={cycle1Deficiencies?.health ?? 'N/A'}
            icon={ClipboardCheck}
            color={getDeficiencyColor(cycle1Deficiencies?.health)}
          />
          <MetricCard
            title="Cycle 1 Fire Safety Deficiencies"
            value={cycle1Deficiencies?.fireSafety ?? 'N/A'}
            icon={Flame}
            color={getDeficiencyColor(cycle1Deficiencies?.fireSafety)}
          />
          <MetricCard
            title="Last Health Survey"
            value={formatDate(lastHealthSurvey?.date)}
            subtitle={lastHealthSurvey ? `${lastHealthSurvey.deficiencyCount} deficiencies` : null}
            icon={Calendar}
          />
          <MetricCard
            title="Last Fire Survey"
            value={formatDate(lastFireSafetySurvey?.date)}
            subtitle={lastFireSafetySurvey ? `${lastFireSafetySurvey.deficiencyCount} deficiencies` : null}
            icon={Calendar}
          />
        </div>
      </div>

      {/* Penalties Section */}
      {(penalties?.totalFines > 0 || penalties?.penaltyCount > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Penalties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {penalties.totalFines > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-red-100">
                      <DollarSign className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-red-600 font-medium">Total Fines</p>
                      <p className="text-2xl font-bold text-red-700">
                        ${penalties.totalFines.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {penalties.penaltyCount > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="py-4">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-orange-600 font-medium">Penalty Count</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {penalties.penaltyCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Last Survey Details */}
      {(lastHealthSurvey || lastFireSafetySurvey) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Survey Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lastHealthSurvey && (
              <SurveyDetailCard
                title="Last Health Survey"
                survey={lastHealthSurvey}
                icon={ClipboardCheck}
              />
            )}
            {lastFireSafetySurvey && (
              <SurveyDetailCard
                title="Last Fire Safety Survey"
                survey={lastFireSafetySurvey}
                icon={Flame}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StarRatingCard({ title, rating, icon: Icon }) {
  const numRating = parseInt(rating) || 0;
  const color = STAR_COLORS[numRating] || '#9CA3AF';
  const bgClass = STAR_BG_COLORS[numRating] || 'bg-gray-50 border-gray-200';

  return (
    <Card className={`${bgClass} border`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <div className="flex items-center mt-2">
              {rating ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5"
                      fill={i < numRating ? color : 'none'}
                      stroke={i < numRating ? color : '#D1D5DB'}
                    />
                  ))}
                  <span
                    className="ml-2 text-lg font-bold"
                    style={{ color }}
                  >
                    {rating}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Not rated</span>
              )}
            </div>
          </div>
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900'}`}>
              {value}
            </p>
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

function SurveyDetailCard({ title, survey, icon: Icon }) {
  const severityColors = {
    A: 'bg-green-100 text-green-800',
    B: 'bg-green-100 text-green-800',
    C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-yellow-100 text-yellow-800',
    E: 'bg-orange-100 text-orange-800',
    F: 'bg-orange-100 text-orange-800',
    G: 'bg-red-100 text-red-800',
    H: 'bg-red-100 text-red-800',
    I: 'bg-red-100 text-red-800',
    J: 'bg-red-200 text-red-900',
    K: 'bg-red-200 text-red-900',
    L: 'bg-red-300 text-red-900',
  };

  const severityClass = severityColors[survey.maxSeverity] || 'bg-gray-100 text-gray-800';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-500" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Date</span>
            <span className="font-medium">{formatDate(survey.date)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Type</span>
            <span className="font-medium">{survey.type}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Deficiencies</span>
            <span className="font-medium">{survey.deficiencyCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Max Severity</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${severityClass}`}>
              {survey.maxSeverity || 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsSection({ alerts }) {
  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const config = getAlertConfig(alert.type, alert.severity);
        return (
          <div
            key={index}
            className={`p-4 rounded-lg border ${config.bgClass} ${config.borderClass}`}
          >
            <div className="flex items-start">
              <config.icon className={`h-5 w-5 mt-0.5 ${config.iconClass}`} />
              <div className="ml-3">
                <p className={`font-medium ${config.textClass}`}>
                  {alert.message}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getAlertConfig(type, severity) {
  if (severity === 'critical' || type === 'sff' || type === 'abuse') {
    return {
      icon: AlertTriangle,
      bgClass: 'bg-red-50',
      borderClass: 'border-red-200',
      iconClass: 'text-red-600',
      textClass: 'text-red-800',
    };
  }
  if (severity === 'warning' || type === 'old_survey' || type === 'sprinkler') {
    return {
      icon: AlertCircle,
      bgClass: 'bg-yellow-50',
      borderClass: 'border-yellow-200',
      iconClass: 'text-yellow-600',
      textClass: 'text-yellow-800',
    };
  }
  return {
    icon: Info,
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    iconClass: 'text-blue-600',
    textClass: 'text-blue-800',
  };
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

function getDeficiencyColor(count) {
  if (count === null || count === undefined) return 'text-gray-500';
  if (count === 0) return 'text-green-600';
  if (count <= 5) return 'text-yellow-600';
  if (count <= 10) return 'text-orange-600';
  return 'text-red-600';
}

export default OverviewTab;
