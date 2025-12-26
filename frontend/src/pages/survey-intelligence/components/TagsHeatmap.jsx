/**
 * TagsHeatmap Component
 *
 * Visual grid showing every deficiency tag across all surveys.
 * Each cell shows severity by color, with trend indicators.
 */

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';

/**
 * Severity color mapping
 */
const SEVERITY_COLORS = {
  'A': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'No deficiency' },
  'B': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'No harm - minimal' },
  'C': { bg: 'bg-blue-200', text: 'text-blue-800', label: 'No harm - potential' },
  'D': { bg: 'bg-blue-300', text: 'text-blue-900', label: 'Isolated - no harm' },
  'E': { bg: 'bg-yellow-200', text: 'text-yellow-800', label: 'Pattern - no harm' },
  'F': { bg: 'bg-yellow-300', text: 'text-yellow-900', label: 'Widespread - no harm' },
  'G': { bg: 'bg-orange-300', text: 'text-orange-900', label: 'Isolated - actual harm' },
  'H': { bg: 'bg-orange-400', text: 'text-orange-900', label: 'Pattern - actual harm' },
  'I': { bg: 'bg-red-300', text: 'text-red-900', label: 'Widespread - actual harm' },
  'J': { bg: 'bg-red-400', text: 'text-red-900', label: 'Isolated - IJ' },
  'K': { bg: 'bg-red-500', text: 'text-white', label: 'Pattern - IJ' },
  'L': { bg: 'bg-red-600', text: 'text-white', label: 'Widespread - IJ' }
};

/**
 * Trend icons and colors
 */
