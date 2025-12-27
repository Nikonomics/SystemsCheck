/**
 * useTrackEvent Hook
 *
 * Convenience hook for tracking specific events throughout the app.
 * Provides pre-defined event types for consistent analytics.
 */

import { useCallback } from 'react';
import { useAnalytics } from './PostHogProvider';

/**
 * Event categories for consistent tracking
 */
export const EventCategory = {
  NAVIGATION: 'navigation',
  SCORECARD: 'scorecard',
  FACILITY: 'facility',
  SURVEY_INTEL: 'survey_intelligence',
  REPORT: 'report',
  ADMIN: 'admin',
  USER: 'user',
  EXPORT: 'export',
  FILTER: 'filter',
  CHART: 'chart',
};

/**
 * Pre-defined events for the application
 */
export const Events = {
  // Navigation events
  PAGE_VIEW: 'page_view',
  TAB_CHANGE: 'tab_change',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',

  // Scorecard events
  SCORECARD_CREATE: 'scorecard_create',
  SCORECARD_EDIT: 'scorecard_edit',
  SCORECARD_DELETE: 'scorecard_delete',
  SCORECARD_COMPLETE: 'scorecard_complete',
  SCORECARD_ITEM_SCORE: 'scorecard_item_score',

  // Facility events
  FACILITY_VIEW: 'facility_view',
  FACILITY_SEARCH: 'facility_search',
  FACILITY_FILTER: 'facility_filter',

  // Survey Intelligence events
  SURVEY_INTEL_VIEW: 'survey_intel_view',
  SURVEY_INTEL_FACILITY_SELECT: 'survey_intel_facility_select',
  SURVEY_INTEL_TEAM_VIEW: 'survey_intel_team_view',
  SURVEY_INTEL_TEAM_SELECT: 'survey_intel_team_select',
  SURVEY_INTEL_TIME_RANGE: 'survey_intel_time_range',
  SURVEY_INTEL_VIEW_MODE: 'survey_intel_view_mode',
  TAG_CLICK: 'tag_click',

  // Chart events
  CHART_TOGGLE_SERIES: 'chart_toggle_series',
  CHART_TIME_RANGE: 'chart_time_range',
  CHART_HOVER: 'chart_hover',

  // Export events
  EXPORT_PDF: 'export_pdf',
  EXPORT_CSV: 'export_csv',
  EXPORT_EXCEL: 'export_excel',

  // Filter events
  FILTER_APPLY: 'filter_apply',
  FILTER_CLEAR: 'filter_clear',
  SEARCH: 'search',

  // User events
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',

  // Admin events
  USER_CREATE: 'user_create',
  USER_EDIT: 'user_edit',
  USER_DELETE: 'user_delete',
  TEAM_CREATE: 'team_create',
  TEAM_EDIT: 'team_edit',
  TEMPLATE_EDIT: 'template_edit',
};

/**
 * Hook for tracking events with pre-defined types
 */
export const useTrackEvent = () => {
  const { track, trackFeature, initialized } = useAnalytics();

  /**
   * Track a navigation event
   */
  const trackNavigation = useCallback((destination, source = null) => {
    track(Events.PAGE_VIEW, {
      category: EventCategory.NAVIGATION,
      destination,
      source,
    });
  }, [track]);

  /**
   * Track a tab change
   */
  const trackTabChange = useCallback((tabName, context = {}) => {
    track(Events.TAB_CHANGE, {
      category: EventCategory.NAVIGATION,
      tab: tabName,
      ...context,
    });
  }, [track]);

  /**
   * Track scorecard actions
   */
  const trackScorecard = useCallback((action, scorecardId, properties = {}) => {
    track(`scorecard_${action}`, {
      category: EventCategory.SCORECARD,
      scorecard_id: scorecardId,
      ...properties,
    });
  }, [track]);

  /**
   * Track facility actions
   */
  const trackFacility = useCallback((action, facilityId, properties = {}) => {
    track(`facility_${action}`, {
      category: EventCategory.FACILITY,
      facility_id: facilityId,
      ...properties,
    });
  }, [track]);

  /**
   * Track survey intelligence actions
   */
  const trackSurveyIntel = useCallback((action, properties = {}) => {
    track(`survey_intel_${action}`, {
      category: EventCategory.SURVEY_INTEL,
      ...properties,
    });
  }, [track]);

  /**
   * Track chart interactions
   */
  const trackChart = useCallback((action, chartName, properties = {}) => {
    track(`chart_${action}`, {
      category: EventCategory.CHART,
      chart: chartName,
      ...properties,
    });
  }, [track]);

  /**
   * Track export actions
   */
  const trackExport = useCallback((format, context = {}) => {
    track(`export_${format}`, {
      category: EventCategory.EXPORT,
      format,
      ...context,
    });
  }, [track]);

  /**
   * Track filter/search actions
   */
  const trackFilter = useCallback((filterType, value, context = {}) => {
    track(Events.FILTER_APPLY, {
      category: EventCategory.FILTER,
      filter_type: filterType,
      filter_value: value,
      ...context,
    });
  }, [track]);

  /**
   * Track search
   */
  const trackSearch = useCallback((query, resultsCount, context = {}) => {
    track(Events.SEARCH, {
      category: EventCategory.FILTER,
      query,
      results_count: resultsCount,
      ...context,
    });
  }, [track]);

  /**
   * Track admin actions
   */
  const trackAdmin = useCallback((action, properties = {}) => {
    track(`admin_${action}`, {
      category: EventCategory.ADMIN,
      ...properties,
    });
  }, [track]);

  /**
   * Track modal interactions
   */
  const trackModal = useCallback((action, modalName, properties = {}) => {
    track(action === 'open' ? Events.MODAL_OPEN : Events.MODAL_CLOSE, {
      category: EventCategory.NAVIGATION,
      modal: modalName,
      ...properties,
    });
  }, [track]);

  /**
   * Track a generic feature usage
   */
  const trackFeatureUsage = useCallback((feature, action, properties = {}) => {
    trackFeature(feature, action, properties);
  }, [trackFeature]);

  return {
    initialized,
    track,
    trackNavigation,
    trackTabChange,
    trackScorecard,
    trackFacility,
    trackSurveyIntel,
    trackChart,
    trackExport,
    trackFilter,
    trackSearch,
    trackAdmin,
    trackModal,
    trackFeatureUsage,
  };
};

export default useTrackEvent;
