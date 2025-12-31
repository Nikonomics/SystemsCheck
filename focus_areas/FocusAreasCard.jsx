import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Shield,
  Activity,
  Heart,
  Pill,
  Bug,
  ArrowRightLeft,
  Users,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

/**
 * Clinical system icons
 */
const SYSTEM_ICONS = {
  1: Activity,      // Change of Condition
  2: AlertTriangle, // Accidents/Falls
  3: Heart,         // Skin
  4: Pill,          // Med Management
  5: Bug,           // Infection Control
  6: ArrowRightLeft, // Transfer/Discharge
  7: Users          // Abuse/Grievances
};

/**
 * Risk tier colors
 */
const RISK_COLORS = {
  'Very High': { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', badge: 'bg-red-500' },
  'High': { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', badge: 'bg-orange-500' },
  'Medium': { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-500' },
  'Low': { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', badge: 'bg-green-500' }
};

/**
 * Get risk tier from score
 */
const getRiskTier = (score) => {
  if (score >= 75) return 'Very High';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
};

/**
 * Format date
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Velocity indicator
 */
const VelocityIndicator = ({ velocity }) => {
  switch (velocity) {
    case 'improving':
      return (
        <span className="inline-flex items-center text-green-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          Improving
        </span>
      );
    case 'worsening':
      return (
        <span className="inline-flex items-center text-red-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          Worsening
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center text-gray-600">
          <Minus className="w-4 h-4 mr-1" />
          Stable
        </span>
      );
  }
};

/**
 * System Risk Score Bar
 */
const RiskScoreBar = ({ score, showLabel = true }) => {
  const tier = getRiskTier(score);
  const colors = RISK_COLORS[tier];

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.badge} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${colors.text} w-8 text-right`}>
          {score}
        </span>
      )}
    </div>
  );
};

/**
 * Expandable Focus Area Card
 */
const FocusAreaItem = ({ focusArea, isExpanded, onToggle }) => {
  const Icon = SYSTEM_ICONS[focusArea.system_id] || Activity;
  const tier = getRiskTier(focusArea.system_risk_score);
  const colors = RISK_COLORS[tier];

  return (
    <div className={`border rounded-lg ${colors.border} overflow-hidden mb-3`}>
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 ${colors.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.badge} text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${colors.badge} text-white px-2 py-0.5 rounded`}>
                #{focusArea.rank}
              </span>
              <span className="font-semibold text-gray-900">
                {focusArea.system_name}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {focusArea.evidence?.citation_history?.count_3yr || 0} citations in 3 years
              {focusArea.evidence?.citation_history?.had_ij && (
                <span className="ml-2 text-red-600 font-medium">• IJ History</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-2xl font-bold ${colors.text}`}>
              {focusArea.system_risk_score}
            </div>
            <div className="text-xs text-gray-500">Risk Score</div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white border-t">
          {/* Evidence Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Citation History */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Citation History
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {focusArea.evidence?.citation_history?.narrative || 'No citations in this system.'}
              </p>
              {focusArea.evidence?.citation_history?.repeat_ftags?.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs font-medium text-red-600">
                    Repeat F-Tags: {focusArea.evidence.citation_history.repeat_ftags.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Peer Comparison */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Peer Comparison
              </h4>
              <p className="text-sm text-gray-600">
                {focusArea.evidence?.peer_comparison?.narrative || 'Peer data not available.'}
              </p>
              {focusArea.evidence?.peer_comparison?.peer_group_size > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Compared to {focusArea.evidence.peer_comparison.peer_group_size} similar facilities
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {focusArea.recommendations?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Recommendations</h4>
              <div className="space-y-2">
                {focusArea.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2 rounded ${
                      rec.priority === 'High' ? 'bg-red-50' :
                      rec.priority === 'Medium' ? 'bg-yellow-50' : 'bg-gray-50'
                    }`}
                  >
                    {rec.priority === 'High' ? (
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : rec.priority === 'Medium' ? (
                      <Info className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{rec.area}</div>
                      <div className="text-xs text-gray-600">{rec.rationale}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* F-Tags to Review */}
          {focusArea.ftags_to_review?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">F-Tags to Review</h4>
              <div className="flex flex-wrap gap-2">
                {focusArea.ftags_to_review.map((ftag) => (
                  <span
                    key={ftag}
                    className="px-2 py-1 bg-gray-100 rounded text-sm font-mono"
                  >
                    F{ftag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scorecard Alignment */}
          {focusArea.scorecard_alignment?.audit_focus_items?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Audit Focus Items</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {focusArea.scorecard_alignment.audit_focus_items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Key Metrics Summary
 */
const KeyMetricsSummary = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border p-3">
        <div className="text-xs text-gray-500 mb-1">Citation Trend</div>
        <VelocityIndicator velocity={metrics.citation_velocity} />
      </div>
      <div className="bg-white rounded-lg border p-3">
        <div className="text-xs text-gray-500 mb-1">Repeat F-Tag Rate</div>
        <div className="text-lg font-semibold">
          {((metrics.repeat_ftag_rate || 0) * 100).toFixed(0)}%
        </div>
      </div>
      <div className="bg-white rounded-lg border p-3">
        <div className="text-xs text-gray-500 mb-1">Days Since Survey</div>
        <div className={`text-lg font-semibold ${metrics.survey_overdue ? 'text-red-600' : ''}`}>
          {metrics.days_since_last_survey || 'N/A'}
          {metrics.survey_overdue && (
            <span className="text-xs ml-1 text-red-500">Overdue</span>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg border p-3">
        <div className="text-xs text-gray-500 mb-1">Complaint Rate</div>
        <div className="text-lg font-semibold">
          {(metrics.complaint_survey_rate || 0).toFixed(1)}/yr
        </div>
      </div>
    </div>
  );
};

/**
 * Main Focus Areas Card Component
 */
const FocusAreasCard = ({ data, loading, error }) => {
  const [expandedSystems, setExpandedSystems] = useState(new Set([1])); // First one expanded by default

  const toggleSystem = (systemId) => {
    const newExpanded = new Set(expandedSystems);
    if (newExpanded.has(systemId)) {
      newExpanded.delete(systemId);
    } else {
      newExpanded.add(systemId);
    }
    setExpandedSystems(newExpanded);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Failed to load focus areas: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="text-gray-500 text-center">
          No focus area data available for this facility.
        </div>
      </div>
    );
  }

  const overallColors = RISK_COLORS[data.overall_risk_tier] || RISK_COLORS['Medium'];

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className={`p-4 ${overallColors.bg} border-b ${overallColors.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Focus Areas Analysis</h2>
            <p className="text-sm text-gray-600">
              Prioritized clinical systems for improvement
            </p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${overallColors.text}`}>
              {data.overall_risk_score}
            </div>
            <div className={`text-sm font-medium ${overallColors.badge} text-white px-2 py-0.5 rounded`}>
              {data.overall_risk_tier} Risk
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Key Metrics */}
        <KeyMetricsSummary metrics={data.key_metrics} />

        {/* Focus Areas List */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">
            Clinical Systems (Ranked by Risk)
          </h3>
          {data.focus_areas?.map((focusArea) => (
            <FocusAreaItem
              key={focusArea.system_id}
              focusArea={focusArea}
              isExpanded={expandedSystems.has(focusArea.rank)}
              onToggle={() => toggleSystem(focusArea.rank)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex items-center justify-between">
          <span>
            <Clock className="w-3 h-3 inline mr-1" />
            Calculated: {formatDate(data.calculated_at)}
          </span>
          <span>Model v{data.model_version}</span>
        </div>
      </div>
    </div>
  );
};

export default FocusAreasCard;
