/**
 * useAnalyticsIdentify Hook
 *
 * Automatically identifies users in PostHog when they log in/out.
 * Should be used in a component that's inside both AuthProvider and PostHogProvider.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from './PostHogProvider';

/**
 * Hook to sync auth state with analytics identification
 */
export const useAnalyticsIdentify = () => {
  const { user, isAuthenticated } = useAuth();
  const { identify, reset, track, initialized } = useAnalytics();
  const previousUserId = useRef(null);

  useEffect(() => {
    if (!initialized) return;

    if (isAuthenticated && user) {
      // User logged in or user data changed
      if (previousUserId.current !== user.id) {
        // Identify the user
        identify(user.id.toString(), {
          email: user.email,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: user.role,
          created_at: user.createdAt,
        });

        // Track login event if this is a new login (not page refresh)
        if (previousUserId.current === null && !sessionStorage.getItem('analytics_identified')) {
          track('login', {
            user_id: user.id,
            role: user.role,
          });
          sessionStorage.setItem('analytics_identified', 'true');
        }

        previousUserId.current = user.id;
      }
    } else if (!isAuthenticated && previousUserId.current !== null) {
      // User logged out
      track('logout', {
        user_id: previousUserId.current,
      });
      reset();
      previousUserId.current = null;
      sessionStorage.removeItem('analytics_identified');
    }
  }, [isAuthenticated, user, identify, reset, track, initialized]);

  return null;
};

export default useAnalyticsIdentify;
