/**
 * TeamRecommendations.jsx
 * AI-generated team-level action priorities
 */

import React from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  AlertCircle, 
  Eye,
  ChevronRight,
  Building2
} from 'lucide-react';

const TeamRecommendations = ({ data }) => {
  if (!data) return null;

  const { teamName, recommendations, summary } = data;

  // Category config
  const categoryConfig = {
    critical: {
      title: 'Critical Actions',
      subtitle: 'Do this week',
      icon: AlertTriangle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-800'
    },
    focus: {
      title: 'Focus Areas',
      subtitle: 'This month',
      icon: AlertCircle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800'
    },
    watch: {
      title: 'Watch Items',
      subtitle: 'Monitor',
      icon: Eye,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800'
    }
  };

  const hasRecommendations = 
    recommendations.critical.length > 0 || 
    recommendations.focus.length > 0 || 
    recommendations.watch.length > 0;

  if (!hasRecommendations) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Team Recommendations</h2>
        </div>
        <div className="text-center py-8 bg-green-50 rounded-lg">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-green-800 font-medium">Looking good!</p>
          <p className="text-green-600 text-sm mt-1">
            No critical actions needed at this time. Continue monitoring trends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Team Recommendations</h2>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {summary.criticalCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                {summary.criticalCount} critical
              </span>
            )}
            {summary.focusCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                {summary.focusCount} focus
              </span>
            )}
            {summary.watchCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                {summary.watchCount} watch
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations by Category */}
      <div className="p-4 space-y-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const items = recommendations[key];
          if (!items || items.length === 0) return null;

          const Icon = config.icon;

          return (
            <div 
              key={key} 
              className={`rounded-lg border ${config.border} ${config.bg} p-4`}
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${config.iconColor}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${config.textColor}`}>{config.title}</h3>
                  <span className="text-xs text-gray-500">{config.subtitle}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {item.system}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.reason}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <ChevronRight className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-700 font-medium">{item.action}</span>
                        </div>
                      </div>
                      {item.facilitiesAffected > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">
                          <Building2 className="w-3 h-3" />
                          {item.facilitiesAffected}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 rounded-b-lg">
        <p className="text-sm text-blue-800">
          💡 Recommendations are generated based on CMS citation patterns combined with internal scorecard performance.
        </p>
      </div>
    </div>
  );
};

export default TeamRecommendations;
