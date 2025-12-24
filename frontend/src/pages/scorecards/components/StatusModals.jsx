import { useState } from 'react';
import { Lock, Unlock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

/**
 * TrialCloseModal - Confirmation for trial close action
 */
export function TrialCloseModal({ isOpen, onClose, onConfirm, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close for Facility Review?" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Lock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-gray-700">
              This scorecard will be locked for editing while under facility review.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              You can reopen it later if changes are needed.
            </p>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} loading={loading}>
          <Lock className="h-4 w-4 mr-1" />
          Trial Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/**
 * ReopenModal - Confirmation for reopening a trial-closed scorecard
 */
export function ReopenModal({ isOpen, onClose, onConfirm, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reopen for Editing?" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Unlock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-700">
              This will allow the scorecard to be edited again.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              The scorecard status will change back to draft.
            </p>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} loading={loading}>
          <Unlock className="h-4 w-4 mr-1" />
          Reopen
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/**
 * HardCloseModal - Confirmation for permanently closing a scorecard
 */
export function HardCloseModal({ isOpen, onClose, onConfirm, loading }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    setConfirmed(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Permanently Close Scorecard?" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-gray-700 font-medium">
              This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              The scorecard will be permanently locked and no further changes will be allowed.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">
            I confirm this scorecard has been reviewed with the facility
          </span>
        </label>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          loading={loading}
          disabled={!confirmed || loading}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Hard Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/**
 * StatusBanner - Shows read-only status banner
 */
export function StatusBanner({ status }) {
  if (status === 'draft') return null;

  const bannerConfig = {
    trial_close: {
      className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: Lock,
      message: 'This scorecard is locked for facility review',
    },
    hard_close: {
      className: 'bg-green-50 border-green-200 text-green-800',
      icon: CheckCircle2,
      message: 'This scorecard is permanently closed',
    },
  };

  const config = bannerConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${config.className}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium">{config.message}</span>
    </div>
  );
}
