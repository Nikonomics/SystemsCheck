/**
 * ClinicalSystemsBreakdown Component
 *
 * Displays F-tags mapped to the 7 internal clinical audit systems:
 * - System Name | CMS Risk | Your Score | Gap | F-tags | View →
 * Shows scorecard alignment with CMS survey findings
 */

import {
  AlertTriangle,
  Info,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { ClinicalSystemsTakeaway } from './SectionTakeaway';

/**
 * Risk badge component
 */
const RiskBadge = ({ level }) => {
  const config = {
    high: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'High'
    },
    moderate: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Moderate'
    },
    low: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Low'
    }
  };

  const { bg, text, label } = config[level] || config.low;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

/**
 * Gap indicator component
 */
const GapIndicator = ({ gap, gapStatus }) => {
  if (gap === null) {
    return <span className="text-gray-400 text-sm">N/A</span>;
  }

  const isAbove = gapStatus === 'above';
  const Icon = isAbove ? TrendingUp : TrendingDown;
  const color = isAbove ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">
        {gap > 0 ? '+' : ''}{gap}%
      </span>
    </div>
  );
};

/**
 * Score display with threshold indicator
 */
const ScoreDisplay = ({ score, threshold }) => {
  if (score === null) {
    return <span className="text-gray-400 text-sm">No Scorecard</span>;
  }

  const isAboveThreshold = score >= threshold;
  const color = isAboveThreshold ? 'text-green-600' : 'text-red-600';

  return (
    <div className="flex items-center gap-1">
      {isAboveThreshold ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm font-semibold ${color}`}>
        {Math.round(score)}%
      </span>
    </div>
  );
};

/**
 * F-tag pills
 */
const FTagPills = ({ tags }) => {
  if (!tags || tags.length === 0) {
    return <span className="text-gray-400 text-sm">No citations</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tagData) => (
        <span
          key={tagData.tag}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          title={tagData.tagDescription || tagData.tagName}
        >
          {tagData.tagFormatted || tagData.tag}
          {tagData.count > 1 && <span className="ml-1 text-gray-500">×{tagData.count}</span>}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
          +{tags.length - 3}
        </span>
      )}
    </div>
  );
};

/**
 * System row component
 */
const SystemRow = ({ system, threshold, onViewClick }) => {
  const hasIssue = system.cmsRisk !== 'low' && system.gap !== null && system.gap < 0;

  return (
    <tr className={`${hasIssue ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {hasIssue && (
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-gray-900">
            {system.systemName}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <RiskBadge level={system.cmsRisk} />
      </td>
      <td className="px-4 py-3">
        <ScoreDisplay score={system.scorecardScore} threshold={threshold} />
      </td>
      <td className="px-4 py-3">
        <GapIndicator gap={system.gap} gapStatus={system.gapStatus} />
      </td>
      <td className="px-4 py-3">
        <FTagPills tags={system.fTags} />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onViewClick?.(system)}
          className="p-1 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          title="View system details"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </td>
    </tr>
  );
};

/**
 * Summary alert for systems needing attention
 */
const AttentionAlert = ({ systems }) => {
  if (!systems || systems.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-red-800">
            {systems.length} System{systems.length > 1 ? 's' : ''} Needing Attention
          </h4>
          <p className="text-sm text-red-600 mt-1">
            These systems have CMS risk with scorecard scores below the 85% threshold:
          </p>
          <ul className="mt-2 space-y-1">
            {systems.map(sys => (
              <li key={sys.name} className="text-sm text-red-700">
                <span className="font-medium">{sys.name}</span>
                <span className="text-red-500 ml-2">
                  ({sys.scorecardScore ? `${Math.round(sys.scorecardScore)}%` : 'No score'}, {sys.gap}% gap)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export function ClinicalSystemsBreakdown({ data, loading, error, onViewSystem }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
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
            {data?.message || 'No clinical systems data available'}
          </p>
        </div>
      </div>
    );
  }

  const { systems, threshold, summary, scorecardDate } = data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Clinical Systems Breakdown</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Maps CMS deficiency tags to SystemsCheck's 7 clinical audit systems. Shows where regulatory risk aligns with your internal audits. Gap shows your scorecard score vs the {threshold}% target.
            </p>
          </div>
          {scorecardDate && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Latest Scorecard</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(scorecardDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Attention Alert */}
      {summary.systemsNeedingAttention.length > 0 && (
        <div className="px-6 pt-4">
          <AttentionAlert systems={summary.systemsNeedingAttention} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                System
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CMS Risk
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Your Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gap
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                F-Tags
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                View
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {systems.map(system => (
              <SystemRow
                key={system.systemId}
                system={system}
                threshold={threshold}
                onViewClick={onViewSystem}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600">High Risk: {summary.highRiskCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">
                Moderate: {systems.filter(s => s.cmsRisk === 'moderate').length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-gray-600">
                Low: {systems.filter(s => s.cmsRisk === 'low').length}
              </span>
            </div>
          </div>
          {summary.highRiskSystems.length > 0 && (
            <div className="text-red-600 font-medium">
              High Risk: {summary.highRiskSystems.join(', ')}
            </div>
          )}
        </div>

        {/* Takeaway */}
        <ClinicalSystemsTakeaway systems={systems} summary={summary} />
      </div>
    </div>
  );
}

export default ClinicalSystemsBreakdown;
