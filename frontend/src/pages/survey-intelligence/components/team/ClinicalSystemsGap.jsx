/**
 * ClinicalSystemsGap.jsx
 * THE KEY SECTION: Shows CMS Risk vs Scorecard for each clinical system
 * 
 * Gap Alert Logic:
 * - URGENT: HIGH CMS risk + Low scorecard (<75%)
 * - MONITOR: HIGH CMS risk + High scorecard (≥75%)
 * - ATTENTION: MODERATE CMS risk + Low scorecard
 * - IMPROVE: LOW CMS risk + Low scorecard
 * - STRONG: LOW CMS risk + High scorecard
 */

import React from 'react';
import { 
  AlertTriangle, 
  Eye, 
  TrendingUp, 
  CheckCircle,
  ClipboardList,
  HelpCircle,
  Building2
} from 'lucide-react';
import ClickableTag from '../ClickableTag';

const ClinicalSystemsGap = ({ data }) => {
  if (!data) return null;

  const { teamName, facilityCount, analysis } = data;

  // Get alert badge styling
  const getAlertBadge = (gapAlert) => {
    const configs = {
      'URGENT': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
        icon: AlertTriangle,
        label: 'URGENT'
      },
      'MONITOR': {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-300',
        icon: Eye,
        label: 'MONITOR'
      },
      'ATTENTION': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
        icon: AlertTriangle,
        label: 'ATTENTION'
      },
      'IMPROVE': {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300',
        icon: ClipboardList,
        label: 'IMPROVE'
      },
      'STRONG': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
        icon: CheckCircle,
        label: 'STRONG'
      },
      'NO_DATA': {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-300',
        icon: HelpCircle,
        label: 'NO DATA'
      }
    };

    return configs[gapAlert.alert] || configs['NO_DATA'];
  };

  // Get CMS risk badge
  const getCmsRiskBadge = (level) => {
    const configs = {
      'HIGH': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
      'MODERATE': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
      'LOW': { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' }
    };
    return configs[level] || configs['LOW'];
  };

  // Get scorecard color
  const getScorecardColor = (score) => {
    if (score === null) return 'text-gray-400';
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Clinical Systems Gap Analysis</h2>
          </div>
          <span className="text-sm text-gray-500">{facilityCount} facilities</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Comparing CMS survey citations with internal scorecard performance
        </p>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600">🚨 URGENT = High CMS Risk + Low Scorecard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">⚠️ MONITOR = High CMS Risk + High Scorecard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">✅ STRONG = Low Risk + High Scorecard</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clinical System
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                CMS Risk
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Cited
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Top Tags
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scorecard Avg
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gap Alert
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {analysis.map((system) => {
              const alertConfig = getAlertBadge(system.gapAlert);
              const AlertIcon = alertConfig.icon;
              const cmsConfig = getCmsRiskBadge(system.cmsRisk.level);

              return (
                <tr 
                  key={system.systemNumber}
                  className={`hover:bg-gray-50 transition-colors ${
                    system.gapAlert.alert === 'URGENT' ? 'bg-red-50/50' : ''
                  }`}
                >
                  {/* System Name */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center">
                        {system.systemNumber}
                      </span>
                      <span className="font-medium text-gray-900">{system.systemName}</span>
                    </div>
                  </td>

                  {/* CMS Risk */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cmsConfig.bg} ${cmsConfig.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cmsConfig.dot}`}></span>
                      {system.cmsRisk.level}
                    </span>
                  </td>

                  {/* Facilities Cited */}
                  <td className="px-4 py-4 text-center">
                    <span className={`font-semibold ${
                      system.cmsRisk.facilitiesCited >= 3 ? 'text-red-600' :
                      system.cmsRisk.facilitiesCited >= 2 ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {system.cmsRisk.facilitiesCited}
                    </span>
                    <span className="text-gray-400 text-sm">/{facilityCount}</span>
                  </td>

                  {/* Top Tags */}
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {system.topTags.length > 0 ? (
                        system.topTags.map((tagData) => (
                          <ClickableTag 
                            key={tagData.tag}
                            tag={tagData.tag}
                            count={tagData.count}
                          />
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No citations</span>
                      )}
                    </div>
                  </td>

                  {/* Scorecard Avg */}
                  <td className="px-4 py-4 text-center">
                    {system.scorecardAvg !== null ? (
                      <div>
                        <span className={`text-lg font-bold ${getScorecardColor(system.scorecardAvg)}`}>
                          {system.scorecardAvg}%
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              system.scorecardAvg >= 85 ? 'bg-green-500' :
                              system.scorecardAvg >= 75 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${system.scorecardAvg}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No data</span>
                    )}
                  </td>

                  {/* Gap Alert */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${alertConfig.bg} ${alertConfig.text} ${alertConfig.border} border`}>
                      <AlertIcon className="w-3.5 h-3.5" />
                      {alertConfig.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* What This Means */}
      <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 rounded-b-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>What this means:</strong> Systems marked URGENT have both high survey risk AND gaps in your internal audits. 
          These need immediate attention. MONITOR systems are at risk from surveyors but your audits are catching them.
        </p>
      </div>
    </div>
  );
};

export default ClinicalSystemsGap;
