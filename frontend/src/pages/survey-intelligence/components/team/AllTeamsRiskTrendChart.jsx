/**
 * AllTeamsRiskTrendChart.jsx
 * Multi-line chart showing risk trends for all teams
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import {
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';

const AllTeamsRiskTrendChart = ({ data, months, onMonthsChange, loading }) => {
  // Track which teams are visible
  const [visibleTeams, setVisibleTeams] = useState({});

  // Initialize visibility when data loads
  useMemo(() => {
    if (data?.teams && Object.keys(visibleTeams).length === 0) {
      const initial = {};
      data.teams.forEach(team => {
        initial[team.teamId] = true;
      });
      setVisibleTeams(initial);
    }
  }, [data?.teams]);

  // Transform data for Recharts (needs unified data points)
  const chartData = useMemo(() => {
    if (!data?.teams || data.teams.length === 0) return [];

    // Use the first team's data structure as base
    const firstTeam = data.teams.find(t => t.data?.length > 0);
    if (!firstTeam) return [];

    return firstTeam.data.map((point, index) => {
      const dataPoint = {
        month: point.month,
        monthLabel: point.monthLabel
      };

      // Add each team's risk score
      data.teams.forEach(team => {
        if (team.data?.[index]) {
          dataPoint[`team_${team.teamId}`] = team.data[index].riskScore;
        }
      });

      return dataPoint;
    });
  }, [data?.teams]);

  // Toggle team visibility
  const toggleTeam = (teamId) => {
    setVisibleTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  // Toggle all teams
  const toggleAllTeams = (visible) => {
    const updated = {};
    data?.teams?.forEach(team => {
      updated[team.teamId] = visible;
    });
    setVisibleTeams(updated);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Sort by risk score descending
      const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2 mb-2">
            {label}
          </p>
          <div className="space-y-1.5">
            {sortedPayload.map((entry, index) => {
              const team = data?.teams?.find(t => `team_${t.teamId}` === entry.dataKey);
              if (!team) return null;

              const riskColor = entry.value > 70 ? 'text-red-600' :
                entry.value > 40 ? 'text-amber-600' : 'text-green-600';

              return (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-700 truncate max-w-[140px]">
                      {team.teamName}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold ${riskColor}`}>
                    {entry.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if all teams are visible or hidden
  const allVisible = data?.teams?.every(t => visibleTeams[t.teamId]);
  const allHidden = data?.teams?.every(t => !visibleTeams[t.teamId]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">All Teams Risk Trend</h2>
          </div>

          {/* Time Range Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => onMonthsChange?.(m)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  months === m
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {m}mo
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Compare risk scores across all teams over time
        </p>
      </div>

      {/* Chart */}
      <div className="p-4">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
              <span>Loading trend data...</span>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Risk level reference lines */}
                <ReferenceLine
                  y={70}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{
                    value: 'High',
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 10
                  }}
                />
                <ReferenceLine
                  y={40}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Moderate',
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 10
                  }}
                />

                {/* Team lines */}
                {data?.teams?.map((team) => (
                  visibleTeams[team.teamId] && (
                    <Line
                      key={team.teamId}
                      type="monotone"
                      dataKey={`team_${team.teamId}`}
                      name={team.teamName}
                      stroke={team.color}
                      strokeWidth={2}
                      dot={{ fill: team.color, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0, fill: team.color }}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No trend data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend / Team Toggles */}
      {data?.teams && data.teams.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Teams
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAllTeams(true)}
                disabled={allVisible}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  allVisible
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Eye className="w-3 h-3" />
                Show All
              </button>
              <button
                onClick={() => toggleAllTeams(false)}
                disabled={allHidden}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  allHidden
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <EyeOff className="w-3 h-3" />
                Hide All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.teams.map((team) => (
              <button
                key={team.teamId}
                onClick={() => toggleTeam(team.teamId)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                  visibleTeams[team.teamId]
                    ? 'bg-white border border-gray-200 shadow-sm'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-opacity ${
                    visibleTeams[team.teamId] ? 'opacity-100' : 'opacity-40'
                  }`}
                  style={{ backgroundColor: team.color }}
                />
                <span className={visibleTeams[team.teamId] ? 'text-gray-900' : 'text-gray-500'}>
                  {team.teamName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTeamsRiskTrendChart;
