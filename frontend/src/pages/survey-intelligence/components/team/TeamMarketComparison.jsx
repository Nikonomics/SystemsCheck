/**
 * TeamMarketComparison.jsx
 * Team vs State vs National benchmarks
 */

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MapPin,
  Globe
} from 'lucide-react';

const TeamMarketComparison = ({ data }) => {
  if (!data) return null;

  const { teamName, state, comparison, insight } = data;

  // Metric comparison component
  const MetricComparison = ({ label, team, stateVal, national, higherIsBetter = false }) => {
    const teamVsState = team - stateVal;
    const isGood = higherIsBetter ? teamVsState >= 0 : teamVsState <= 0;

    return (
      <div className="py-3 border-b border-gray-100 last:border-0">
        <div className="text-sm text-gray-600 mb-2">{label}</div>
        <div className="flex items-center justify-between gap-4">
          {/* Team */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                {team}
              </span>
              {teamVsState !== 0 && (
                <span className={`flex items-center text-xs ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                  {teamVsState > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      +{Math.abs(teamVsState).toFixed(1)}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      {Math.abs(teamVsState).toFixed(1)}
                    </>
                  )}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">Team</span>
          </div>

          {/* State */}
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">{stateVal}</div>
            <span className="text-xs text-gray-500">{state}</span>
          </div>

          {/* National */}
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-500">{national}</div>
            <span className="text-xs text-gray-500">National</span>
          </div>
        </div>

        {/* Progress bar comparison */}
        <div className="mt-2 relative h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* National marker */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-gray-400 z-10"
            style={{ left: `${Math.min((national / Math.max(team, stateVal, national)) * 100, 100)}%` }}
          ></div>
          {/* State bar */}
          <div 
            className="absolute top-0 h-full bg-blue-300 rounded-full"
            style={{ width: `${Math.min((stateVal / Math.max(team, stateVal, national, 1)) * 100, 100)}%` }}
          ></div>
          {/* Team bar */}
          <div 
            className={`absolute top-0 h-full ${isGood ? 'bg-green-500' : 'bg-red-500'} rounded-full opacity-80`}
            style={{ width: `${Math.min((team / Math.max(team, stateVal, national, 1)) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Market Comparison</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Team vs {state} vs National averages
        </p>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Team (better)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Team (worse)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-300"></div>
          <span className="text-gray-600">State</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4">
        <MetricComparison
          label="Citations per Facility (yearly)"
          team={comparison.citationsPerFacility.team}
          stateVal={comparison.citationsPerFacility.state}
          national={comparison.citationsPerFacility.national}
          higherIsBetter={false}
        />
        <MetricComparison
          label="Immediate Jeopardy Rate (%)"
          team={comparison.ijRate.team}
          stateVal={comparison.ijRate.state}
          national={comparison.ijRate.national}
          higherIsBetter={false}
        />
      </div>

      {/* Insight */}
      {insight && (
        <div className={`px-4 py-3 border-t rounded-b-lg ${
          comparison.citationsPerFacility.team <= comparison.citationsPerFacility.state
            ? 'bg-green-50 border-green-100'
            : 'bg-amber-50 border-amber-100'
        }`}>
          <p className={`text-sm ${
            comparison.citationsPerFacility.team <= comparison.citationsPerFacility.state
              ? 'text-green-800'
              : 'text-amber-800'
          }`}>
            💡 {insight}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamMarketComparison;
