/**
 * TrendsSummary Component
 *
 * Displays deficiency trend categories:
 * - Worsening (severity increased)
 * - Persistent (same severity across surveys)
 * - Improving (severity decreased)
 * - Resolved (not in most recent survey)
 */

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';

/**
 * Trend category card
 */
const TrendCard = ({ trend, count, tags, color, icon: Icon, label, description, onClick }) => {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 ${colorClasses[color]} text-left hover:shadow-md transition-shadow w-full`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <span className="font-semibold">{label}</span>
        </div>
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <p className="text-xs mt-1 opacity-75">{description}</p>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.slice(0, 3).map(tag => (
            <span
              key={tag.tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/50"
            >
              {tag.tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-500">
              +{tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </button>
  );
};

/**
 * Tag detail row in expanded view
 */
const TagRow = ({ tag }) => {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-medium text-gray-900">{tag.tag}</span>
        {tag.systemName && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {tag.systemName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{tag.citationCount} citation{tag.citationCount !== 1 ? 's' : ''}</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
};

export function TrendsSummary({ data, loading, error }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {data?.message || 'No trend data available'}
          </p>
        </div>
      </div>
    );
  }

  const { tagTrends, summary, trajectory } = data;

  const categories = [
    {
      key: 'worsening',
      label: 'Worsening',
      description: 'Severity increased',
      count: summary.worseningCount,
      tags: tagTrends.worsening,
      color: 'red',
      icon: TrendingUp
    },
    {
      key: 'persistent',
      label: 'Persistent',
      description: 'Same severity across surveys',
      count: summary.persistentCount,
      tags: tagTrends.persistent,
      color: 'yellow',
      icon: Minus
    },
    {
      key: 'improving',
      label: 'Improving',
      description: 'Severity decreased',
      count: summary.improvingCount,
      tags: tagTrends.improving,
      color: 'green',
      icon: TrendingDown
    },
    {
      key: 'resolved',
      label: 'Resolved',
      description: 'Not in most recent survey',
      count: summary.resolvedCount,
      tags: tagTrends.resolved,
      color: 'green',
      icon: CheckCircle2
    }
  ];

  const selectedCategoryData = selectedCategory
    ? categories.find(c => c.key === selectedCategory)
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Deficiency Trends</h3>
        <p className="text-sm text-gray-500 mt-1">
          {summary.totalSurveys} surveys, {summary.uniqueTags} unique tags
        </p>
      </div>

      {/* Trajectory Summary */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Overall Trajectory:</span>
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1 ${
              trajectory.count === 'up' ? 'text-red-600' :
              trajectory.count === 'down' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {trajectory.count === 'up' ? <TrendingUp className="h-4 w-4" /> :
               trajectory.count === 'down' ? <TrendingDown className="h-4 w-4" /> :
               <Minus className="h-4 w-4" />}
              Count {trajectory.count}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">
              {trajectory.repeatRate}% repeat rate
            </span>
          </div>
        </div>
      </div>

      {/* Trend Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map(category => (
            <TrendCard
              key={category.key}
              {...category}
              onClick={() => setSelectedCategory(
                selectedCategory === category.key ? null : category.key
              )}
            />
          ))}
        </div>

        {/* New Tags (if any) */}
        {summary.newCount > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {summary.newCount} new tag{summary.newCount !== 1 ? 's' : ''} in most recent survey
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {tagTrends.new.map(tag => (
                <span
                  key={tag.tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag.tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Category View */}
      {selectedCategoryData && selectedCategoryData.tags.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">
              {selectedCategoryData.label} Tags ({selectedCategoryData.count})
            </h4>
            <div className="space-y-1">
              {selectedCategoryData.tags.map(tag => (
                <TagRow key={tag.tag} tag={tag} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrendsSummary;
