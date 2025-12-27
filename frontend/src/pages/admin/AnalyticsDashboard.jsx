/**
 * AnalyticsDashboard.jsx
 *
 * Admin dashboard for viewing analytics data from PostHog.
 * Provides quick stats and links to the full PostHog dashboard.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  MousePointerClick,
  Clock,
  TrendingUp,
  ExternalLink,
  Activity,
  Eye,
  Calendar,
  RefreshCw,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useAnalytics } from '../../analytics';

const AnalyticsDashboard = () => {
  const { initialized, posthog } = useAnalytics();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
  const posthogConfigured = import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST;

  useEffect(() => {
    // Simulate loading stats (in production, these would come from PostHog API)
    const loadStats = async () => {
      setLoading(true);
      // Simulated delay for demo
      await new Promise(r => setTimeout(r, 500));

      // These would normally come from PostHog's API
      // For now, showing placeholder stats
      setStats({
        activeUsers: {
          today: '-',
          week: '-',
          month: '-'
        },
        pageViews: {
          today: '-',
          week: '-',
          month: '-'
        },
        topPages: [
          { page: 'Dashboard', views: '-' },
          { page: 'Survey Intelligence', views: '-' },
          { page: 'Facilities', views: '-' },
          { page: 'Scorecards', views: '-' },
          { page: 'Team Intelligence', views: '-' },
        ],
        topFeatures: [
          { feature: 'Risk Trend Chart', uses: '-' },
          { feature: 'Facility Search', uses: '-' },
          { feature: 'Tag Click', uses: '-' },
          { feature: 'Time Range Filter', uses: '-' },
          { feature: 'Export PDF', uses: '-' },
        ]
      });
      setLoading(false);
    };

    loadStats();
  }, []);

  if (!posthogConfigured) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-amber-800">PostHog Not Configured</h2>
                <p className="text-amber-700 mt-2">
                  Analytics tracking requires PostHog configuration. Add the following environment variables:
                </p>
                <div className="mt-4 bg-amber-100 rounded-lg p-4 font-mono text-sm">
                  <p>VITE_POSTHOG_KEY=phc_your_project_key</p>
                  <p>VITE_POSTHOG_HOST=https://app.posthog.com</p>
                </div>
                <p className="text-amber-700 mt-4 text-sm">
                  Get your project API key from{' '}
                  <a
                    href="https://posthog.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-800"
                  >
                    posthog.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-purple-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track user engagement and feature usage across SystemsCheck
          </p>
        </div>
        <a
          href={posthogHost}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open PostHog
        </a>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 flex items-center justify-between ${
        initialized ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${initialized ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className={initialized ? 'text-green-800' : 'text-gray-600'}>
            {initialized ? 'Analytics tracking is active' : 'Analytics tracking is disabled in development'}
          </span>
        </div>
        {initialized && (
          <span className="text-sm text-green-700">
            Events are being sent to PostHog
          </span>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          title="Active Users"
          value={stats?.activeUsers?.today || '-'}
          subtext="today"
          loading={loading}
        />
        <StatCard
          icon={Eye}
          iconColor="text-green-600"
          iconBg="bg-green-100"
          title="Page Views"
          value={stats?.pageViews?.today || '-'}
          subtext="today"
          loading={loading}
        />
        <StatCard
          icon={MousePointerClick}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
          title="Feature Uses"
          value="-"
          subtext="today"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          title="Avg Session"
          value="-"
          subtext="minutes"
          loading={loading}
        />
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Real-time Stats in PostHog</h3>
            <p className="text-sm text-blue-700 mt-1">
              View detailed analytics, user sessions, feature flags, and create custom dashboards in the PostHog console.
              The stats above are placeholders - connect to PostHog's API for real data.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-500" />
              Top Pages
            </h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-4 bg-gray-200 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.topPages?.map((page, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-700">{page.page}</span>
                    <span className="text-gray-500 text-sm">{page.views} views</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">
              Connect to PostHog API for real data
            </p>
          </div>
        </div>

        {/* Top Features */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <MousePointerClick className="w-5 h-5 text-gray-500" />
              Top Features
            </h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-36" />
                    <div className="h-4 bg-gray-200 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.topFeatures?.map((feature, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-700">{feature.feature}</span>
                    <span className="text-gray-500 text-sm">{feature.uses} uses</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">
              Connect to PostHog API for real data
            </p>
          </div>
        </div>
      </div>

      {/* Tracked Events Reference */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Tracked Events Reference
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <EventCategory
              title="Navigation"
              events={['$pageview', 'tab_change', 'modal_open', 'modal_close']}
            />
            <EventCategory
              title="Scorecards"
              events={['scorecard_create', 'scorecard_edit', 'scorecard_complete', 'scorecard_item_score']}
            />
            <EventCategory
              title="Survey Intelligence"
              events={['survey_intel_view', 'survey_intel_facility_select', 'survey_intel_team_view', 'tag_click']}
            />
            <EventCategory
              title="Charts"
              events={['chart_toggle_series', 'chart_time_range', 'chart_hover']}
            />
            <EventCategory
              title="Exports"
              events={['export_pdf', 'export_csv', 'export_excel']}
            />
            <EventCategory
              title="User"
              events={['login', 'logout', 'password_change']}
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickLink
          href={`${posthogHost}/insights`}
          icon={TrendingUp}
          title="Insights"
          description="Create custom charts and analyze trends"
        />
        <QuickLink
          href={`${posthogHost}/recordings`}
          icon={Eye}
          title="Session Recordings"
          description="Watch user sessions to understand behavior"
        />
        <QuickLink
          href={`${posthogHost}/persons`}
          icon={Users}
          title="Users"
          description="View individual user journeys and properties"
        />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, iconColor, iconBg, title, value, subtext, loading }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        {loading ? (
          <div className="animate-pulse h-7 bg-gray-200 rounded w-16 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">
            {value}
            <span className="text-sm font-normal text-gray-500 ml-1">{subtext}</span>
          </p>
        )}
      </div>
    </div>
  </div>
);

// Event Category Component
const EventCategory = ({ title, events }) => (
  <div>
    <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
    <div className="space-y-1">
      {events.map(event => (
        <div key={event} className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
          {event}
        </div>
      ))}
    </div>
  </div>
);

// Quick Link Component
const QuickLink = ({ href, icon: Icon, title, description }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:border-purple-300 hover:shadow-md transition-all group"
  >
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
        <Icon className="w-5 h-5 text-purple-600" />
      </div>
      <div>
        <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors flex items-center gap-1">
          {title}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  </a>
);

export default AnalyticsDashboard;
