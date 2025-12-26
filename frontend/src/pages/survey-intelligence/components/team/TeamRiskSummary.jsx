/**
 * TeamRiskSummary.jsx
 * Displays team risk score with distribution donut chart
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Building2,
  ExternalLink
} from 'lucide-react';

const TeamRiskSummary = ({ data }) => {
  if (!data) return null;

  const { 
    riskScore, 
    riskLevel, 
    distribution, 
    highestRiskFacility,
    daysSinceLastCitation,
    totalCitations,
    facilityCount
  } = data;

  // Risk level styling
  const getRiskStyles = (level) => {
    switch (level) {
      case 'HIGH':
        return { 
          bg: 'bg-red-100', 
          text: 'text-red-700', 
          border: 'border-red-300',
          icon: AlertTriangle,
          iconColor: 'text-red-500'
        };
      case 'MODERATE':
        return { 
          bg: 'bg-yellow-100', 
          text: 'text-yellow-700', 
          border: 'border-yellow-300',
          icon: AlertCircle,
          iconColor: 'text-yellow-500'
        };
      default:
        return { 
          bg: 'bg-green-100', 
          text: 'text-green-700', 
          border: 'border-green-300',
          icon: CheckCircle,
          iconColor: 'text-green-500'
        };
    }
  };

  const styles = getRiskStyles(riskLevel);
  const RiskIcon = styles.icon;

  // Calculate donut chart segments
  const total = distribution.low + distribution.moderate + distribution.high;
  const segments = [
    { count: distribution.high, color: '#ef4444', label: 'High Risk' },
    { count: distribution.moderate, color: '#f59e0b', label: 'Moderate' },
    { count: distribution.low, color: '#22c55e', label: 'Low Risk' },
  ];

  // SVG donut chart
  const DonutChart = () => {
    const size = 120;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    let currentOffset = 0;

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, index) => {
          const percentage = total > 0 ? segment.count / total : 0;
          const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += circumference * percentage;

          if (segment.count === 0) return null;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          );
        })}
        {/* Center circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth / 2}
          fill="white"
        />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Team Risk Summary</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Risk Score Display */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <DonutChart />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{riskScore}</span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>

          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${styles.bg} ${styles.border} border mb-2`}>
              <RiskIcon className={`w-4 h-4 ${styles.iconColor}`} />
              <span className={`text-sm font-medium ${styles.text}`}>{riskLevel} Risk</span>
            </div>
            <p className="text-sm text-gray-600">
              Team average across {facilityCount} facilities
            </p>
          </div>
        </div>

        {/* Distribution Legend */}
        <div className="flex justify-around mb-6 py-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-lg font-bold text-gray-900">{distribution.high}</span>
            </div>
            <span className="text-xs text-gray-500">High Risk</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-lg font-bold text-gray-900">{distribution.moderate}</span>
            </div>
            <span className="text-xs text-gray-500">Moderate</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-lg font-bold text-gray-900">{distribution.low}</span>
            </div>
            <span className="text-xs text-gray-500">Low Risk</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          {/* Days Since Last Citation */}
          {daysSinceLastCitation !== null && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Days since last citation</span>
              </div>
              <span className={`font-semibold ${daysSinceLastCitation < 90 ? 'text-red-600' : 'text-gray-900'}`}>
                {daysSinceLastCitation}
              </span>
            </div>
          )}

          {/* Total Citations */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Total citations (3yr)</span>
            </div>
            <span className="font-semibold text-gray-900">{totalCitations}</span>
          </div>

          {/* Highest Risk Facility */}
          {highestRiskFacility && (
            <div className="pt-2">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Highest Risk Facility</span>
              </div>
              <Link
                to={`/survey-intelligence?facilityId=${highestRiskFacility.facilityId}`}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group"
              >
                <div>
                  <span className="font-medium text-gray-900 block">
                    {highestRiskFacility.facilityName}
                  </span>
                  <span className="text-sm text-gray-500">
                    Score: {highestRiskFacility.riskScore} · {highestRiskFacility.citationCount} citations
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer Insight */}
      <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 rounded-b-lg">
        <p className="text-sm text-blue-800">
          💡 {distribution.high > 0 
            ? `${distribution.high} facility/facilities need immediate attention. Review the gap analysis below.`
            : 'Team is performing well. Continue monitoring scorecard trends.'}
        </p>
      </div>
    </div>
  );
};

export default TeamRiskSummary;
