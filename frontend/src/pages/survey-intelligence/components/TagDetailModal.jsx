/**
 * TagDetailModal Component
 *
 * Displays detailed information about a deficiency tag:
 * - Tag definition and description
 * - Facility citation history
 * - Geographic trends (CBSA, State, Region, National)
 * - Co-occurring tags
 */

import { useState, useEffect } from 'react';
import {
  X,
  Info,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Globe,
  Building,
  Calendar,
  ChevronRight,
  Loader2
} from 'lucide-react';
import client from '../../../api/client';

/**
 * Trend badge component
 */
const TrendBadge = ({ trend, percent }) => {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const color = trend === 'up' ? 'text-red-600 bg-red-50' : trend === 'down' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {percent}% YoY
    </span>
  );
};

/**
 * Geographic trend row
 */
const GeoTrendRow = ({ trend, icon: Icon }) => {
  if (!trend) return null;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{trend.name}</p>
          <p className="text-xs text-gray-500">
            {trend.facilitiesCited} of {trend.totalFacilities} facilities
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{trend.citations} citations</p>
        <TrendBadge trend={trend.trend} percent={Math.abs(trend.yoyChange)} />
        <p className="text-xs text-gray-500 mt-0.5">{trend.percentFacilities}% of facilities</p>
      </div>
    </div>
  );
};

/**
 * Facility history row
 */
const HistoryRow = ({ citation, isFirst }) => {
  const severityColors = {
    'A': 'bg-green-100 text-green-800',
    'B': 'bg-blue-100 text-blue-800',
    'C': 'bg-blue-100 text-blue-800',
    'D': 'bg-yellow-100 text-yellow-800',
    'E': 'bg-orange-100 text-orange-800',
    'F': 'bg-orange-100 text-orange-800',
    'G': 'bg-red-100 text-red-800',
    'H': 'bg-red-200 text-red-900',
    'I': 'bg-red-300 text-red-900',
    'J': 'bg-red-400 text-white',
    'K': 'bg-red-500 text-white',
    'L': 'bg-red-600 text-white'
  };

  const date = new Date(citation.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className={`py-3 ${isFirst ? '' : 'border-t border-gray-100'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{formattedDate}</span>
          {citation.surveyType && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {citation.surveyType}
            </span>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[citation.severity] || 'bg-gray-100 text-gray-800'}`}>
          Severity {citation.severity}
        </span>
      </div>
      {citation.excerpt && (
        <p className="text-sm text-gray-600 ml-6 line-clamp-2">{citation.excerpt}</p>
      )}
    </div>
  );
};

/**
 * Co-occurring tag pill
 */
const CoTagPill = ({ tag, onClick }) => {
  return (
    <button
      onClick={() => onClick?.(tag.tag)}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
    >
      <span className="font-mono font-medium text-gray-900">{tag.tagFormatted}</span>
      <span className="text-gray-500">({tag.count})</span>
      <ChevronRight className="h-3 w-3 text-gray-400" />
    </button>
  );
};

export function TagDetailModal({ isOpen, onClose, tag, facilityId, state }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !tag) return;

    const fetchTagDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (facilityId) params.append('facilityId', facilityId);
        if (state) params.append('state', state);

        const response = await client.get(
          `/survey-intel/tag/${encodeURIComponent(tag)}/details?${params}`
        );

        const result = response.data;
        if (result.success) {
          setData(result);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTagDetails();
  }, [isOpen, tag, facilityId, state]);

  if (!isOpen) return null;

  const handleCoTagClick = (newTag) => {
    // Future: Close this modal and open new one for the clicked tag
    // For now, co-tag clicks are visual only
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
            <div>
              {data?.tag ? (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{data.tag.formatted}</h2>
                    {data.tag.systemName && data.tag.systemName !== 'Other' && (
                      <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {data.tag.systemName}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{data.tag.name}</p>
                </>
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{tag}</h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            )}

            {error && (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {data && !loading && (
              <div className="p-6 space-y-6">
                {/* Description */}
                {data.tag?.description && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">{data.tag.description}</p>
                    </div>
                  </div>
                )}

                {/* Facility History */}
                {data.facilityHistory && data.facilityHistory.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                      Your Citation History
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {data.facilityHistory.map((citation, idx) => (
                        <HistoryRow
                          key={`${citation.date}-${idx}`}
                          citation={citation}
                          isFirst={idx === 0}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Geographic Trends */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Geographic Trends (Last 18 Months)
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {data.geographicTrends?.cbsa && (
                      <GeoTrendRow trend={data.geographicTrends.cbsa} icon={Building} />
                    )}
                    {data.geographicTrends?.state && (
                      <GeoTrendRow trend={data.geographicTrends.state} icon={MapPin} />
                    )}
                    {data.geographicTrends?.region && (
                      <GeoTrendRow trend={data.geographicTrends.region} icon={MapPin} />
                    )}
                    {data.geographicTrends?.national && (
                      <GeoTrendRow trend={data.geographicTrends.national} icon={Globe} />
                    )}
                    {!data.geographicTrends?.cbsa && !data.geographicTrends?.state &&
                     !data.geographicTrends?.region && !data.geographicTrends?.national && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No geographic trend data available
                      </p>
                    )}
                  </div>
                </div>

                {/* Co-occurring Tags */}
                {data.coOccurringTags && data.coOccurringTags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                      Frequently Co-Occurring Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.coOccurringTags.map(coTag => (
                        <CoTagPill
                          key={coTag.tag}
                          tag={coTag}
                          onClick={handleCoTagClick}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      These tags are most often cited together with {data.tag?.formatted || tag}
                    </p>
                  </div>
                )}

                {/* Data Period */}
                {data.dataPeriod && (
                  <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
                    Data period: {data.dataPeriod.recent.startDate} to {data.dataPeriod.recent.endDate}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TagDetailModal;
