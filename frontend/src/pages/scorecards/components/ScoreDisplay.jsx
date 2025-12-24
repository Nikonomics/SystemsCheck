/**
 * ScoreDisplay - Formatted score display with color coding
 */
export function ScoreDisplay({ earned, possible, size = 'md', showPercentage = false }) {
  const percentage = possible > 0 ? (earned / possible) * 100 : 0;

  // Color coding based on percentage
  const getColorClass = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
    xl: 'text-xl font-bold',
  };

  // Format to 1 decimal place
  const formattedEarned = typeof earned === 'number'
    ? Math.round(earned * 10) / 10
    : 0;

  return (
    <span className={`${sizeClasses[size]} ${getColorClass()}`}>
      {formattedEarned}/{possible}
      {showPercentage && (
        <span className="text-gray-500 text-sm ml-1">
          ({Math.round(percentage)}%)
        </span>
      )}
    </span>
  );
}

/**
 * Calculate points for an audit item
 */
export function calculateItemPoints(maxPoints, chartsMet, sampleSize) {
  if (!sampleSize || sampleSize <= 0) return 0;
  if (!chartsMet || chartsMet < 0) return 0;

  const points = (maxPoints / sampleSize) * chartsMet;
  return Math.round(points * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate system total from items
 */
export function calculateSystemTotal(items) {
  if (!items || items.length === 0) return 0;

  const total = items.reduce((sum, item) => {
    const points = calculateItemPoints(
      item.maxPoints,
      item.chartsMet,
      item.sampleSize
    );
    return sum + points;
  }, 0);

  return Math.round(total * 10) / 10;
}
