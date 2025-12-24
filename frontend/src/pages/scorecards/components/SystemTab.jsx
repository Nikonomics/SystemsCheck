import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AuditItemRow } from './AuditItemRow';
import { ResidentsSection } from './ResidentsSection';
import { ScoreDisplay, calculateSystemTotal } from './ScoreDisplay';

// System instructions
const systemInstructions = {
  1: 'Review resident records for appropriate identification and response to changes in condition. Assess documentation quality, timeliness of notifications, and clinical interventions.',
  2: 'Evaluate fall prevention protocols, post-fall assessments, incident reporting, and QAPI processes. Review care plan updates and intervention effectiveness.',
  3: 'Assess skin integrity documentation, wound care protocols, Braden Scale assessments, and treatment compliance. Verify picture documentation per policy.',
  4: 'Review medication reconciliation, MAR accuracy, administration practices, storage compliance, and weight monitoring. Assess psychotropic medication use and GDR attempts.',
  5: 'Evaluate infection control practices, antibiotic stewardship, surveillance systems, and PPE compliance. Review treatment protocols and care plan documentation.',
  6: 'Assess transfer and discharge processes, documentation completeness, patient education, and care coordination. Review follow-up scheduling and communication.',
  7: 'Review abuse prevention training, allegation investigation protocols, state reporting compliance, and grievance resolution. Assess resident protection measures.',
  8: 'Observe call light response, resident appearance, room conditions, dining assistance, staff interactions, and activity engagement. Conduct resident/family satisfaction interviews.',
};

/**
 * SystemTab - Full system form with audit items and residents
 */
export function SystemTab({
  system,
  onItemChange,
  onAddResident,
  onRemoveResident,
  disabled = false,
}) {
  // Calculate system total
  const systemTotal = useMemo(() => {
    return calculateSystemTotal(system.items || []);
  }, [system.items]);

  // Check if all items have data
  const isComplete = useMemo(() => {
    if (!system.items || system.items.length === 0) return false;
    return system.items.every(
      item => item.sampleSize && item.sampleSize > 0 && item.chartsMet !== null && item.chartsMet !== undefined
    );
  }, [system.items]);

  // Handle navigation to next row's chartsMet field
  const handleNavigateToNextRow = useCallback((currentIndex) => {
    const items = system.items || [];
    const nextIndex = currentIndex + 1;

    if (nextIndex < items.length) {
      // Focus next row's chartsMet field
      setTimeout(() => {
        const nextInput = document.querySelector(
          `input[data-item-id="${items[nextIndex].id}"][data-field="chartsMet"]`
        );
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 0);
    }
  }, [system.items]);

  const instructions = systemInstructions[system.systemNumber] || '';

  return (
    <div className="space-y-4">
      {/* System header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            System {system.systemNumber}: {system.systemName}
          </h2>
          {instructions && (
            <p className="text-sm text-gray-500 mt-1">{instructions}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {isComplete ? (
              <span className="flex items-center text-green-600">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Complete
              </span>
            ) : (
              <span className="text-gray-400">In progress</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase">System Total</div>
            <ScoreDisplay earned={systemTotal} possible={100} size="lg" />
          </div>
        </div>
      </div>

      {/* Audit items table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criteria
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Max Pts
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  # Met
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Sample
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Points
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(system.items || []).map((item, index) => (
                <AuditItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  onChange={onItemChange}
                  disabled={disabled}
                  onNavigateNext={() => handleNavigateToNextRow(index)}
                  isLastItem={index === (system.items?.length || 0) - 1}
                />
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={5} className="px-3 py-3 text-right font-medium text-gray-900">
                  System {system.systemNumber} Total:
                </td>
                <td className="px-3 py-3 text-center">
                  <ScoreDisplay earned={systemTotal} possible={100} size="lg" />
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Residents section */}
      <ResidentsSection
        residents={system.residents || []}
        onAdd={(resident) => onAddResident(system.id, resident)}
        onRemove={(residentId) => onRemoveResident(system.id, residentId)}
        disabled={disabled}
      />
    </div>
  );
}
