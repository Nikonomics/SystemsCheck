/**
 * RiskScoreCard Component
 *
 * Displays the overall risk score (0-100) with visual gauge,
 * percentile ranking, and breakdown of contributing factors.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Repeat,
  Target,
  ChevronDown,
  ChevronUp,
  Calendar,
  Info
} from 'lucide-react';
import { RiskScoreTakeaway } from './SectionTakeaway';

/**
 * Get color classes based on risk level
 */
const getRiskColors = (level) => {
  switch (level) {
    case 'low':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        fill: 'bg-green-500',
        label: 'Low Risk'
      };
    case 'moderate':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        fill: 'bg-yellow-500',
        label: 'Moderate Risk'
      };
    case 'high':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        fill: 'bg-red-500',
        label: 'High Risk'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        fill: 'bg-gray-500',
        label: 'Unknown'
      };
  }
};

/**
 * Factor row component
 */
const FactorRow = ({ icon: Icon, label, score, detail, weight }) => {
  const percentage = Math.round(score || 0);
  const contribution = Math.round((score || 0) * (weight || 0));

  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">{percentage}/100</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              percentage < 40 ? 'bg-green-500' :
              percentage < 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {detail && (
          <p className="text-xs text-gray-500 mt-1">{detail}</p>
        )}
      </div>
    </div>
  );
};

export function RiskScoreCard({ data, loading, error }) {
  const [showFactors, setShowFactors] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
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
            {data?.message || 'No CMS data available for this facility'}
          </p>
        </div>
      </div>
    );
  }

  const { riskScore, factors, surveyTiming, facility } = data;
  const colors = getRiskColors(riskScore.level);

  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Header */}
      <div className="px-6 pt-4 pb-2">
        <h3 className="text-lg font-semibold text-gray-900">Risk Score</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Composite score based on survey history, severity trends, repeat citations, and state market alignment. Higher scores indicate greater regulatory risk.
        </p>
      </div>

      <div className="p-6 pt-2">
        <div className="text-center">
          {/* Risk Score Circle */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(riskScore.score / 100) * 352} 352`}
                className={colors.text}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${colors.text}`}>
                {riskScore.score}
              </span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Risk Score</span>
            </div>
          </div>

          {/* Risk Level Label */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors.fill} text-white font-medium`}>
            {colors.label}
          </div>

          {/* Percentile */}
          <p className="mt-3 text-sm text-gray-600">
            Better than <span className="font-semibold">{riskScore.percentileBetterThan}%</span> of {facility.state} facilities
          </p>
        </div>

        {/* Survey Timing */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Last Survey</p>
            <p className="text-sm font-medium text-gray-900">
              {surveyTiming.lastSurveyDate
                ? new Date(surveyTiming.lastSurveyDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'Never'
              }
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Clock className="h-5 w-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Months Ago</p>
            <p className="text-sm font-medium text-gray-900">
              {surveyTiming.monthsSinceSurvey ?? 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Target className="h-5 w-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Est. Window</p>
            <p className="text-sm font-medium text-gray-900">
              {surveyTiming.estimatedWindow || 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Factors Breakdown (Expandable) */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setShowFactors(!showFactors)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-white/50 transition-colors"
        >
          <span>Score Breakdown</span>
          {showFactors ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showFactors && (
          <div className="px-6 pb-6 space-y-1 bg-white/50">
            <FactorRow
              icon={Clock}
              label="Survey Recency"
              score={factors.surveyRecency.score}
              weight={factors.surveyRecency.weight}
              detail={`${factors.surveyRecency.monthsSinceSurvey ?? 0} months since last survey`}
            />
            <FactorRow
              icon={AlertTriangle}
              label="History Severity"
              score={factors.historySeverity.score}
              weight={factors.historySeverity.weight}
              detail={`Max severity: ${factors.historySeverity.maxSeverity || 'None'}, ${factors.historySeverity.totalDeficiencies} total deficiencies`}
            />
            <FactorRow
              icon={Repeat}
              label="Repeat Rate"
              score={factors.repeatRate.score}
              weight={factors.repeatRate.weight}
              detail={`${factors.repeatRate.repeatedTagCount} of ${factors.repeatRate.totalTagCount} tags repeated (${factors.repeatRate.rate}%)`}
            />
            <FactorRow
              icon={TrendingUp}
              label="Market Alignment"
              score={factors.marketAlignment.score}
              weight={factors.marketAlignment.weight}
              detail={`${factors.marketAlignment.matchingHotTags} of your tags are trending in state`}
            />
            {factors.internalAudits.message && (
              <div className="pt-2 text-xs text-gray-500 italic">
                {factors.internalAudits.message}
              </div>
            )}

            {/* Takeaway */}
            <RiskScoreTakeaway riskScore={riskScore} surveyTiming={surveyTiming} />
          </div>
        )}
      </div>
    </div>
  );
}

export default RiskScoreCard;
