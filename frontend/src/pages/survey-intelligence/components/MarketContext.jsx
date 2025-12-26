/**
 * MarketContext Component
 *
 * Displays state-level market context:
 * - State trends with YoY change
 * - Tags in your history that are trending
 * - Emerging risks (trending tags not in your history)
 * - Horizontal bar chart visualization
 */

import {
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  AlertCircle,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { MarketContextTakeaway } from './SectionTakeaway';

/**
 * YoY change badge
 */
const YoYBadge = ({ change }) => {
  const isUp = change > 0;
  const isDown = change < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const color = isUp ? 'text-red-600' : isDown ? 'text-green-600' : 'text-gray-500';
  const bgColor = isUp ? 'bg-red-50' : isDown ? 'bg-green-50' : 'bg-gray-50';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${color}`}>
      <Icon className="h-3 w-3" />
      {change > 0 ? '+' : ''}{change}%
    </span>
  );
};

/**
 * State stats header
 */
const StateStatsHeader = ({ stats }) => {
  const trendIcon = stats.trend === 'increasing' ? TrendingUp
    : stats.trend === 'decreasing' ? TrendingDown
    : Minus;
  const trendColor = stats.trend === 'increasing' ? 'text-red-600'
    : stats.trend === 'decreasing' ? 'text-green-600'
    : 'text-gray-600';
  const TrendIcon = trendIcon;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">{stats.state} State Overview</h4>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {stats.totalFacilities} SNF facilities statewide
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
            <span className={`text-2xl font-bold ${trendColor}`}>
              {stats.yoyChange > 0 ? '+' : ''}{stats.yoyChange}%
            </span>
          </div>
          <p className="text-xs text-gray-500">YoY deficiency trend</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Recent 6 Months Avg</p>
          <p className="text-lg font-bold text-gray-900">{stats.recentAvgDeficiencies}</p>
          <p className="text-xs text-gray-500">deficiencies per facility</p>
        </div>
        <div className="bg-white/50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Prior 6 Months Avg</p>
          <p className="text-lg font-bold text-gray-900">{stats.priorAvgDeficiencies}</p>
          <p className="text-xs text-gray-500">deficiencies per facility</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Horizontal bar for tag visualization
 */
const TagBar = ({ tag, maxCount }) => {
  const percentage = maxCount > 0 ? (tag.recentCount / maxCount) * 100 : 0;

  return (
    <div className="py-3" title={tag.tagDescription}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-medium text-gray-900">{tag.tagFormatted || tag.tag}</span>
            {tag.systemName && tag.systemName !== 'Other' && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {tag.systemName}
              </span>
            )}
          </div>
          {tag.tagName && tag.tagName !== 'Unknown Tag' && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{tag.tagName}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <span className="text-sm text-gray-600">{tag.recentCount} citations</span>
          <YoYBadge change={tag.yoyChange} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500 w-16 text-right">
          {tag.percentOfFacilities}% of SNFs
        </span>
      </div>
    </div>
  );
};

/**
 * Tag section (either "Your Trending" or "Emerging Risks")
 */
const TagSection = ({ title, subtitle, icon: Icon, iconColor, tags, emptyMessage }) => {
  if (!tags || tags.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const maxCount = Math.max(...tags.map(t => t.recentCount));

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <h4 className="font-medium text-gray-900">{title}</h4>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-sm text-gray-500">{tags.length} tag{tags.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {tags.map(tag => (
          <TagBar key={tag.tag} tag={tag} maxCount={maxCount} />
        ))}
      </div>
    </div>
  );
};

export function MarketContext({ data, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-100 rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-gray-100 rounded-lg"></div>
            <div className="h-48 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
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
            {data?.message || 'No market context data available'}
          </p>
        </div>
      </div>
    );
  }

  const { stateStats, yourTrendingTags, emergingRisks, summary, dataPeriod } = data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Market Context</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              State-wide CMS survey trends for the last 6 months. Shows what surveyors are currently citing most frequently.
            </p>
          </div>
          {dataPeriod && (
            <div className="text-right text-sm text-gray-500">
              <span className="font-medium">{dataPeriod.label}</span>
              <p className="text-xs">{stateStats.facilitiesSurveyed} of {stateStats.totalFacilities} {stateStats.state} facilities surveyed</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* State Stats */}
        <StateStatsHeader stats={stateStats} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Trending Tags */}
          <TagSection
            title="Tags in Your History"
            subtitle="These tags from your CMS history are trending statewide"
            icon={TrendingUp}
            iconColor="text-orange-500"
            tags={yourTrendingTags}
            emptyMessage="None of your historical tags are currently trending in the state"
          />

          {/* Emerging Risks */}
          <TagSection
            title="Emerging Risks"
            subtitle="Trending statewide but not in your history - potential new focus areas"
            icon={Sparkles}
            iconColor="text-purple-500"
            tags={emergingRisks}
            emptyMessage="No significant emerging risks identified outside your history"
          />
        </div>

        {/* Takeaway */}
        <MarketContextTakeaway
          yourTrendingTags={yourTrendingTags}
          emergingRisks={emergingRisks}
          stateStats={stateStats}
        />
      </div>
    </div>
  );
}

export default MarketContext;
