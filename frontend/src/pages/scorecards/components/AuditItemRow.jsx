import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { calculateItemPoints } from './ScoreDisplay';

/**
 * AuditItemRow - Single audit item row in the form
 */
export function AuditItemRow({
  item,
  index,
  onChange,
  disabled = false,
  onNavigateNext,
  isLastItem = false,
}) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const chartsMetRef = useRef(null);
  const sampleSizeRef = useRef(null);

  const points = calculateItemPoints(item.maxPoints, item.chartsMet, item.sampleSize);

  // Validation
  const hasWarning = item.chartsMet > 0 && (!item.sampleSize || item.sampleSize <= 0);
  const hasError = item.chartsMet > item.sampleSize && item.sampleSize > 0;

  const handleChange = (field, value) => {
    // Parse numeric values
    let parsedValue = value;
    if (field === 'chartsMet' || field === 'sampleSize') {
      parsedValue = value === '' ? null : parseInt(value, 10);
      if (parsedValue !== null && isNaN(parsedValue)) return;
      if (parsedValue !== null && parsedValue < 0) parsedValue = 0;
    }

    onChange(item.id, { [field]: parsedValue });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'chartsMet') {
        // Move to sample size in same row
        sampleSizeRef.current?.focus();
        sampleSizeRef.current?.select();
      } else if (field === 'sampleSize') {
        // Move to next row's charts met OR trigger navigation to next system
        if (onNavigateNext) {
          onNavigateNext();
        }
      }
    }
  };

  // Get percentage color
  const getPointsColor = () => {
    if (!item.sampleSize || item.sampleSize <= 0) return 'text-gray-400';
    const pct = (points / item.maxPoints) * 100;
    if (pct >= 90) return 'text-green-600 bg-green-50';
    if (pct >= 75) return 'text-blue-600 bg-blue-50';
    if (pct >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <>
      <tr className={`hover:bg-gray-50 ${hasError ? 'bg-red-50' : ''}`}>
        {/* Item number */}
        <td className="px-3 py-3 text-sm text-gray-500 text-center w-12">
          {index + 1}
        </td>

        {/* Criteria text */}
        <td className="px-3 py-3">
          <div className="text-sm text-gray-900">{item.criteriaText}</div>
          {(hasWarning || hasError) && (
            <div className={`flex items-center mt-1 text-xs ${hasError ? 'text-red-600' : 'text-yellow-600'}`}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {hasError
                ? 'Charts met cannot exceed sample size'
                : 'Enter sample size for this item'}
            </div>
          )}
        </td>

        {/* Max Points */}
        <td className="px-3 py-3 text-sm text-gray-500 text-center w-20">
          {item.maxPoints}
        </td>

        {/* Charts Met */}
        <td className="px-3 py-3 w-24">
          <input
            ref={chartsMetRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={item.chartsMet ?? ''}
            onChange={(e) => handleChange('chartsMet', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'chartsMet')}
            disabled={disabled}
            className={`
              w-full px-2 py-1.5 text-sm text-center border rounded-md
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${hasError ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="0"
            data-item-id={item.id}
            data-field="chartsMet"
          />
        </td>

        {/* Sample Size */}
        <td className="px-3 py-3 w-24">
          <input
            ref={sampleSizeRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={item.sampleSize ?? ''}
            onChange={(e) => handleChange('sampleSize', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'sampleSize')}
            disabled={disabled}
            className={`
              w-full px-2 py-1.5 text-sm text-center border rounded-md
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${hasWarning ? 'border-yellow-500' : 'border-gray-300'}
            `}
            placeholder="—"
            data-item-id={item.id}
            data-field="sampleSize"
          />
        </td>

        {/* Points Earned */}
        <td className="px-3 py-3 w-24">
          <div
            className={`
              px-2 py-1.5 text-sm text-center font-medium rounded-md
              ${getPointsColor()}
            `}
          >
            {points.toFixed(1)}
          </div>
        </td>

        {/* Notes toggle */}
        <td className="px-3 py-3 w-20 text-center">
          <button
            type="button"
            onClick={() => setNotesExpanded(!notesExpanded)}
            disabled={disabled && !item.notes}
            className={`
              inline-flex items-center px-2 py-1 text-xs font-medium rounded
              ${item.notes
                ? 'text-primary-700 bg-primary-100 hover:bg-primary-200'
                : disabled
                  ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
              }
            `}
          >
            {notesExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            <span className="ml-1">{item.notes ? 'View' : 'Add'}</span>
          </button>
        </td>
      </tr>

      {/* Notes row (expanded) */}
      {notesExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-3 py-3">
            <div className="pl-12">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Notes for Item {index + 1}
              </label>
              {disabled ? (
                <p className="text-sm text-gray-700 bg-white p-3 rounded-md border border-gray-200">
                  {item.notes || <span className="text-gray-400 italic">No notes</span>}
                </p>
              ) : (
                <textarea
                  value={item.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={2}
                  className="
                    w-full px-3 py-2 text-sm border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    resize-none
                  "
                  placeholder="Add notes for this item..."
                />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
