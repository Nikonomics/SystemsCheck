/**
 * CommonIssues.jsx
 * Shows tags cited at 2+ facilities in the team
 */

import React from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import ClickableTag from '../ClickableTag';

const CommonIssues = ({ data }) => {
  if (!data) return null;

  const { teamName, facilityCount, commonIssues, insight } = data;

  // Get trend icon and styling
  const getTrend = (trend) => {
    switch (trend) {
      case 'worsening':
        return { 
          icon: TrendingUp, 
          color: 'text-red-600', 
          bg: 'bg-red-100',
          label: 'Worsening' 
        };
      case 'improving':
        return { 
          icon: TrendingDown, 
          color: 'text-green-600', 
          bg: 'bg-green-100',
          label: 'Improving' 
        };
      default:
        return { 
          icon: Minus, 
          color: 'text-gray-500', 
          bg: 'bg-gray-100',
          label: 'Stable' 
        };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Common Issues Across Team</h2>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Tags at 2+ facilities
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {commonIssues.length === 0 ? (
          <div className="text-center py-8 bg-green-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-green-800 font-medium">No common issues found</p>
            <p className="text-green-600 text-sm mt-1">
              No tags are cited at multiple facilities. Good team consistency!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {commonIssues.slice(0, 8).map((issue, index) => {
              const trend = getTrend(issue.trend);
              const TrendIcon = trend.icon;

              return (
                <div 
                  key={issue.tag}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    issue.facilitiesAffected >= Math.ceil(facilityCount / 2)
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Tag */}
                    <div>
                      <div className="flex items-center gap-2">
                        <ClickableTag tag={issue.tag} />
                        <span className="text-xs text-gray-500">
                          {issue.systemName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Facilities affected */}
                    <div className="text-center">
                      <span className={`text-lg font-bold ${
                        issue.facilitiesAffected >= Math.ceil(facilityCount / 2)
                          ? 'text-red-600'
                          : 'text-gray-700'
                      }`}>
                        {issue.facilitiesAffected}
                      </span>
                      <span className="text-gray-400 text-sm">/{facilityCount}</span>
                      <div className="text-xs text-gray-500">facilities</div>
                    </div>

                    {/* Total citations */}
                    <div className="text-center">
                      <span className="text-lg font-bold text-gray-700">
                        {issue.totalCitations}
                      </span>
                      <div className="text-xs text-gray-500">total</div>
                    </div>

                    {/* Trend */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trend.bg}`}>
                      <TrendIcon className={`w-3 h-3 ${trend.color}`} />
                      <span className={`text-xs font-medium ${trend.color}`}>
                        {trend.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insight Footer */}
      {insight && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 rounded-b-lg">
          <p className="text-sm text-amber-800">
            💡 {insight}
          </p>
        </div>
      )}
    </div>
  );
};

export default CommonIssues;