const TREND_CONFIG = {
  worsening: { icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-50', label: 'Worsening' },
  persistent: { icon: Minus, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Persistent' },
  improving: { icon: TrendingDown, color: 'text-green-500', bg: 'bg-green-50', label: 'Improving' },
  resolved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Resolved' },
  new: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50', label: 'New' }
};

/**
 * Category labels
 */
const CATEGORY_LABELS = {
  health: 'Health Deficiencies (F-tags)',
  life_safety: 'Life Safety Code (K-tags)',
  emergency_prep: 'Emergency Preparedness (E-tags)'
};

/**
 * Single heatmap cell
 */
const HeatmapCell = ({ citation, onClick }) => {
  if (!citation) {
    return (
      <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded" />
    );
  }

  const colors = SEVERITY_COLORS[citation.severity] || SEVERITY_COLORS['B'];

  return (
    <button
      onClick={() => onClick?.(citation)}
      className={`w-8 h-8 ${colors.bg} border border-gray-200 rounded flex items-center justify-center
        hover:ring-2 hover:ring-purple-400 hover:ring-offset-1 transition-all cursor-pointer`}
      title={`${citation.severity}: ${colors.label}`}
    >
      <span className={`text-xs font-bold ${colors.text}`}>
        {citation.severity}
      </span>
    </button>
  );
};

/**
 * Tag row with trend indicator
 */
const TagRow = ({ tag, surveys, onCellClick }) => {
  const TrendIcon = TREND_CONFIG[tag.trend]?.icon || Minus;
  const trendConfig = TREND_CONFIG[tag.trend] || TREND_CONFIG.persistent;

  // Build citation map by date
  const citationsByDate = useMemo(() => {
    const map = {};
    tag.citations.forEach(c => {
      map[c.surveyDate] = c;
    });
    return map;
  }, [tag.citations]);

  return (
    <tr className="hover:bg-gray-50">
      {/* Tag info */}
      <td className="sticky left-0 bg-white border-r border-gray-200 px-3 py-2 z-10">
        <div className="flex items-center gap-2 min-w-[140px]">
          <span className={`p-1 rounded ${trendConfig.bg}`}>
            <TrendIcon className={`h-3 w-3 ${trendConfig.color}`} />
          </span>
          <div>
            <span className="font-mono text-sm font-medium text-gray-900">{tag.tag}</span>
            {tag.systemName && tag.systemName !== 'Other' && (
              <p className="text-xs text-gray-500 truncate max-w-[120px]">{tag.systemName}</p>
            )}
          </div>
        </div>
      </td>

      {/* Citation count */}
      <td className="sticky left-[164px] bg-white border-r border-gray-200 px-2 py-2 text-center z-10">
        <span className="text-sm text-gray-600">{tag.citationCount}</span>
      </td>

      {/* Survey cells */}
      {surveys.map(survey => (
        <td key={survey.date} className="px-1 py-1 text-center">
          <HeatmapCell
            citation={citationsByDate[survey.date]}
            onClick={onCellClick}
          />
        </td>
      ))}
    </tr>
  );
};

/**
 * Category section header
 */
const CategoryHeader = ({ category, count, isExpanded, onToggle }) => {
  const label = CATEGORY_LABELS[category] || category;

  return (
    <tr className="bg-gray-100">
      <td
        colSpan={100}
        className="sticky left-0 px-3 py-2 cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-500">({count} tags)</span>
        </div>
      </td>
    </tr>
  );
};

export function TagsHeatmap({ data, loading, error }) {
  const [expandedCategories, setExpandedCategories] = useState({
    health: true,
    life_safety: true,
    emergency_prep: true
  });
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [trendFilter, setTrendFilter] = useState('all');

  // Group tags by category
  const groupedTags = useMemo(() => {
    if (!data?.tags) return {};

    const groups = {
      health: [],
      life_safety: [],
      emergency_prep: []
    };

    data.tags.forEach(tag => {
      const category = tag.category || 'health';
      if (groups[category]) {
        groups[category].push(tag);
      }
    });

    return groups;
  }, [data?.tags]);

  // Filter tags by trend
  const filteredGroups = useMemo(() => {
    if (trendFilter === 'all') return groupedTags;

    const filtered = {};
    Object.keys(groupedTags).forEach(category => {
      filtered[category] = groupedTags[category].filter(tag => tag.trend === trendFilter);
    });
    return filtered;
  }, [groupedTags, trendFilter]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
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
            {data?.message || 'No deficiency data available'}
          </p>
        </div>
      </div>
    );
  }

  const { surveys, summary } = data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Deficiency Heatmap</h3>
            <p className="text-sm text-gray-500">
              {summary.totalTags} tags across {surveys.length} surveys
            </p>
          </div>

          {/* Trend Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Trends</option>
              <option value="worsening">Worsening ({summary.worseningTags})</option>
              <option value="persistent">Persistent ({summary.persistentTags})</option>
              <option value="improving">Improving ({summary.improvingTags})</option>
              <option value="resolved">Resolved ({summary.resolvedTags})</option>
              <option value="new">New ({summary.newTags})</option>
            </select>
          </div>
        </div>

        {/* Summary Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.entries(TREND_CONFIG).map(([key, config]) => {
            const count = summary[`${key}Tags`] || 0;
            const TrendIcon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setTrendFilter(trendFilter === key ? 'all' : key)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  trendFilter === key
                    ? `${config.bg} ${config.color} ring-2 ring-offset-1 ring-current`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TrendIcon className="h-3 w-3" />
                <span className="capitalize">{key}</span>
                <span className="font-medium">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 border-r border-b border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-20">
                Tag
              </th>
              <th className="sticky left-[164px] bg-gray-50 border-r border-b border-gray-200 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider z-20">
                #
              </th>
              {surveys.map(survey => (
                <th
                  key={survey.date}
                  className="border-b border-gray-200 px-1 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap"
                >
                  {new Date(survey.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Health Deficiencies */}
            {filteredGroups.health?.length > 0 && (
              <>
                <CategoryHeader
                  category="health"
                  count={filteredGroups.health.length}
                  isExpanded={expandedCategories.health}
                  onToggle={() => toggleCategory('health')}
                />
                {expandedCategories.health && filteredGroups.health.map(tag => (
                  <TagRow
                    key={tag.tag}
                    tag={tag}
                    surveys={surveys}
                    onCellClick={setSelectedCitation}
                  />
                ))}
              </>
            )}

            {/* Life Safety */}
            {filteredGroups.life_safety?.length > 0 && (
              <>
                <CategoryHeader
                  category="life_safety"
                  count={filteredGroups.life_safety.length}
                  isExpanded={expandedCategories.life_safety}
                  onToggle={() => toggleCategory('life_safety')}
                />
                {expandedCategories.life_safety && filteredGroups.life_safety.map(tag => (
                  <TagRow
                    key={tag.tag}
                    tag={tag}
                    surveys={surveys}
                    onCellClick={setSelectedCitation}
                  />
                ))}
              </>
            )}

            {/* Emergency Prep */}
            {filteredGroups.emergency_prep?.length > 0 && (
              <>
                <CategoryHeader
                  category="emergency_prep"
                  count={filteredGroups.emergency_prep.length}
                  isExpanded={expandedCategories.emergency_prep}
                  onToggle={() => toggleCategory('emergency_prep')}
                />
                {expandedCategories.emergency_prep && filteredGroups.emergency_prep.map(tag => (
                  <TagRow
                    key={tag.tag}
                    tag={tag}
                    surveys={surveys}
                    onCellClick={setSelectedCitation}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Severity Legend</p>
        <div className="flex flex-wrap gap-2">
          {['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(sev => {
            const colors = SEVERITY_COLORS[sev];
            return (
              <div
                key={sev}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded ${colors.bg}`}
                title={colors.label}
              >
                <span className={`text-xs font-bold ${colors.text}`}>{sev}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Citation Detail Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Citation Detail</h4>
                <p className="text-sm text-gray-500">
                  {new Date(selectedCitation.surveyDate).toLocaleDateString()}
                </p>
              </div>
              <div className={`px-3 py-1 rounded ${SEVERITY_COLORS[selectedCitation.severity]?.bg}`}>
                <span className={`font-bold ${SEVERITY_COLORS[selectedCitation.severity]?.text}`}>
                  {selectedCitation.severity}
                </span>
              </div>
            </div>
            {selectedCitation.text && (
              <p className="text-sm text-gray-700 mb-4 max-h-48 overflow-y-auto">
                {selectedCitation.text}
              </p>
            )}
            <button
              onClick={() => setSelectedCitation(null)}
              className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TagsHeatmap;
