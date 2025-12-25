import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  CheckCircle2,
  ClipboardList,
  Clock,
  UserCheck,
} from 'lucide-react';
import { scorecardsApi } from '../../api/scorecards';
import { facilitiesApi } from '../../api/facilities';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { SystemTab } from './components/SystemTab';
import { SummaryTab } from './components/SummaryTab';
import { ScoreDisplay, calculateSystemTotal } from './components/ScoreDisplay';
import {
  TrialCloseModal,
  ReopenModal,
  HardCloseModal,
  StatusBanner,
} from './components/StatusModals';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const statusBadges = {
  draft: { label: 'Draft', variant: 'primary' },
  trial_close: { label: 'Trial Close', variant: 'warning' },
  hard_close: { label: 'Hard Close', variant: 'success' },
};

/**
 * ScorecardForm - Main scorecard entry/edit page
 */
export function ScorecardForm() {
  const { id, facilityId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isNew = !id && facilityId;

  // State
  const [scorecard, setScorecard] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0-6 for systems (sorted), 7+ for summary

  // Save state
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [pendingChanges, setPendingChanges] = useState({});
  const saveTimeoutRef = useRef(null);

  // Modal state
  const [showTrialCloseModal, setShowTrialCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showHardCloseModal, setShowHardCloseModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Load scorecard data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isNew) {
          // Creating new scorecard
          const facilityData = await facilitiesApi.get(facilityId);
          setFacility(facilityData.facility);

          // Create the scorecard
          const now = new Date();
          const newScorecard = await scorecardsApi.create(facilityId, {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          });
          setScorecard(newScorecard.scorecard);
          toast.success('Scorecard created successfully');

          // Navigate to edit URL
          navigate(`/scorecards/${newScorecard.scorecard.id}/edit`, { replace: true });
        } else {
          // Loading existing scorecard
          const data = await scorecardsApi.get(id);
          setScorecard(data.scorecard);
          setFacility(data.scorecard.facility);
        }
      } catch (err) {
        console.error('Error loading scorecard:', err);
        const message = err.response?.data?.message || 'Failed to load scorecard';
        setError(message);

        if (err.response?.status === 404) {
          toast.error('Scorecard not found');
          navigate('/facilities');
        } else if (err.response?.status === 403) {
          toast.error("You don't have access to this scorecard");
          navigate('/facilities');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, facilityId, isNew, navigate, toast]);

  // Auto-save with debounce
  const saveChanges = useCallback(async (changes) => {
    if (Object.keys(changes).length === 0) return;
    if (!scorecard?.id) return;

    setSaveStatus('saving');

    // Capture the items we're saving so we only clear those
    const savedItemIds = Object.keys(changes.items || {});

    try {
      await scorecardsApi.update(scorecard.id, changes);

      // Only clear the specific changes that were saved, not overwrite local state
      // This prevents race conditions where new changes made during save are lost
      setPendingChanges(prev => {
        if (!prev.items) return {};
        const remainingItems = { ...prev.items };
        savedItemIds.forEach(id => delete remainingItems[id]);
        return Object.keys(remainingItems).length > 0 ? { items: remainingItems } : {};
      });

      setSaveStatus('saved');
    } catch (err) {
      console.error('Error saving:', err);
      setSaveStatus('error');
      toast.error('Failed to save changes. Click to retry.', 0);
    }
  }, [scorecard?.id, toast]);

  // Retry save on error
  const handleRetrySave = useCallback(() => {
    if (Object.keys(pendingChanges).length > 0) {
      saveChanges(pendingChanges);
    }
  }, [pendingChanges, saveChanges]);

  // Debounced save trigger
  useEffect(() => {
    if (Object.keys(pendingChanges).length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveChanges(pendingChanges);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [pendingChanges, saveChanges]);

  // Handle item change
  const handleItemChange = useCallback((itemId, changes) => {
    setScorecard(prev => {
      if (!prev || !prev.systems) return prev;

      const newSystems = prev.systems.map(system => ({
        ...system,
        items: system.items.map(item =>
          item.id === itemId ? { ...item, ...changes } : item
        ),
      }));

      return { ...prev, systems: newSystems };
    });

    // Queue for save
    setPendingChanges(prev => ({
      ...prev,
      items: {
        ...(prev.items || {}),
        [itemId]: {
          ...(prev.items?.[itemId] || {}),
          ...changes,
        },
      },
    }));
  }, []);

  // Handle add resident
  const handleAddResident = useCallback(async (systemId, resident) => {
    try {
      setSaveStatus('saving');

      // Add to local state immediately
      setScorecard(prev => {
        if (!prev || !prev.systems) return prev;

        const newSystems = prev.systems.map(system => {
          if (system.id !== systemId) return system;
          return {
            ...system,
            residents: [
              ...(system.residents || []),
              { ...resident, id: `temp-${Date.now()}` },
            ],
          };
        });

        return { ...prev, systems: newSystems };
      });

      // Save to backend
      const response = await scorecardsApi.update(scorecard.id, {
        addResidents: [{ systemId, ...resident }],
      });

      setScorecard(response.scorecard);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error adding resident:', err);
      setSaveStatus('error');
      toast.error('Failed to add resident');
    }
  }, [scorecard?.id, toast]);

  // Handle remove resident
  const handleRemoveResident = useCallback(async (systemId, residentId) => {
    try {
      setSaveStatus('saving');

      // Remove from local state immediately
      setScorecard(prev => {
        if (!prev || !prev.systems) return prev;

        const newSystems = prev.systems.map(system => {
          if (system.id !== systemId) return system;
          return {
            ...system,
            residents: (system.residents || []).filter(r =>
              (r.id !== residentId) && (r.id !== `temp-${residentId}`)
            ),
          };
        });

        return { ...prev, systems: newSystems };
      });

      // Only save if it's a real ID (not temp)
      if (typeof residentId === 'number' || !residentId.toString().startsWith('temp-')) {
        const response = await scorecardsApi.update(scorecard.id, {
          removeResidents: [residentId],
        });
        setScorecard(response.scorecard);
      }

      setSaveStatus('saved');
    } catch (err) {
      console.error('Error removing resident:', err);
      setSaveStatus('error');
      toast.error('Failed to remove resident');
    }
  }, [scorecard?.id, toast]);

  // Handle mark system as complete
  const handleMarkComplete = useCallback(async (systemNumber) => {
    if (!scorecard?.id) return;

    try {
      const response = await scorecardsApi.updateSystemCompletion(scorecard.id, systemNumber, {
        completedById: user?.id,
        completedAt: new Date().toISOString()
      });

      // Update local state with the new completion info
      setScorecard(prev => {
        if (!prev || !prev.systems) return prev;

        const newSystems = prev.systems.map(system => {
          if (system.systemNumber !== systemNumber) return system;
          return {
            ...system,
            completedById: response.system.completedById,
            completedAt: response.system.completedAt,
            completedBy: response.system.completedBy
          };
        });

        return { ...prev, systems: newSystems };
      });

      toast.success(`System ${systemNumber} marked as complete`);
    } catch (err) {
      console.error('Error marking system complete:', err);
      toast.error('Failed to mark system as complete');
    }
  }, [scorecard?.id, user?.id, toast]);

  // Handle clear system completion
  const handleClearComplete = useCallback(async (systemNumber) => {
    if (!scorecard?.id) return;

    try {
      await scorecardsApi.updateSystemCompletion(scorecard.id, systemNumber, { clear: true });

      // Update local state to clear completion
      setScorecard(prev => {
        if (!prev || !prev.systems) return prev;

        const newSystems = prev.systems.map(system => {
          if (system.systemNumber !== systemNumber) return system;
          return {
            ...system,
            completedById: null,
            completedAt: null,
            completedBy: null
          };
        });

        return { ...prev, systems: newSystems };
      });

      toast.success(`System ${systemNumber} completion cleared`);
    } catch (err) {
      console.error('Error clearing system completion:', err);
      toast.error('Failed to clear system completion');
    }
  }, [scorecard?.id, toast]);

  // Handle system notes change
  const handleNotesChange = useCallback(async (systemNumber, notes) => {
    if (!scorecard?.id) return;

    try {
      // Update via the existing update endpoint using legacy format
      await scorecardsApi.update(scorecard.id, {
        systems: {
          [systemNumber]: { notes }
        }
      });

      // Update local state
      setScorecard(prev => {
        if (!prev || !prev.systems) return prev;

        const newSystems = prev.systems.map(system => {
          if (system.systemNumber !== systemNumber) return system;
          return { ...system, notes };
        });

        return { ...prev, systems: newSystems };
      });
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Failed to save notes');
      throw err; // Re-throw to signal failure to the component
    }
  }, [scorecard?.id, toast]);

  // Handle status changes
  const handleTrialClose = async () => {
    setStatusLoading(true);
    try {
      // Save pending changes first
      if (Object.keys(pendingChanges).length > 0) {
        await saveChanges(pendingChanges);
      }

      const response = await scorecardsApi.updateStatus(scorecard.id, 'trial_close');
      setScorecard(response.scorecard);
      setShowTrialCloseModal(false);
      toast.success('Scorecard closed for facility review');
    } catch (err) {
      console.error('Error trial closing:', err);
      toast.error(err.response?.data?.message || 'Failed to trial close scorecard');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleReopen = async () => {
    setStatusLoading(true);
    try {
      const response = await scorecardsApi.updateStatus(scorecard.id, 'draft');
      setScorecard(response.scorecard);
      setShowReopenModal(false);
      toast.success('Scorecard reopened for editing');
    } catch (err) {
      console.error('Error reopening:', err);
      toast.error(err.response?.data?.message || 'Failed to reopen scorecard');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleHardClose = async () => {
    setStatusLoading(true);
    try {
      const response = await scorecardsApi.updateStatus(scorecard.id, 'hard_close');
      setScorecard(response.scorecard);
      setShowHardCloseModal(false);
      toast.success('Scorecard permanently closed');
    } catch (err) {
      console.error('Error hard closing:', err);
      toast.error(err.response?.data?.message || 'Failed to hard close scorecard');
    } finally {
      setStatusLoading(false);
    }
  };

  // Navigate to specific system from summary
  const handleNavigateToSystem = (systemIndex) => {
    setActiveTab(systemIndex);
  };

  // Calculate total score
  const totalScore = scorecard?.systems?.reduce((sum, system) => {
    return sum + calculateSystemTotal(system.items || []);
  }, 0) || 0;

  // Check if system is complete
  const isSystemComplete = (system) => {
    if (!system.items || system.items.length === 0) return false;
    return system.items.every(
      item => item.sampleSize && item.sampleSize > 0 && item.chartsMet !== null && item.chartsMet !== undefined
    );
  };

  // Format last edited info
  const getLastEditedInfo = () => {
    if (!scorecard?.systems) return null;

    let latestEdit = null;
    let latestEditor = null;

    scorecard.systems.forEach(system => {
      if (system.lastEditedAt) {
        const editDate = new Date(system.lastEditedAt);
        if (!latestEdit || editDate > latestEdit) {
          latestEdit = editDate;
          latestEditor = system.lastEditedBy;
        }
      }
    });

    if (!latestEdit) return null;

    const editorName = latestEditor
      ? `${latestEditor.firstName} ${latestEditor.lastName}`
      : 'Unknown';

    const timeAgo = formatTimeAgo(latestEdit);

    return { editorName, timeAgo };
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const lastEdited = getLastEditedInfo();

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Error state
  if (error && !scorecard) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!scorecard) return null;

  const isEditable = scorecard.status === 'draft';
  const statusBadge = statusBadges[scorecard.status];

  // Sort systems by systemNumber for consistent navigation
  const sortedSystems = [...(scorecard.systems || [])].sort((a, b) => a.systemNumber - b.systemNumber);
  const summaryTabIndex = sortedSystems.length;
  const isSummaryTab = activeTab >= summaryTabIndex;
  const currentSystem = isSummaryTab ? null : sortedSystems[activeTab];

  return (
    <div className="space-y-4">
      {/* Status confirmation modals */}
      <TrialCloseModal
        isOpen={showTrialCloseModal}
        onClose={() => setShowTrialCloseModal(false)}
        onConfirm={handleTrialClose}
        loading={statusLoading}
      />
      <ReopenModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        onConfirm={handleReopen}
        loading={statusLoading}
      />
      <HardCloseModal
        isOpen={showHardCloseModal}
        onClose={() => setShowHardCloseModal(false)}
        onConfirm={handleHardClose}
        loading={statusLoading}
      />

      {/* Header */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Back button and title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/facilities/${scorecard.facilityId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {facility?.name || 'Scorecard'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">
                  {monthNames[scorecard.month - 1]} {scorecard.year}
                </span>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                {lastEdited && (
                  <span className="text-xs text-gray-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {lastEdited.editorName} • {lastEdited.timeAgo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Save status */}
          <div className="flex items-center justify-center">
            {saveStatus === 'saving' && (
              <span className="flex items-center text-sm text-gray-500">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center text-sm text-green-600">
                <Check className="h-4 w-4 mr-1" />
                All changes saved
              </span>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={handleRetrySave}
                className="flex items-center text-sm text-red-600 hover:text-red-700"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Error saving - Click to retry
              </button>
            )}
          </div>

          {/* Right: Total and action buttons */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase">Total Score</div>
              <ScoreDisplay earned={totalScore} possible={700} size="xl" showPercentage />
              <div className="text-xs text-gray-500 mt-1 font-mono">
                {sortedSystems?.map(s => `S${s.systemNumber}:${calculateSystemTotal(s.items || []).toFixed(0)}`).join(' ')}
              </div>
            </div>

            {isEditable && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTrialCloseModal(true)}
              >
                <Lock className="h-4 w-4 mr-1" />
                Trial Close
              </Button>
            )}

            {scorecard.status === 'trial_close' && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowReopenModal(true)}
                >
                  <Unlock className="h-4 w-4 mr-1" />
                  Reopen
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowHardCloseModal(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Hard Close
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation - compact design */}
        <div className="mt-4 -mb-4">
          <div className="flex flex-wrap gap-1">
            {sortedSystems.map((system, sortedIndex) => {
                const systemScore = calculateSystemTotal(system.items || []);
                const allItemsScored = isSystemComplete(system);
                const markedComplete = !!system.completedById;

                return (
                  <button
                    key={system.id}
                    onClick={() => setActiveTab(sortedIndex)}
                    className={`
                      flex items-center px-3 py-2 text-xs font-medium rounded-lg
                      transition-colors
                      ${activeTab === sortedIndex
                        ? 'bg-primary-600 text-white'
                        : markedComplete
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                    title={`${system.systemNumber}. ${system.systemName}${markedComplete ? ' (Completed)' : ''}`}
                  >
                    {markedComplete ? (
                      <UserCheck className="h-3 w-3 mr-1 flex-shrink-0" />
                    ) : allItemsScored ? (
                      <Check className="h-3 w-3 mr-1 flex-shrink-0" />
                    ) : null}
                    <span className="font-semibold">{system.systemNumber}</span>
                    <span className={`ml-1 ${activeTab === sortedIndex ? 'text-primary-200' : markedComplete ? 'text-green-500' : 'text-gray-400'}`}>
                      {systemScore.toFixed(0)}
                    </span>
                  </button>
                );
              })}

            {/* Summary tab */}
            <button
              onClick={() => setActiveTab(summaryTabIndex)}
              className={`
                flex items-center px-3 py-2 text-xs font-medium rounded-lg
                transition-colors
                ${isSummaryTab
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <ClipboardList className="h-3 w-3 mr-1" />
              Summary
            </button>
          </div>
        </div>
      </div>

      {/* Status banner for read-only modes */}
      <StatusBanner status={scorecard.status} />

      {/* Current system content */}
      <div className="pt-4">
        {isSummaryTab ? (
          <SummaryTab
            systems={sortedSystems}
            onNavigateToSystem={(systemNumber) => {
              const idx = sortedSystems.findIndex(s => s.systemNumber === systemNumber);
              if (idx >= 0) setActiveTab(idx);
            }}
          />
        ) : currentSystem && (
          <SystemTab
            system={currentSystem}
            onItemChange={handleItemChange}
            onAddResident={handleAddResident}
            onRemoveResident={handleRemoveResident}
            onMarkComplete={handleMarkComplete}
            onClearComplete={handleClearComplete}
            onNotesChange={handleNotesChange}
            currentUserId={user?.id}
            disabled={!isEditable}
          />
        )}
      </div>

      {/* Footer navigation */}
      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-white border-t border-gray-200 mt-6">
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
            disabled={activeTab === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            {isSummaryTab ? 'Summary' : `System ${currentSystem?.systemNumber || activeTab + 1} of ${sortedSystems.length}`}
          </div>

          <Button
            variant="secondary"
            onClick={() => setActiveTab(Math.min(summaryTabIndex, activeTab + 1))}
            disabled={isSummaryTab}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
