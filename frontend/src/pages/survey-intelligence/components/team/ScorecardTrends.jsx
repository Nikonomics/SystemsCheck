/**
 * ScorecardTrends.jsx
 * Monthly scorecard performance trends
 */

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

const ScorecardTrends = ({ data }) => {
  if (!data) return null;

  const { teamName, trends, systemTrends } = data;

  // Calculate overall trend direction
  const overallTrend = useMemo(() => {
    if (trends.length < 2) return 'stable';
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, t) => sum + (t.avgScore || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + (t.avgScore || 0), 0) / secondHalf.length;
    
    if (secondAvg - firstAvg > 2) return 'improving';
    if (firstAvg - secondAvg > 2) return 'declining';
    return 'stable';
  }, [trends]);

  // Format month label
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Mini sparkline component
  const Sparkline = ({ data: sparkData, color = 'blue' }) => {
    if (!sparkData || sparkData.length === 0) return <span className="text-gray-400 text-xs">No data</span>;

    const scores = sparkData.map(d => d.avgScore).filter(s => s !== null);
    if (scores.length === 0) return <span className="text-gray-400 text-xs">No data</span>;

    const max = Math.max(...scores, 100);
    const min = Math.min(...scores, 0);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = scores.map((score, i) => {
      const x = (i / (scores.length - 1 || 1)) * width;
      const y = height - ((score - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const colorMap = {
      blue: '#3b82f6',
      green: '#22c55e',
      red: '#ef4444',
      yellow: '#eab308'
    };

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={colorMap[color] || colorMap.blue}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // Get trend icon
  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'improving':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Scorecard Trends</h2>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            overallTrend === 'improving' ? 'bg-green-100 text-green-700' :
            overallTrend === 'declining' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {getTrendIcon(overallTrend)}
            <span className="capitalize">{overallTrend}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Team average audit scores over time</p>
      </div>

      {/* Overall Trend Chart */}
      <div className="p-4 border-b border-gray-200">
        {trends.length > 0 ? (
          <div className="flex items-end justify-between gap-2 h-32">
            {trends.map((month, index) => {
              const score = month.avgScore || 0;
              const heightPercent = Math.max((score / 100) * 100, 5);

              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-xs font-medium ${
                    score >= 85 ? 'text-green-600' :
                    score >= 75 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {score}
                  </span>
                  <div 
                    className={`w-full rounded-t transition-all ${
                      score >= 85 ? 'bg-green-500' :
                      score >= 75 ? 'bg-yellow-500' :
                      score > 0 ? 'bg-red-500' :
                      'bg-gray-200'
                    }`}
                    style={{ height: `${heightPercent}px`, minHeight: '4px' }}
                  ></div>
                  <span className="text-xs text-gray-500">{formatMonth(month.month)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No scorecard data available yet</p>
          </div>
        )}
      </div>

      {/* Per-System Mini Trends */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">By Clinical System</h3>
        <div className="space-y-2">
          {systemTrends.map((system) => {
            const scores = system.data.map(d => d.avgScore).filter(s => s !== null);
            const currentAvg = scores.length > 0 
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : null;

            // Determine color based on current average
            const color = currentAvg === null ? 'gray' :
              currentAvg >= 85 ? 'green' :
              currentAvg >= 75 ? 'yellow' : 'red';

            return (
              <div 
                key={system.systemNumber}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                    {system.systemNumber}
                  </span>
                  <span className="text-sm text-gray-700">{system.systemName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Sparkline data={system.data} color={color} />
                  <span className={`text-sm font-semibold w-10 text-right ${
                    currentAvg === null ? 'text-gray-400' :
                    currentAvg >= 85 ? 'text-green-600' :
                    currentAvg >= 75 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {currentAvg !== null ? `${currentAvg}%` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 rounded-b-lg">
        <p className="text-sm text-blue-800">
          💡 Internal scorecard scores help identify gaps before surveyors find them. 
          Target 85%+ across all systems.
        </p>
      </div>
    </div>
  );
};

export default ScorecardTrends;
