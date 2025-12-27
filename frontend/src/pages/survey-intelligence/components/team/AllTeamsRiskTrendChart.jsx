/**
 * AllTeamsRiskTrendChart.jsx
 * Multi-line chart showing risk trends for all teams or all facilities
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  Eye,
  EyeOff,
  Users,
  Building2
} from 'lucide-react';

const AllTeamsRiskTrendChart = ({
  teamsData,
  facilitiesData,
  months,
  onMonthsChange,
  viewMode,
  onViewModeChange,
  loading
}) => {
  // Track which items are visible
  const [visibleItems, setVisibleItems] = useState({});

  // Get current data based on view mode
  const currentData = viewMode === 'teams' ? teamsData?.teams : facilitiesData?.facilities;
  const itemKey = viewMode === 'teams' ? 'teamId' : 'facilityId';
  const itemName = viewMode === 'teams' ? 'teamName' : 'facilityName';

  // Initialize visibility when data loads or view changes
  useEffect(() => {
    if (currentData) {
      const initial = {};
      currentData.forEach(item => {
        initial[item[itemKey]] = true;
      });
      setVisibleItems(initial);
    }
  }, [currentData, viewMode]);

  // Transform data for Recharts (needs unified data points)
  const chartData = useMemo(() => {
    if (!currentData || currentData.length === 0) return [];

    // Use the first item's data structure as base
    const firstItem = currentData.find(item => item.data?.length > 0);
    if (!firstItem) return [];

    return firstItem.data.map((point, index) => {
      const dataPoint = {
        month: point.month,
        monthLabel: point.monthLabel
      };

      // Add each item's risk score
      currentData.forEach(item => {
        if (item.data?.[index]) {
          dataPoint[`item_${item[itemKey]}`] = item.data[index].riskScore;
        }
      });

      return dataPoint;
    });
  }, [currentData, itemKey]);

  // Toggle item visibility
  const toggleItem = (id) => {
    setVisibleItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle all items
  const toggleAllItems = (visible) => {
    const updated = {};
    currentData?.forEach(item => {
      updated[item[itemKey]] = visible;
    });
    setVisibleItems(updated);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Sort by risk score descending
      const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm max-h-80 overflow-y-auto">
          <p className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2 mb-2">
            {label}
          </p>
          <div className="space-y-1.5">
            {sortedPayload.map((entry, index) => {
              const item = currentData?.find(i => `item_${i[itemKey]}` === entry.dataKey);
              if (!item) return null;

              const riskColor = entry.value > 70 ? 'text-red-600' :
                entry.value > 40 ? 'text-amber-600' : 'text-green-600';

              return (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-700 truncate">
                      {item[itemName]}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ${riskColor}`}>
                    {entry.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if all items are visible or hidden
  const allVisible = currentData?.every(item => visibleItems[item[itemKey]]);
  const allHidden = currentData?.every(item => !visibleItems[item[itemKey]]);

  // Group facilities by team for display
  const groupedFacilities = useMemo(() => {
    if (viewMode !== 'facilities' || !facilitiesData?.facilities) return null;

    const groups = {};
    facilitiesData.facilities.forEach(f => {
      if (!groups[f.teamId]) {
        groups[f.teamId] = {
          teamName: f.teamName,
          facilities: []
        };
      }
      groups[f.teamId].facilities.push(f);
    });
    return groups;
  }, [viewMode, facilitiesData]);

  // Time period options
  const timeOptions = [
    { value: 3, label: '3mo' },
    { value: 6, label: '6mo' },
    { value: 12, label: '1yr' },
    { value: 24, label: '2yr' },
    { value: 36, label: '3yr' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Risk Score Trends</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange?.('teams')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'teams'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Teams
              </button>
              <button
                onClick={() => onViewModeChange?.('facilities')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'facilities'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Facilities
              </button>
            </div>

            {/* Time Range Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {timeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onMonthsChange?.(opt.value)}
                  className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    months === opt.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {viewMode === 'teams'
            ? 'Compare average risk scores across teams over time'
            : 'Compare individual facility risk scores over time'
          }
        </p>
      </div>

      {/* Chart */}
      <div className="p-4">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
              <span>Loading trend data...</span>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  interval={months > 12 ? Math.floor(months / 12) : 0}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Risk level reference lines */}
                <ReferenceLine
                  y={70}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{
                    value: 'High',
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 10
                  }}
                />
                <ReferenceLine
                  y={40}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Moderate',
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 10
                  }}
                />

                {/* Item lines */}
                {currentData?.map((item) => (
                  visibleItems[item[itemKey]] && (
                    <Line
                      key={item[itemKey]}
                      type="monotone"
                      dataKey={`item_${item[itemKey]}`}
                      name={item[itemName]}
                      stroke={item.color}
                      strokeWidth={viewMode === 'teams' ? 2 : 1.5}
                      dot={months <= 12 ? { fill: item.color, strokeWidth: 0, r: 3 } : false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: item.color }}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No trend data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend / Item Toggles */}
      {currentData && currentData.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {viewMode === 'teams' ? 'Teams' : 'Facilities'} ({currentData.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAllItems(true)}
                disabled={allVisible}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  allVisible
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Eye className="w-3 h-3" />
                Show All
              </button>
              <button
                onClick={() => toggleAllItems(false)}
                disabled={allHidden}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  allHidden
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <EyeOff className="w-3 h-3" />
                Hide All
              </button>
            </div>
          </div>

          {/* Teams view - simple list */}
          {viewMode === 'teams' && (
            <div className="flex flex-wrap gap-2">
              {currentData.map((item) => (
                <button
                  key={item[itemKey]}
                  onClick={() => toggleItem(item[itemKey])}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                    visibleItems[item[itemKey]]
                      ? 'bg-white border border-gray-200 shadow-sm'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-opacity ${
                      visibleItems[item[itemKey]] ? 'opacity-100' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={visibleItems[item[itemKey]] ? 'text-gray-900' : 'text-gray-500'}>
                    {item[itemName]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Facilities view - grouped by team */}
          {viewMode === 'facilities' && groupedFacilities && (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {Object.entries(groupedFacilities).map(([teamId, group]) => (
                <div key={teamId}>
                  <div className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group.teamName}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-4">
                    {group.facilities.map((facility) => (
                      <button
                        key={facility.facilityId}
                        onClick={() => toggleItem(facility.facilityId)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${
                          visibleItems[facility.facilityId]
                            ? 'bg-white border border-gray-200 shadow-sm'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full transition-opacity ${
                            visibleItems[facility.facilityId] ? 'opacity-100' : 'opacity-40'
                          }`}
                          style={{ backgroundColor: facility.color }}
                        />
                        <span className={visibleItems[facility.facilityId] ? 'text-gray-900' : 'text-gray-500'}>
                          {facility.facilityName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllTeamsRiskTrendChart;
