/**
 * FacilityComparisonTable.jsx
 * Sortable table comparing all facilities in the team
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  ExternalLink,
  Calendar,
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const FacilityComparisonTable = ({ data }) => {
  const [sortField, setSortField] = useState('riskScore');
  const [sortDirection, setSortDirection] = useState('desc');

  if (!data) return null;

  const { teamName, facilities } = data;

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sorted facilities
  const sortedFacilities = useMemo(() => {
    return [...facilities].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null values
      if (aVal === null) aVal = sortDirection === 'desc' ? -Infinity : Infinity;
      if (bVal === null) bVal = sortDirection === 'desc' ? -Infinity : Infinity;

      // Handle nested gap alert
      if (sortField === 'gapAlert') {
        const priority = { 'URGENT': 0, 'ATTENTION': 1, 'MONITOR': 2, 'IMPROVE': 3, 'STRONG': 4 };
        aVal = priority[a.gapAlert?.alert] ?? 5;
        bVal = priority[b.gapAlert?.alert] ?? 5;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [facilities, sortField, sortDirection]);

  // Sort header component
  const SortHeader = ({ field, children, className = '' }) => {
    const isActive = sortField === field;
    return (
      <th 
        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${className}`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3 h-3 text-blue-600" />
            ) : (
              <ArrowDown className="w-3 h-3 text-blue-600" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </th>
    );
  };

  // Get risk level styling
  const getRiskBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
      case 'MODERATE':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' };
      default:
        return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
    }
  };

  // Get gap alert badge
  const getGapAlertBadge = (gapAlert) => {
    if (!gapAlert) return null;

    const configs = {
      'URGENT': { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
      'MONITOR': { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertCircle },
      'ATTENTION': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle },
      'IMPROVE': { bg: 'bg-blue-100', text: 'text-blue-700', icon: AlertCircle },
      'STRONG': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle }
    };

    const config = configs[gapAlert.alert] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {gapAlert.alert}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Facility Comparison</h2>
          </div>
          <span className="text-sm text-gray-500">
            Sorted by {sortField.replace(/([A-Z])/g, ' $1').toLowerCase()} ({sortDirection})
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader field="name">Facility</SortHeader>
              <SortHeader field="riskScore" className="text-center">Risk Score</SortHeader>
              <SortHeader field="riskLevel" className="text-center">Risk Level</SortHeader>
              <SortHeader field="daysSinceLastSurvey" className="text-center">Last Survey</SortHeader>
              <SortHeader field="citationCount12mo" className="text-center">Citations (12mo)</SortHeader>
              <SortHeader field="ijCount" className="text-center">IJ Count</SortHeader>
              <SortHeader field="scorecardAvg" className="text-center">Scorecard Avg</SortHeader>
              <SortHeader field="gapAlert" className="text-center">Gap Alert</SortHeader>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedFacilities.map((facility, index) => {
              const riskBadge = getRiskBadge(facility.riskLevel);

              return (
                <tr 
                  key={facility.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    facility.gapAlert?.alert === 'URGENT' ? 'bg-red-50/50' : ''
                  }`}
                >
                  {/* Facility Name */}
                  <td className="px-4 py-4">
                    <div>
                      <span className="font-medium text-gray-900">{facility.name}</span>
                      {facility.ccn && (
                        <span className="text-xs text-gray-500 block">CCN: {facility.ccn}</span>
                      )}
                    </div>
                  </td>

                  {/* Risk Score */}
                  <td className="px-4 py-4 text-center">
                    <span className={`text-lg font-bold ${
                      facility.riskScore >= 70 ? 'text-red-600' :
                      facility.riskScore >= 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {facility.riskScore}
                    </span>
                  </td>

                  {/* Risk Level */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${riskBadge.bg} ${riskBadge.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${riskBadge.dot}`}></span>
                      {facility.riskLevel}
                    </span>
                  </td>

                  {/* Last Survey */}
                  <td className="px-4 py-4 text-center">
                    {facility.daysSinceLastSurvey !== null ? (
                      <div>
                        <span className={`font-medium ${
                          facility.daysSinceLastSurvey < 90 ? 'text-red-600' :
                          facility.daysSinceLastSurvey < 180 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {facility.daysSinceLastSurvey}d ago
                        </span>
                        {facility.lastSurveyDate && (
                          <span className="text-xs text-gray-500 block">
                            {new Date(facility.lastSurveyDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Citations 12mo */}
                  <td className="px-4 py-4 text-center">
                    <span className={`font-semibold ${
                      facility.citationCount12mo >= 10 ? 'text-red-600' :
                      facility.citationCount12mo >= 5 ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {facility.citationCount12mo}
                    </span>
                  </td>

                  {/* IJ Count */}
                  <td className="px-4 py-4 text-center">
                    {facility.ijCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        {facility.ijCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>

                  {/* Scorecard Avg */}
                  <td className="px-4 py-4 text-center">
                    {facility.scorecardAvg !== null ? (
                      <span className={`font-bold ${
                        facility.scorecardAvg >= 85 ? 'text-green-600' :
                        facility.scorecardAvg >= 75 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {facility.scorecardAvg}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Gap Alert */}
                  <td className="px-4 py-4 text-center">
                    {getGapAlertBadge(facility.gapAlert)}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-4">
                    <Link
                      to={`/survey-intelligence?facilityId=${facility.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                      title="View Facility Intelligence"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500">
          Click column headers to sort. Click the arrow icon to view detailed facility intelligence.
        </p>
      </div>
    </div>
  );
};

export default FacilityComparisonTable;
