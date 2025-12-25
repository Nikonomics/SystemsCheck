import { useState, useMemo, useCallback, useEffect, Fragment } from 'react';
import { CheckCircle, XCircle, User, FileText, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { AuditItemRow } from './AuditItemRow';
import { ResidentsSection } from './ResidentsSection';
import { ScoreDisplay, calculateSystemTotal } from './ScoreDisplay';

// Natural sort for item numbers like "1", "2", "2a", "2b", "3", etc.
const sortItemNumber = (a, b) => {
  const aNum = parseInt(a.itemNumber) || 0;
  const bNum = parseInt(b.itemNumber) || 0;
  if (aNum !== bNum) return aNum - bNum;
  // Same number, sort by suffix (a < b < c, etc.)
  const aSuffix = a.itemNumber.replace(/^\d+/, '');
  const bSuffix = b.itemNumber.replace(/^\d+/, '');
  return aSuffix.localeCompare(bSuffix);
};

// Section definitions for systems that have groupings
// Maps systemNumber -> array of sections with starting item numbers
const systemSections = {
  2: [
    { name: "ACCIDENTS (Falls, Incident Reports)", startItem: "1" },
    { name: "Wandering and Elopement F689", startItem: "11" }
  ],
  3: [
    { name: "SKIN MANAGEMENTS", startItem: "1" }
  ],
  4: [
    { name: "MEDICATION MGMT", startItem: "1" },
    { name: "PSYCH. MGMT", startItem: "4" },
    { name: "Weight Loss", startItem: "13" }
  ],
  5: [
    { name: "Infection Control", startItem: "1" }
  ],
  6: [
    { name: "TRANSFER/DISCHARGES", startItem: "1" }
  ],
  7: [
    { name: "ABUSE/ SELF REPORT/ GRIEVANCE REVIEW", startItem: "1" }
  ]
};

// Helper to check if an item starts a new section
const getSectionForItem = (systemNumber, itemNumber) => {
  const sections = systemSections[systemNumber];
  if (!sections) return null;
  return sections.find(s => s.startItem === itemNumber);
};

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

// Format date for display
const formatCompletionDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

/**
 * SystemTab - Full system form with audit items and residents
 */
export function SystemTab({
  system,
  onItemChange,
  onAddResident,
  onRemoveResident,
  onMarkComplete,
  onClearComplete,
  onNotesChange,
  currentUserId,
  disabled = false,
}) {
  // Local state for notes with debounced save
  const [localNotes, setLocalNotes] = useState(system.notes || '');
  const [notesSaveStatus, setNotesSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'typing'

  // Sync local notes when system changes (e.g., switching tabs)
  useEffect(() => {
    setLocalNotes(system.notes || '');
    setNotesSaveStatus('saved');
  }, [system.id, system.notes]);

  // Debounced save for notes
  useEffect(() => {
    if (localNotes === (system.notes || '')) {
      return; // No change
    }

    setNotesSaveStatus('typing');

    const timeout = setTimeout(() => {
      if (onNotesChange) {
        setNotesSaveStatus('saving');
        onNotesChange(system.systemNumber, localNotes)
          .then(() => setNotesSaveStatus('saved'))
          .catch(() => setNotesSaveStatus('saved')); // Reset on error
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timeout);
  }, [localNotes, system.notes, system.systemNumber, onNotesChange]);

  const handleNotesChange = (e) => {
    setLocalNotes(e.target.value);
  };
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

  // Check completion status
  const isMarkedComplete = !!system.completedById;
  const completedByName = system.completedBy
    ? `${system.completedBy.firstName} ${system.completedBy.lastName}`
    : null;

  return (
    <div className="space-y-4">
      {/* Completion status banner */}
      {isMarkedComplete && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div className="flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">
              Completed by {completedByName}
            </span>
            <span className="text-green-600 ml-2">
              on {formatCompletionDate(system.completedAt)}
            </span>
          </div>
          {!disabled && onClearComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClearComplete(system.systemNumber)}
              className="text-green-700 hover:text-green-800 hover:bg-green-100"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}

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
                All items scored
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
              {[...(system.items || [])]
                .sort(sortItemNumber)
                .map((item, index) => {
                  const section = getSectionForItem(system.systemNumber, item.itemNumber);
                  return (
                    <Fragment key={item.id}>
                      {section && (
                        <tr className="bg-blue-50">
                          <td colSpan={7} className="px-3 py-2 text-sm font-semibold text-blue-800 uppercase tracking-wide">
                            {section.name}
                          </td>
                        </tr>
                      )}
                      <AuditItemRow
                        item={item}
                        index={index}
                        onChange={onItemChange}
                        disabled={disabled}
                        onNavigateNext={() => handleNavigateToNextRow(index)}
                        isLastItem={index === (system.items?.length || 0) - 1}
                      />
                    </Fragment>
                  );
                })}
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

      {/* Auditor Notes section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4 mr-2 text-gray-400" />
              Auditor Notes
            </label>
            <div className="text-xs text-gray-500">
              {notesSaveStatus === 'typing' && (
                <span className="text-gray-400">Typing...</span>
              )}
              {notesSaveStatus === 'saving' && (
                <span className="flex items-center text-gray-500">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </span>
              )}
              {notesSaveStatus === 'saved' && localNotes && (
                <span className="flex items-center text-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Saved
                </span>
              )}
            </div>
          </div>
          <textarea
            value={localNotes}
            onChange={handleNotesChange}
            disabled={disabled}
            placeholder="Add notes about this system review..."
            rows={3}
            className={`
              w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              placeholder:text-gray-400 resize-y
              ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
            `}
          />
        </CardContent>
      </Card>

      {/* Mark as Complete button */}
      {!disabled && !isMarkedComplete && onMarkComplete && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            onClick={() => onMarkComplete(system.systemNumber)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark System as Complete
          </Button>
        </div>
      )}
    </div>
  );
}
