import React from 'react';

/**
 * Reusable score display component
 * Shows score number, tier, and color-coded indicator
 */
const ScoreCard = ({ title, score, tier, subtitle, type = 'default' }) => {
  // Determine colors based on type and score
  const getColors = () => {
    if (type === 'risk') {
      // Higher risk = more red
      if (tier === 'Critical') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', score: 'text-red-600' };
      if (tier === 'High') return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', score: 'text-orange-600' };
      if (tier === 'Moderate') return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', score: 'text-yellow-600' };
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', score: 'text-green-600' };
    }

    if (type === 'audit') {
      // Higher audit score = more green
      if (tier === 'Excellent') return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', score: 'text-green-600' };
      if (tier === 'Good') return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', score: 'text-blue-600' };
      if (tier === 'Fair') return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', score: 'text-yellow-600' };
      if (tier === 'Poor') return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', score: 'text-orange-600' };
      if (tier === 'Critical') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', score: 'text-red-600' };
      return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', score: 'text-gray-400' };
    }

    if (type === 'focus') {
      // Higher focus score = more concern (higher priority)
      if (score >= 70) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', score: 'text-red-600' };
      if (score >= 50) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', score: 'text-orange-600' };
      if (score >= 30) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', score: 'text-yellow-600' };
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', score: 'text-green-600' };
    }

    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', score: 'text-gray-600' };
  };

  const colors = getColors();

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors.text} bg-white`}>
          {tier}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${colors.score}`}>
          {score !== null && score !== undefined ? score : '--'}
        </span>
        {type !== 'focus' && <span className="text-sm text-gray-500">/ 100</span>}
      </div>

      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}

      {/* Progress bar for score */}
      {score !== null && score !== undefined && (
        <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              type === 'risk' ? (
                score >= 75 ? 'bg-red-500' :
                score >= 55 ? 'bg-orange-500' :
                score >= 35 ? 'bg-yellow-500' : 'bg-green-500'
              ) : type === 'audit' ? (
                score >= 90 ? 'bg-green-500' :
                score >= 75 ? 'bg-blue-500' :
                score >= 60 ? 'bg-yellow-500' :
                score >= 40 ? 'bg-orange-500' : 'bg-red-500'
              ) : (
                score >= 70 ? 'bg-red-500' :
                score >= 50 ? 'bg-orange-500' :
                score >= 30 ? 'bg-yellow-500' : 'bg-green-500'
              )
            }`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
