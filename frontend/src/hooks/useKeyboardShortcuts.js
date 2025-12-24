import { useEffect, useCallback } from 'react';

/**
 * Hook for handling keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 *
 * Key format: "ctrl+s", "cmd+s", "escape", "enter", "ctrl+shift+s"
 *
 * Example:
 * useKeyboardShortcuts({
 *   'ctrl+s': handleSave,
 *   'cmd+s': handleSave,
 *   'escape': handleClose,
 * });
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Build the key combination string
      const parts = [];
      if (event.ctrlKey) parts.push('ctrl');
      if (event.metaKey) parts.push('cmd');
      if (event.shiftKey) parts.push('shift');
      if (event.altKey) parts.push('alt');

      // Handle special keys
      const key = event.key.toLowerCase();
      if (key !== 'control' && key !== 'meta' && key !== 'shift' && key !== 'alt') {
        parts.push(key);
      }

      const combo = parts.join('+');

      // Check if we have a handler for this combination
      const handler = shortcuts[combo];
      if (handler) {
        // Don't trigger if user is typing in an input/textarea
        const target = event.target;
        const isInputField =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        // Allow escape in input fields
        if (isInputField && key !== 'escape') {
          return;
        }

        event.preventDefault();
        handler(event);
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Hook specifically for form saving (Ctrl/Cmd + S)
 * @param {Function} onSave - Save handler function
 * @param {boolean} enabled - Whether the shortcut is enabled
 */
export function useSaveShortcut(onSave, enabled = true) {
  useKeyboardShortcuts(
    {
      'ctrl+s': onSave,
      'cmd+s': onSave,
    },
    enabled
  );
}

/**
 * Hook for closing modals/dialogs (Escape key)
 * @param {Function} onClose - Close handler function
 * @param {boolean} enabled - Whether the shortcut is enabled
 */
export function useEscapeKey(onClose, enabled = true) {
  useKeyboardShortcuts(
    {
      escape: onClose,
    },
    enabled
  );
}

/**
 * Hook for modal focus management
 * Traps focus within a modal when open
 * @param {React.RefObject} modalRef - Ref to the modal container
 * @param {boolean} isOpen - Whether the modal is open
 */
export function useFocusTrap(modalRef, isOpen) {
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on open
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => {
      modal.removeEventListener('keydown', handleTabKey);
    };
  }, [modalRef, isOpen]);
}

export default useKeyboardShortcuts;
