import React from 'react';

/**
 * Horizontal bar showing value against thresholds
 * [Critical | Warning | Target | Excellent]
 *               ▲ Current value
 */
const MetricBar = ({
  label,
  value,
  unit = '',
  status,
  target,
  thresholds,
  inverse = false,
  max = 100
}) => {
  // Calculate position of current value on the bar
  const getPosition = () => {
    if (value === null || value === undefined) return 50;
    return Math.min(Math.max((value / max) * 100, 0), 100);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'CRITICAL': return 'text-red-600';
      case 'WARNING': return 'text-orange-600';
      case 'TARGET': return 'text-green-600';
      case 'EXCELLENT': return 'text-emerald-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'CRITICAL': return 'bg-red-500';
      case 'WARNING': return 'bg-orange-500';
      case 'TARGET': return 'bg-green-500';
      case 'EXCELLENT': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${getStatusColor()}`}>
            {value !== null && value !== undefined ? `${value}${unit}` : '--'}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
            status === 'WARNING' ? 'bg-orange-100 text-orange-700' :
            status === 'TARGET' ? 'bg-green-100 text-green-700' :
            status === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {status || 'N/A'}
          </span>
        </div>
      </div>

      {/* Threshold bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-gray-100">
        {/* Threshold zones */}
        {inverse ? (
          // For inverse metrics (lower is better), reverse the color order
          <>
            <div className="absolute inset-y-0 left-0 bg-emerald-200" style={{ width: `${(thresholds.excellent / max) * 100}%` }} />
            <div className="absolute inset-y-0 bg-green-200" style={{ left: `${(thresholds.excellent / max) * 100}%`, width: `${((thresholds.target - thresholds.excellent) / max) * 100}%` }} />
            <div className="absolute inset-y-0 bg-orange-200" style={{ left: `${(thresholds.target / max) * 100}%`, width: `${((thresholds.warning - thresholds.target) / max) * 100}%` }} />
            <div className="absolute inset-y-0 bg-red-200" style={{ left: `${(thresholds.warning / max) * 100}%`, right: 0 }} />
          </>
        ) : (
          // For normal metrics (higher is better)
          <>
            <div className="absolute inset-y-0 left-0 bg-red-200" style={{ width: `${(thresholds.critical / max) * 100}%` }} />
            <div className="absolute inset-y-0 bg-orange-200" style={{ left: `${(thresholds.critical / max) * 100}%`, width: `${((thresholds.warning - thresholds.critical) / max) * 100}%` }} />
            <div className="absolute inset-y-0 bg-green-200" style={{ left: `${(thresholds.warning / max) * 100}%`, width: `${((thresholds.excellent - thresholds.warning) / max) * 100}%` }} />
            <div className="absolute inset-y-0 bg-emerald-200" style={{ left: `${(thresholds.excellent / max) * 100}%`, right: 0 }} />
          </>
        )}

        {/* Current value indicator */}
        {value !== null && value !== undefined && (
          <div
            className={`absolute top-0 bottom-0 w-1 ${getStatusBg()} shadow-sm`}
            style={{ left: `${getPosition()}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 ${getStatusBg()} rounded-full border-2 border-white shadow`} />
          </div>
        )}
      </div>

      {/* Target label */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>Target: {target}</span>
        {thresholds.excellent && (
          <span>Excellent: {inverse ? `<${thresholds.excellent}${unit}` : `>${thresholds.excellent}${unit}`}</span>
        )}
      </div>
    </div>
  );
};

export default MetricBar;
