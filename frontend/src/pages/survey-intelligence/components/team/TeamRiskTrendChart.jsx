/**
 * TeamRiskTrendChart.jsx
 * Historical team risk score trend over the last 12 months
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from 'lucide-react';

const TeamRiskTrendChart = ({ data }) => {
  if (!data) return null;

  const { teamName, facilityCount, trend } = data;

  // Calculate trend direction
  const trendDirection = useMemo(() => {
    if (!trend || trend.length < 2) return 'stable';
    const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
    const secondHalf = trend.slice(Math.floor(trend.length / 2));

    const firstAvg = firstHalf.reduce((sum, t) => sum + t.riskScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.riskScore, 0) / secondHalf.length;

    if (secondAvg - firstAvg > 5) return 'worsening';
    if (firstAvg - secondAvg > 5) return 'improving';
    return 'stable';
  }, [trend]);

  // Get current and previous risk scores
  const currentRisk = trend?.[trend.length - 1]?.riskScore || 0;
  const previousRisk = trend?.[trend.length - 2]?.riskScore || currentRisk;
  const changeFromPrevious = currentRisk - previousRisk;

  // Color based on risk level
  const getRiskColor = (score) => {
    if (score > 70) return '#ef4444'; // red
    if (score > 40) return '#f59e0b'; // amber
    return '#22c55e'; // green
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">{data.monthLabel}</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getRiskColor(data.riskScore) }}
            ></span>
            <span className="text-sm text-gray-600">Risk Score:</span>
            <span className="text-sm font-semibold" style={{ color: getRiskColor(data.riskScore) }}>
              {data.riskScore}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{data.riskLevel} Risk</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Risk Score Trend</h2>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trendDirection === 'improving' ? 'bg-green-100 text-green-700' :
            trendDirection === 'worsening' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {trendDirection === 'improving' ? (
              <TrendingDown className="w-4 h-4" />
            ) : trendDirection === 'worsening' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            <span className="capitalize">{trendDirection}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Team average risk score over the last 12 months
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200">
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current</p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: getRiskColor(currentRisk) }}
          >
            {currentRisk}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Change</p>
          <p className={`text-2xl font-bold mt-1 ${
            changeFromPrevious > 0 ? 'text-red-600' :
            changeFromPrevious < 0 ? 'text-green-600' :
            'text-gray-600'
          }`}>
            {changeFromPrevious > 0 ? '+' : ''}{changeFromPrevious}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Facilities</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{facilityCount}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {trend && trend.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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

                {/* Area fill */}
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  fill="url(#riskGradient)"
                  stroke="none"
                />

                {/* Line */}
                <Line
                  type="monotone"
                  dataKey="riskScore"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No trend data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-purple-50 border-t border-purple-100 rounded-b-lg">
        <p className="text-sm text-purple-800">
          {currentRisk > 70 ? (
            <>Risk score is HIGH. Focus on facilities with the most citations and IJ deficiencies.</>
          ) : currentRisk > 40 ? (
            <>Risk score is MODERATE. Continue monitoring and address common issues across facilities.</>
          ) : (
            <>Risk score is LOW. Maintain current practices and conduct regular audits.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default TeamRiskTrendChart;
