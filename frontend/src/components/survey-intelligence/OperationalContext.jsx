import React, { useState } from 'react';
import MetricBar from './MetricBar';

/**
 * Expandable section showing operational context:
 * - Quadrant badge and explanation
 * - Individual metrics with status bars
 * - Threshold indicators
 */
const OperationalContext = ({ quadrant, capacityStrain, resourceScore, metrics }) => {
  const [expanded, setExpanded] = useState(true);

  const quadrantInfo = {
    'High Performing': {
      color: 'green',
      icon: '✅',
      description: 'High occupancy with adequate resources - optimal performance',
      insight: 'Continue current practices. Monitor for changes in occupancy or staffing.'
    },
    'Comfortable': {
      color: 'blue',
      icon: '✓',
      description: 'Lower occupancy with adequate resources - room to grow',
      insight: 'Stable position. Consider census growth strategies while maintaining quality.'
    },
    'Overextended': {
      color: 'orange',
      icon: '⚠️',
      description: 'High occupancy straining available resources',
      insight: 'Demand exceeds capacity. Prioritize resource enhancement or census management.'
    },
    'Struggling': {
      color: 'red',
      icon: '🚨',
      description: 'Low occupancy with inadequate resources - at risk',
      insight: 'Highest risk category. May indicate financial or operational distress. Urgent intervention needed.'
    }
  };

  const info = quadrantInfo[quadrant] || quadrantInfo['Comfortable'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex justify-between items-center hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.icon}</span>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Operational Context</h3>
            <p className="text-sm text-gray-500">{info.description}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-4 pb-4 border-t">
          {/* Capacity Strain Metrics */}
          <div className="py-4 border-b">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Capacity Strain</span>
                  <span className={`text-sm font-semibold ${
                    capacityStrain >= 50 ? 'text-red-600' :
                    capacityStrain >= 40 ? 'text-orange-600' :
                    capacityStrain >= 25 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {capacityStrain?.toFixed(1) || '--'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      capacityStrain >= 50 ? 'bg-red-500' :
                      capacityStrain >= 40 ? 'bg-orange-500' :
                      capacityStrain >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((capacityStrain || 0), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {capacityStrain >= 50 ? 'Critical' :
                   capacityStrain >= 40 ? 'High' :
                   capacityStrain >= 25 ? 'Moderate' : 'Low'} strain
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Resource Score</span>
                  <span className={`text-sm font-semibold ${
                    resourceScore >= 70 ? 'text-green-600' :
                    resourceScore >= 50 ? 'text-blue-600' :
                    resourceScore >= 30 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {resourceScore?.toFixed(1) || '--'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      resourceScore >= 70 ? 'bg-green-500' :
                      resourceScore >= 50 ? 'bg-blue-500' :
                      resourceScore >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((resourceScore || 0), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {resourceScore >= 70 ? 'Strong' :
                   resourceScore >= 50 ? 'Adequate' :
                   resourceScore >= 30 ? 'Limited' : 'Insufficient'} resources
                </p>
              </div>
            </div>
          </div>

          {/* Individual Metrics */}
          <div className="py-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Metrics</h4>

            <MetricBar
              label="Turnover"
              value={metrics.turnover.value}
              unit="%"
              status={metrics.turnover.status}
              target={metrics.turnover.target}
              thresholds={{ critical: 60, warning: 50, target: 40, excellent: 30 }}
              inverse={true}
            />

            <MetricBar
              label="RN Skill Mix"
              value={parseFloat(metrics.rn_skill_mix.value)}
              unit="%"
              status={metrics.rn_skill_mix.status}
              target={metrics.rn_skill_mix.target}
              thresholds={{ critical: 15, warning: 20, target: 25, excellent: 30 }}
            />

            <MetricBar
              label="RN Hours (HPRD)"
              value={metrics.rn_hours.value}
              unit=""
              status={metrics.rn_hours.status}
              target={metrics.rn_hours.target}
              thresholds={{ critical: 0.40, warning: 0.50, target: 0.50, excellent: 0.75 }}
              max={1.2}
            />

            <MetricBar
              label="Weekend Gap"
              value={parseFloat(metrics.weekend_gap.value)}
              unit="%"
              status={metrics.weekend_gap.status}
              target={metrics.weekend_gap.target}
              thresholds={{ critical: 30, warning: 20, target: 20, excellent: 10 }}
              inverse={true}
            />

            <MetricBar
              label="Occupancy"
              value={metrics.occupancy.value}
              unit="%"
              status={metrics.occupancy.status}
              target={metrics.occupancy.target}
              thresholds={{ critical: 50, warning: 60, target: 70, excellent: 80 }}
            />
          </div>

          {/* Insight */}
          <div className={`mt-2 p-3 rounded-lg ${
            quadrant === 'Struggling' ? 'bg-red-50' :
            quadrant === 'Overextended' ? 'bg-orange-50' :
            quadrant === 'Comfortable' ? 'bg-blue-50' : 'bg-green-50'
          }`}>
            <p className="text-sm">{info.insight}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalContext;
