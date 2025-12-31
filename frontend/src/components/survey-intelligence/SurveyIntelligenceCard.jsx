import React from 'react';
import ScoreCard from './ScoreCard';
import OperationalContext from './OperationalContext';
import RecommendationsPanel from './RecommendationsPanel';
import ChainContext from './ChainContext';
import GapAnalysis from './GapAnalysis';

/**
 * Main Survey Intelligence display component
 * Shows all three scores plus operational context and recommendations
 */
const SurveyIntelligenceCard = ({ data, loading = false, compact = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No Survey Intelligence data available</p>
      </div>
    );
  }

  const { scores, operational_context, recommendations, chain_context, gap_analysis, metadata } = data;

  return (
    <div className="space-y-6">
      {/* Header with Facility Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{data.facility_name}</h2>
            <p className="text-sm text-gray-500">{data.location} • CCN: {data.ccn}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              operational_context.quadrant === 'Struggling' ? 'bg-red-100 text-red-800' :
              operational_context.quadrant === 'Overextended' ? 'bg-orange-100 text-orange-800' :
              operational_context.quadrant === 'Comfortable' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {operational_context.quadrant_badge} {operational_context.quadrant}
            </span>
            {metadata?.calculated_at && (
              <p className="text-xs text-gray-400 mt-1">
                Updated: {new Date(metadata.calculated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Three Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard
          title="Survey Risk"
          score={scores.survey_risk.score}
          tier={scores.survey_risk.tier}
          subtitle={`${scores.survey_risk.lagging_component} lagging + ${scores.survey_risk.leading_component} leading`}
          type="risk"
        />

        <ScoreCard
          title="Top Focus Area"
          score={scores.focus_areas?.[0]?.score || 0}
          tier={scores.focus_areas?.[0]?.system || 'N/A'}
          subtitle={scores.focus_areas?.length ? `${scores.focus_areas.length} areas identified` : 'No focus areas'}
          type="focus"
        />

        <ScoreCard
          title="Audit Score"
          score={scores.audit_score?.score}
          tier={scores.audit_score?.tier || 'No Data'}
          subtitle={scores.audit_score ? 'From scorecards' : 'No audit data'}
          type="audit"
        />
      </div>

      {/* Alert Flags */}
      {operational_context.alert_flags?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">⚠️ Alert Flags</h3>
          <div className="space-y-2">
            {operational_context.alert_flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                  flag.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {flag.severity}
                </span>
                <div>
                  <span className="font-medium text-gray-900">{flag.name.replace(/_/g, ' ')}</span>
                  <p className="text-sm text-gray-600">{flag.message}</p>
                  <p className="text-xs text-red-600">{flag.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational Context (expandable) */}
      {!compact && (
        <OperationalContext
          quadrant={operational_context.quadrant}
          capacityStrain={operational_context.capacity_strain}
          resourceScore={operational_context.resource_score}
          metrics={operational_context.metrics}
        />
      )}

      {/* Gap Analysis */}
      {!compact && gap_analysis && (
        <GapAnalysis
          status={gap_analysis.status}
          insight={gap_analysis.insight}
          surveyRiskScore={gap_analysis.survey_risk_score}
          auditScore={gap_analysis.audit_score}
        />
      )}

      {/* Recommendations */}
      {!compact && recommendations?.length > 0 && (
        <RecommendationsPanel recommendations={recommendations} />
      )}

      {/* Chain Context */}
      {!compact && chain_context && !chain_context.is_independent && (
        <ChainContext context={chain_context} />
      )}

      {/* Focus Areas Detail */}
      {!compact && scores.focus_areas?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Focus Areas Priority</h3>
          <div className="space-y-2">
            {scores.focus_areas.map((area, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-red-100 text-red-800' :
                    i === 1 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {area.rank}
                  </span>
                  <span className="font-medium">{area.system}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        area.score >= 70 ? 'bg-red-500' :
                        area.score >= 50 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${area.score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{area.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyIntelligenceCard;
