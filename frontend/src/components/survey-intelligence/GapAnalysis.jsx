import React from 'react';

/**
 * Visual quadrant showing external vs internal alignment
 */
const GapAnalysis = ({ status, insight, surveyRiskScore, auditScore }) => {
  const statusConfig = {
    CONFIRMED_RISK: {
      icon: '🚨',
      label: 'Confirmed Risk',
      color: 'red',
      description: 'Both external and internal indicators show concern'
    },
    VALIDATE: {
      icon: '⚠️',
      label: 'Validate',
      color: 'orange',
      description: 'Strong internal scores but elevated external risk'
    },
    HIDDEN_RISK: {
      icon: '👁️',
      label: 'Hidden Risk',
      color: 'yellow',
      description: 'Low external risk but internal audits show concerns'
    },
    GOOD_SHAPE: {
      icon: '✅',
      label: 'Good Shape',
      color: 'green',
      description: 'Both external and internal indicators are positive'
    },
    NO_AUDIT_DATA: {
      icon: '📋',
      label: 'No Audit Data',
      color: 'gray',
      description: 'Internal audit data not available'
    }
  };

  const config = statusConfig[status] || statusConfig.NO_AUDIT_DATA;

  const getColorClasses = (color) => {
    const colors = {
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
      gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' }
    };
    return colors[color] || colors.gray;
  };

  const colors = getColorClasses(config.color);

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Gap Analysis</h3>
        <span className={`px-2 py-1 text-sm font-medium rounded ${colors.badge}`}>
          {config.icon} {config.label}
        </span>
      </div>

      {/* Quadrant visualization */}
      <div className="relative mb-4">
        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-1 h-32">
          {/* Top-left: VALIDATE (High External, High Internal) */}
          <div className={`rounded-tl-lg p-2 flex items-center justify-center text-xs ${
            status === 'VALIDATE' ? 'bg-orange-200 ring-2 ring-orange-400' : 'bg-orange-100'
          }`}>
            <span className="text-center">
              <span className="block font-semibold">VALIDATE</span>
              <span className="text-orange-600">High Risk / Good Audit</span>
            </span>
          </div>

          {/* Top-right: CONFIRMED_RISK (High External, Low Internal) */}
          <div className={`rounded-tr-lg p-2 flex items-center justify-center text-xs ${
            status === 'CONFIRMED_RISK' ? 'bg-red-200 ring-2 ring-red-400' : 'bg-red-100'
          }`}>
            <span className="text-center">
              <span className="block font-semibold">CONFIRMED</span>
              <span className="text-red-600">High Risk / Low Audit</span>
            </span>
          </div>

          {/* Bottom-left: GOOD_SHAPE (Low External, High Internal) */}
          <div className={`rounded-bl-lg p-2 flex items-center justify-center text-xs ${
            status === 'GOOD_SHAPE' ? 'bg-green-200 ring-2 ring-green-400' : 'bg-green-100'
          }`}>
            <span className="text-center">
              <span className="block font-semibold">GOOD SHAPE</span>
              <span className="text-green-600">Low Risk / Good Audit</span>
            </span>
          </div>

          {/* Bottom-right: HIDDEN_RISK (Low External, Low Internal) */}
          <div className={`rounded-br-lg p-2 flex items-center justify-center text-xs ${
            status === 'HIDDEN_RISK' ? 'bg-yellow-200 ring-2 ring-yellow-400' : 'bg-yellow-100'
          }`}>
            <span className="text-center">
              <span className="block font-semibold">HIDDEN RISK</span>
              <span className="text-yellow-600">Low Risk / Low Audit</span>
            </span>
          </div>
        </div>

        {/* Axis labels */}
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-500 whitespace-nowrap">
          ← Low Audit | High Audit →
        </div>
        <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
          ← Low Risk | High Risk →
        </div>
      </div>

      {/* Score comparison */}
      <div className="grid grid-cols-2 gap-4 mt-6 mb-3">
        <div className="text-center p-2 bg-white rounded">
          <p className="text-xs text-gray-500">Survey Risk (External)</p>
          <p className={`text-xl font-bold ${
            surveyRiskScore >= 55 ? 'text-red-600' : 'text-green-600'
          }`}>
            {surveyRiskScore || '--'}
          </p>
          <p className="text-xs text-gray-400">
            {surveyRiskScore >= 55 ? 'High' : 'Low'}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded">
          <p className="text-xs text-gray-500">Audit Score (Internal)</p>
          <p className={`text-xl font-bold ${
            auditScore === null ? 'text-gray-400' :
            auditScore >= 70 ? 'text-green-600' : 'text-red-600'
          }`}>
            {auditScore || '--'}
          </p>
          <p className="text-xs text-gray-400">
            {auditScore === null ? 'No data' :
             auditScore >= 70 ? 'Good' : 'Low'}
          </p>
        </div>
      </div>

      {/* Insight */}
      {insight && (
        <div className={`p-3 rounded ${colors.bg}`}>
          <p className={`text-sm ${colors.text}`}>{insight}</p>
        </div>
      )}
    </div>
  );
};

export default GapAnalysis;
