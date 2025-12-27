/**
 * PostHog Analytics Provider
 *
 * Wraps the application with PostHog analytics tracking.
 * Handles:
 * - Initialization with project API key
 * - Automatic page view tracking
 * - User identification
 * - Feature flags (if needed)
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';

// Analytics context
const AnalyticsContext = createContext(null);

// Check if PostHog is configured
const isPostHogConfigured = () => {
  return import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST;
};

// Initialize PostHog
const initPostHog = () => {
  if (!isPostHogConfigured()) {
    console.log('PostHog not configured - analytics disabled');
    return false;
  }

  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    // Capture page views automatically
    capture_pageview: false, // We'll handle this manually for more control
    // Capture page leaves
    capture_pageleave: true,
    // Disable in development unless explicitly enabled
    loaded: (posthog) => {
      if (import.meta.env.DEV && !import.meta.env.VITE_POSTHOG_DEBUG) {
        posthog.opt_out_capturing();
      }
    },
    // Session recording (optional - can be enabled in PostHog dashboard)
    disable_session_recording: import.meta.env.DEV,
    // Autocapture settings
    autocapture: {
      dom_event_allowlist: ['click', 'submit'],
      element_allowlist: ['button', 'a', 'input', 'select'],
      css_selector_allowlist: ['[data-track]'],
    },
  });

  return true;
};

/**
 * PostHog Provider Component
 */
export const PostHogProvider = ({ children }) => {
  const location = useLocation();
  const [initialized, setInitialized] = React.useState(false);

  // Initialize PostHog on mount
  useEffect(() => {
    const success = initPostHog();
    setInitialized(success);
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!initialized) return;

    // Extract page name from path
    const pageName = getPageName(location.pathname);

    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path: location.pathname,
      page_name: pageName,
      search: location.search,
      referrer: document.referrer,
    });
  }, [location.pathname, location.search, initialized]);

  // Identify user
  const identify = useCallback((userId, properties = {}) => {
    if (!initialized) return;

    posthog.identify(userId, {
      ...properties,
      last_seen: new Date().toISOString(),
    });
  }, [initialized]);

  // Reset user (on logout)
  const reset = useCallback(() => {
    if (!initialized) return;
    posthog.reset();
  }, [initialized]);

  // Track custom event
  const track = useCallback((eventName, properties = {}) => {
    if (!initialized) return;

    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }, [initialized]);

  // Track feature usage
  const trackFeature = useCallback((featureName, action, properties = {}) => {
    if (!initialized) return;

    posthog.capture('feature_used', {
      feature: featureName,
      action: action,
      ...properties,
      path: location.pathname,
    });
  }, [initialized, location.pathname]);

  // Set user properties
  const setUserProperties = useCallback((properties) => {
    if (!initialized) return;
    posthog.people.set(properties);
  }, [initialized]);

  // Check feature flag
  const isFeatureEnabled = useCallback((flagName) => {
    if (!initialized) return false;
    return posthog.isFeatureEnabled(flagName);
  }, [initialized]);

  const value = {
    initialized,
    identify,
    reset,
    track,
    trackFeature,
    setUserProperties,
    isFeatureEnabled,
    posthog: initialized ? posthog : null,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

/**
 * Hook to access analytics functions
 */
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return no-op functions if not in provider
    return {
      initialized: false,
      identify: () => {},
      reset: () => {},
      track: () => {},
      trackFeature: () => {},
      setUserProperties: () => {},
      isFeatureEnabled: () => false,
      posthog: null,
    };
  }
  return context;
};

/**
 * Helper to get a readable page name from path
 */
const getPageName = (path) => {
  const routes = {
    '/': 'Dashboard',
    '/login': 'Login',
    '/facilities': 'Facilities List',
    '/scorecards': 'Scorecards List',
    '/scorecards/new': 'New Scorecard',
    '/reports': 'Reports',
    '/survey-intelligence': 'Survey Intelligence',
    '/survey-intelligence/team': 'Team Intelligence',
    '/survey-analytics': 'Survey Analytics',
    '/admin/users': 'User Management',
    '/admin/organization': 'Organization Settings',
    '/admin/template': 'Template Editor',
    '/admin/analytics': 'Analytics Dashboard',
  };

  // Check for exact match
  if (routes[path]) return routes[path];

  // Check for dynamic routes
  if (path.startsWith('/facilities/')) return 'Facility Detail';
  if (path.startsWith('/scorecards/') && path.includes('/edit')) return 'Edit Scorecard';
  if (path.startsWith('/scorecards/')) return 'Scorecard Detail';

  return path;
};

export default PostHogProvider;
