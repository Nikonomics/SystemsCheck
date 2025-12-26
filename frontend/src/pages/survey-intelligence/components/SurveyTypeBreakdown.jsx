/**
 * SurveyTypeBreakdown Component
 *
 * Displays deficiencies grouped by survey type:
 * - Standard Health Surveys (annual recertification)
 * - Complaint Surveys (investigations)
 * - Fire Safety Surveys (K-tags, E-tags)
 * - Infection Control Surveys (focused IC)
 */

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  MessageSquareWarning,
  Flame,
  Bug,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Shield
} from 'lucide-react';
import { SurveyTimelineVisual } from './SurveyTimelineVisual';

/**
 * Severity badge component
 */
const SeverityBadge = ({ severity }) => {
  if (!severity) return null;

  const colors = {
    'A': 'bg-gray-100 text-gray-600',
    'B': 'bg-blue-100 text-blue-700',
    'C': 'bg-blue-200 text-blue-800',
    'D': 'bg-blue-300 text-blue-900',
    'E': 'bg-yellow-200 text-yellow-800',
    'F': 'bg-yellow-300 text-yellow-900',
    'G': 'bg-orange-300 text-orange-900',
    'H': 'bg-red-200 text-red-800',
    'I': 'bg-red-300 text-red-900',
    'J': 'bg-red-400 text-white',
    'K': 'bg-red-500 text-white',
    'L': 'bg-red-600 text-white'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${colors[severity] || 'bg-gray-100 text-gray-600'}`}>
      {severity}
    </span>
  );
};

/**
 * Survey type card configuration
 */
const SURVEY_TYPE_CONFIG = {
  standard: {
    icon: ClipboardCheck,
    title: 'Standard Health Surveys',
    subtitle: 'Annual recertification surveys',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600'
  },
  complaint: {
    icon: MessageSquareWarning,
    title: 'Complaint Surveys',
    subtitle: 'Investigations from complaints',
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600',
    warning: 'Complaint surveys often indicate systemic issues that warrant immediate attention'
  },
  infectionControl: {
    icon: Bug,
    title: 'Infection Control Surveys',
    subtitle: 'Focused infection control inspections',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600'
  },
  fireSafety: {
    icon: Flame,
    title: 'Fire Safety Surveys',
    subtitle: 'Life Safety Code & Emergency Preparedness',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600'
  }
};

/**
 * Individual survey type card
 */
const SurveyTypeCard = ({ type, data, config, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const Icon = config.icon;

  if (!data || data.surveyCount === 0) {
    return (
      <div className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-4 opacity-60`}>
        <div className="flex items-center gap-3">
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
          <div>
            <h4 className="font-semibold text-gray-900">{config.title}</h4>
            <p className="text-sm text-gray-500">No surveys in the past 3 years</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 ${config.borderColor} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full ${config.bgColor} p-4 text-left hover:brightness-95 transition-all`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Icon className={`h-6 w-6 ${config.iconColor} mt-0.5`} />
            <div>
              <h4 className="font-semibold text-gray-900">{config.title}</h4>
              <p className="text-sm text-gray-500">{config.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{data.surveyCount}</p>
              <p className="text-xs text-gray-500">surveys</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-2 bg-white/50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">{data.totalDeficiencies}</p>
            <p className="text-xs text-gray-500">deficiencies</p>
          </div>
          <div className="text-center p-2 bg-white/50 rounded-lg">
            <p className="text-lg font-bold text-gray-900">{data.avgDeficienciesPerSurvey}</p>
            <p className="text-xs text-gray-500">avg per survey</p>
          </div>
          {data.stateAverage !== undefined && (
            <div className="text-center p-2 bg-white/50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                {data.vsStateAverage > 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : data.vsStateAverage < 0 ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-400" />
                )}
                <p className={`text-lg font-bold ${
                  data.vsStateAverage > 0 ? 'text-red-600' :
                  data.vsStateAverage < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {data.vsStateAverage > 0 ? '+' : ''}{data.vsStateAverage.toFixed(1)}
                </p>
              </div>
              <p className="text-xs text-gray-500">vs state avg</p>
            </div>
          )}
          {type === 'fireSafety' && (
            <div className="text-center p-2 bg-white/50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                {data.lifeSafetyCount} K / {data.emergencyPrepCount} E
              </p>
              <p className="text-xs text-gray-500">tags</p>
            </div>
          )}
        </div>

        {/* Warning for complaint surveys */}
        {config.warning && data.surveyCount > 0 && (
          <div className="mt-3 flex items-start gap-2 p-2 bg-orange-100 rounded-lg">
            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800">{config.warning}</p>
          </div>
        )}

        {/* F880 note for infection control */}
        {data.f880Note && (
          <div className="mt-3 flex items-start gap-2 p-2 bg-purple-100 rounded-lg">
            <Info className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-800">{data.f880Note}</p>
          </div>
        )}

        {/* Sprinkler status for fire safety */}
        {type === 'fireSafety' && data.sprinklerStatus && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-white/50 rounded-lg">
            <Shield className="h-4 w-4 text-gray-500" />
            <p className="text-xs text-gray-600">
              Sprinkler Status: <span className="font-medium">{data.sprinklerStatus}</span>
            </p>
          </div>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white p-4 space-y-4">
          {/* Top Tags */}
          {data.topTags && data.topTags.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Top Cited Tags</h5>
              <div className="space-y-2">
                {data.topTags.map((tag, idx) => (
                  <div key={tag.tag} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg" title={tag.tagDescription}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-gray-900">{tag.tagFormatted || tag.tag}</span>
                        {tag.systemName && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded flex-shrink-0">
                            {tag.systemName}
                          </span>
                        )}
                      </div>
                      {tag.tagName && tag.tagName !== 'Unknown Tag' && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{tag.tagName}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 flex-shrink-0 ml-2">{tag.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Survey List */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Survey History</h5>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.surveys.map((survey, idx) => (
                <div key={`${survey.date}-${idx}`} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(survey.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <SeverityBadge severity={survey.maxSeverity} />
                    </div>
                    <span className="text-sm text-gray-600">{survey.deficiencyCount} deficiencies</span>
                  </div>

                  {/* Top deficiencies */}
                  {survey.deficiencies && survey.deficiencies.length > 0 && (
                    <div className="space-y-1">
                      {survey.deficiencies.slice(0, 3).map((def, defIdx) => (
                        <div key={`${def.tag}-${defIdx}`} className="flex items-start gap-2 text-xs">
                          <span className="font-mono font-medium text-gray-700 flex-shrink-0">{def.tag}</span>
                          <SeverityBadge severity={def.severity} />
                          {def.text && (
                            <span className="text-gray-500 truncate">{def.text}</span>
                          )}
                        </div>
                      ))}
                      {survey.deficiencies.length > 3 && (
                        <p className="text-xs text-gray-400">
                          +{survey.deficiencies.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function SurveyTypeBreakdown({ data, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {data?.message || 'No survey data available'}
          </p>
        </div>
      </div>
    );
  }

  const { surveyTypes, summary } = data;

  // Combine all surveys for the visual timeline
  const allSurveys = useMemo(() => {
    const surveys = [];
    if (surveyTypes.standard?.surveys) {
      surveyTypes.standard.surveys.forEach(s => surveys.push({ ...s, type: 'standard' }));
    }
    if (surveyTypes.complaint?.surveys) {
      surveyTypes.complaint.surveys.forEach(s => surveys.push({ ...s, type: 'complaint' }));
    }
    if (surveyTypes.fireSafety?.surveys) {
      surveyTypes.fireSafety.surveys.forEach(s => surveys.push({ ...s, type: 'fireSafety' }));
    }
    if (surveyTypes.infectionControl?.surveys) {
      surveyTypes.infectionControl.surveys.forEach(s => surveys.push({ ...s, type: 'infectionControl' }));
    }
    return surveys.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [surveyTypes]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Survey Type Breakdown</h3>
        <p className="text-sm text-gray-500 mt-1">
          Your surveys grouped by type. Standard = annual recertification. Complaint = investigation triggered by a complaint. Fire Safety = Life Safety Code. Each type has different implications.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {summary.totalSurveys} surveys, {summary.totalDeficiencies} total deficiencies
        </p>
      </div>

      {/* Visual Timeline */}
      {allSurveys.length > 0 && (
        <div className="px-6 pt-4">
          <SurveyTimelineVisual surveys={allSurveys} />
        </div>
      )}

      {/* Cards Grid */}
      <div className="p-6 pt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SurveyTypeCard
          type="standard"
          data={surveyTypes.standard}
          config={SURVEY_TYPE_CONFIG.standard}
        />
        <SurveyTypeCard
          type="complaint"
          data={surveyTypes.complaint}
          config={SURVEY_TYPE_CONFIG.complaint}
        />
        <SurveyTypeCard
          type="infectionControl"
          data={surveyTypes.infectionControl}
          config={SURVEY_TYPE_CONFIG.infectionControl}
        />
        <SurveyTypeCard
          type="fireSafety"
          data={surveyTypes.fireSafety}
          config={SURVEY_TYPE_CONFIG.fireSafety}
        />
      </div>
    </div>
  );
}

export default SurveyTypeBreakdown;
