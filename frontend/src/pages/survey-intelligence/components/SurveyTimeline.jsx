/**
 * SurveyTimeline Component
 *
 * Vertical timeline showing chronological survey history with:
 * - Survey dates, types, deficiency counts
 * - Severity badges and repeat indicators
 * - Pattern detection narratives
 */

import { useState } from 'react';
import {
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Repeat,
  Calendar,
  Activity
} from 'lucide-react';

/**
 * Severity badge with color
 */
const SeverityBadge = ({ severity, size = 'sm' }) => {
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

  const isIJ = ['H', 'I', 'J', 'K', 'L'].includes(severity);
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded font-bold ${sizeClasses} ${colors[severity] || 'bg-gray-100 text-gray-600'}`}>
      {severity}
      {isIJ && <span className="ml-1 text-xs opacity-75">IJ</span>}
    </span>
  );
};

/**
 * Year marker for timeline
 */
const YearMarker = ({ year }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="w-20 text-right">
      <span className="text-lg font-bold text-gray-400">{year}</span>
    </div>
    <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
  </div>
);

/**
 * Single survey entry in timeline
 */
const TimelineEntry = ({ survey, stateAvg, isFirst, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const surveyDate = new Date(survey.date);
  const month = surveyDate.toLocaleDateString('en-US', { month: 'short' });
  const day = surveyDate.getDate();

  // Determine comparison indicator
  const comparisonValue = survey.vsStateAverage;
  const ComparisonIcon = comparisonValue > 2 ? TrendingUp :
                         comparisonValue < -2 ? TrendingDown : Minus;
  const comparisonColor = comparisonValue > 2 ? 'text-red-500' :
                          comparisonValue < -2 ? 'text-green-500' : 'text-gray-400';

  return (
    <div className="flex gap-4">
      {/* Date Column */}
      <div className="w-20 text-right flex-shrink-0 pt-1">
        <div className="text-sm font-medium text-gray-900">{month} {day}</div>
      </div>

      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full border-4 ${
          survey.hasIJ ? 'bg-red-500 border-red-200' :
          survey.deficiencyCount > 5 ? 'bg-orange-500 border-orange-200' :
          'bg-blue-500 border-blue-200'
        }`}></div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 min-h-[24px]"></div>}
      </div>

      {/* Content Card */}
      <div className="flex-1 pb-6">
        <div
          className={`border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
            survey.hasIJ ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Card Header */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-600">{survey.type || 'Health Survey'}</span>
                  <SeverityBadge severity={survey.maxSeverity} size="lg" />
                  {survey.hasIJ && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      Immediate Jeopardy
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="font-semibold text-gray-900">
                    {survey.deficiencyCount} deficiencies
                  </span>
                  <div className="flex items-center gap-1">
                    <ComparisonIcon className={`h-4 w-4 ${comparisonColor}`} />
                    <span className={comparisonColor}>
                      {comparisonValue > 0 ? '+' : ''}{comparisonValue.toFixed(1)} vs state avg
                    </span>
                  </div>
                  {survey.repeatCount > 0 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Repeat className="h-3 w-3" />
                      <span>{survey.repeatCount} repeats</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-gray-400">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>

            {/* Top 3 Deficiencies Preview */}
            {!isExpanded && survey.topDeficiencies && survey.topDeficiencies.length > 0 && (
              <div className="mt-3 space-y-1">
                {survey.topDeficiencies.map((def, idx) => (
                  <div key={`${def.tag}-${idx}`} className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-medium text-gray-700">{def.tag}</span>
                    <SeverityBadge severity={def.severity} />
                    {def.isRepeat && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-medium">
                        REPEAT
                      </span>
                    )}
                    {def.severityChange === 'worsened' && (
                      <span className="text-red-500 text-xs flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" /> worse
                      </span>
                    )}
                    <span className="text-gray-500 text-xs truncate flex-1">
                      {def.systemName && def.systemName !== 'Other' ? def.systemName : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">All Deficiencies</h5>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {survey.deficiencies?.map((def, idx) => (
                  <div
                    key={`${def.tag}-${idx}`}
                    className={`p-2 rounded-lg ${def.isRepeat ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-100'}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-medium text-gray-900">{def.tag}</span>
                      <SeverityBadge severity={def.severity} />
                      {def.isRepeat && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-medium">
                          REPEAT
                        </span>
                      )}
                      {def.severityChange && (
                        <span className={`text-xs flex items-center gap-0.5 ${
                          def.severityChange === 'worsened' ? 'text-red-500' :
                          def.severityChange === 'improved' ? 'text-green-500' : 'text-gray-400'
                        }`}>
                          {def.severityChange === 'worsened' ? <TrendingUp className="h-3 w-3" /> :
                           def.severityChange === 'improved' ? <TrendingDown className="h-3 w-3" /> :
                           <Minus className="h-3 w-3" />}
                          {def.previousSeverity && `from ${def.previousSeverity}`}
                        </span>
                      )}
                      {def.systemName && def.systemName !== 'Other' && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {def.systemName}
                        </span>
                      )}
                    </div>
                    {def.text && (
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">{def.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Pattern summary card
 */
const PatternCard = ({ pattern }) => {
  const isIncreasing = pattern.pattern === 'increasing';
  const isDecreasing = pattern.pattern === 'decreasing';

  return (
    <div className={`p-3 rounded-lg border ${
      isIncreasing ? 'bg-red-50 border-red-200' :
      isDecreasing ? 'bg-green-50 border-green-200' :
      'bg-orange-50 border-orange-200'
    }`}>
      <div className="flex items-start gap-2">
        {isIncreasing ? (
          <TrendingUp className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
        ) : isDecreasing ? (
          <TrendingDown className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Repeat className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${
            isIncreasing ? 'text-red-800' :
            isDecreasing ? 'text-green-800' :
            'text-orange-800'
          }`}>
            {pattern.narrative}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Severity: {pattern.severityProgression}
          </p>
        </div>
      </div>
    </div>
  );
};

export function SurveyTimeline({ data, loading, error }) {
  const [showAllPatterns, setShowAllPatterns] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 h-32 bg-gray-100 rounded-xl"></div>
              </div>
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
            {data?.message || 'No survey timeline data available'}
          </p>
        </div>
      </div>
    );
  }

  const { surveys, patterns, summary, stateAvgPerSurvey } = data;

  // Group surveys by year for timeline markers
  const surveysByYear = {};
  surveys.forEach(survey => {
    const year = new Date(survey.date).getFullYear();
    if (!surveysByYear[year]) {
      surveysByYear[year] = [];
    }
    surveysByYear[year].push(survey);
  });

  const years = Object.keys(surveysByYear).sort((a, b) => b - a);

  // Display patterns (limit to 5 unless expanded)
  const displayPatterns = showAllPatterns ? patterns : patterns.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Survey Timeline</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {summary.totalSurveys} surveys over {summary.yearsSpanned} years
              {summary.ijSurveys > 0 && (
                <span className="text-red-600 ml-2">
                  ({summary.ijSurveys} with Immediate Jeopardy)
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">State Avg Per Survey</p>
            <p className="text-lg font-bold text-gray-900">{stateAvgPerSurvey}</p>
          </div>
        </div>
      </div>

      {/* Pattern Summaries */}
      {patterns && patterns.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <h4 className="text-sm font-medium text-gray-700">Pattern Analysis</h4>
            </div>
            {patterns.length > 5 && (
              <button
                onClick={() => setShowAllPatterns(!showAllPatterns)}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {showAllPatterns ? 'Show less' : `Show all ${patterns.length}`}
              </button>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {displayPatterns.map((pattern, idx) => (
              <PatternCard key={`${pattern.tag}-${idx}`} pattern={pattern} />
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="p-6">
        {years.map((year, yearIdx) => (
          <div key={year}>
            <YearMarker year={year} />
            {surveysByYear[year].map((survey, idx) => {
              const isLastInYear = idx === surveysByYear[year].length - 1;
              const isLastOverall = yearIdx === years.length - 1 && isLastInYear;

              return (
                <TimelineEntry
                  key={`${survey.date}-${idx}`}
                  survey={survey}
                  stateAvg={stateAvgPerSurvey}
                  isFirst={yearIdx === 0 && idx === 0}
                  isLast={isLastOverall}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SurveyTimeline;
