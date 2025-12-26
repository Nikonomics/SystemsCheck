/**
 * SeverityBadge Component
 *
 * Displays a CMS scope/severity code as a color-coded badge.
 * Scope/severity codes range from A-L with increasing severity.
 */

// Severity color mapping based on CMS scope/severity grid
const SEVERITY_CONFIG = {
  // Minimal severity - no actual harm
  A: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Isolated - No harm' },
  B: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pattern - No harm' },
  C: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Widespread - No harm' },
  // Potential for harm
  D: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Isolated - Potential harm' },
  E: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pattern - Potential harm' },
  F: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Widespread - Potential harm' },
  // Actual harm
  G: { bg: 'bg-orange-200', text: 'text-orange-900', label: 'Isolated - Actual harm' },
  H: { bg: 'bg-red-200', text: 'text-red-900', label: 'Pattern - Actual harm' },
  I: { bg: 'bg-red-200', text: 'text-red-900', label: 'Widespread - Actual harm' },
  // Immediate jeopardy
  J: { bg: 'bg-red-500', text: 'text-white', label: 'Isolated - Immediate jeopardy' },
  K: { bg: 'bg-red-500', text: 'text-white', label: 'Pattern - Immediate jeopardy' },
  L: { bg: 'bg-red-600', text: 'text-white', label: 'Widespread - Immediate jeopardy' },
};

const DEFAULT_CONFIG = { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Unknown' };

export function SeverityBadge({ code, showTooltip = true, size = 'md' }) {
  if (!code) return null;

  const upperCode = code.toUpperCase();
  const config = SEVERITY_CONFIG[upperCode] || DEFAULT_CONFIG;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs min-w-[20px]',
    md: 'px-2 py-1 text-sm min-w-[24px]',
    lg: 'px-3 py-1.5 text-base min-w-[28px]',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-semibold rounded
        ${config.bg} ${config.text} ${sizeClasses[size]}
      `}
      title={showTooltip ? config.label : undefined}
    >
      {upperCode}
    </span>
  );
}

/**
 * Get severity level description
 */
export function getSeverityDescription(code) {
  if (!code) return 'Unknown';
  const config = SEVERITY_CONFIG[code.toUpperCase()];
  return config?.label || 'Unknown';
}

/**
 * Get severity color class for custom styling
 */
export function getSeverityColorClass(code) {
  if (!code) return 'text-gray-500';
  const config = SEVERITY_CONFIG[code.toUpperCase()];
  return config?.text || 'text-gray-500';
}

export default SeverityBadge;
