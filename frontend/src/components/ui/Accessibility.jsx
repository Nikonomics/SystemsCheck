import { useState, useEffect, useRef, createContext, useContext } from 'react';

/**
 * Skip to main content link for keyboard users
 */
export function SkipLink({ targetId = 'main-content' }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader only text
 */
export function VisuallyHidden({ children, as: Component = 'span' }) {
  return <Component className="sr-only">{children}</Component>;
}

/**
 * Live region for screen reader announcements
 */
const AnnouncerContext = createContext(null);

export function AnnouncerProvider({ children }) {
  const [announcement, setAnnouncement] = useState('');
  const [politeness, setPoliteness] = useState('polite');

  const announce = (message, priority = 'polite') => {
    // Clear first to ensure announcement is read even if same message
    setAnnouncement('');
    setPoliteness(priority);
    // Use setTimeout to ensure the clearing takes effect
    setTimeout(() => setAnnouncement(message), 50);
  };

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      {/* Polite announcer for non-urgent updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeness === 'polite' && announcement}
      </div>
      {/* Assertive announcer for urgent updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {politeness === 'assertive' && announcement}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce() {
  const announce = useContext(AnnouncerContext);
  if (!announce) {
    // Return a no-op if not within provider
    return () => {};
  }
  return announce;
}

/**
 * Focus management hook for modals
 */
export function useRestoreFocus() {
  const previousFocus = useRef(null);

  useEffect(() => {
    // Store the currently focused element
    previousFocus.current = document.activeElement;

    return () => {
      // Restore focus when unmounting
      if (previousFocus.current && previousFocus.current.focus) {
        previousFocus.current.focus();
      }
    };
  }, []);
}

/**
 * Loading spinner with accessible label
 */
export function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div role="status" aria-label={label}>
      <svg
        className={`animate-spin ${sizeClasses[size]} text-blue-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Button with loading state
 */
export function AccessibleButton({
  children,
  loading = false,
  loadingText = 'Loading...',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className={`relative ${className} ${
        loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" label={loadingText} />
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}

/**
 * Progress bar with accessible labels
 */
export function ProgressBar({ value, max = 100, label, showValue = true }) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showValue && (
            <span className="text-sm font-medium text-gray-700">{percentage}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${percentage}%`}
        className="w-full bg-gray-200 rounded-full h-2.5"
      >
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Icon button with required aria-label
 */
export function IconButton({ icon, label, className = '', ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
