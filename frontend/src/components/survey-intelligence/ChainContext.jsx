import React from 'react';

/**
 * Chain comparison panel showing facility performance vs chain average
 */
const ChainContext = ({ context }) => {
  if (!context || context.is_independent) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Chain Context</h3>
        <p className="text-gray-500 text-sm">
          Independent facility - no chain comparison available
        </p>
      </div>
    );
  }

  const {
    chain_name,
    chain_facility_count,
    chain_avg_qm,
    chain_rank,
    chain_percentile,
    facility_qm,
    vs_chain,
    vs_chain_status,
    best_in_chain,
    insight
  } = context;

  const getStatusColors = () => {
    if (vs_chain_status === 'ABOVE_PEERS') {
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
    } else if (vs_chain_status === 'BELOW_PEERS') {
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
    }
    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  };

  const colors = getStatusColors();

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Chain Context</h3>
          <p className="text-sm text-gray-600">{chain_name}</p>
        </div>
        <span className="text-xs bg-white px-2 py-1 rounded border">
          {chain_facility_count} facilities
        </span>
      </div>

      {/* Comparison visualization */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">This Facility</p>
          <p className="text-2xl font-bold text-gray-900">
            {facility_qm?.toFixed(1) || '--'}
          </p>
          <p className="text-xs text-gray-400">QM Stars</p>
        </div>

        <div className="text-center flex flex-col items-center justify-center">
          <div className={`text-lg font-bold ${colors.text}`}>
            {vs_chain >= 0 ? '+' : ''}{vs_chain?.toFixed(1) || '--'}
          </div>
          <p className="text-xs text-gray-500">vs Chain Avg</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Chain Average</p>
          <p className="text-2xl font-bold text-gray-400">
            {chain_avg_qm?.toFixed(1) || '--'}
          </p>
          <p className="text-xs text-gray-400">QM Stars</p>
        </div>
      </div>

      {/* Position bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Lowest in Chain</span>
          <span>Highest in Chain</span>
        </div>
        <div className="relative h-3 bg-gray-200 rounded-full">
          {/* Average marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: '50%' }}
          />

          {/* This facility marker */}
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow ${
              vs_chain_status === 'ABOVE_PEERS' ? 'bg-green-500' :
              vs_chain_status === 'BELOW_PEERS' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ left: `${chain_percentile || 50}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">0th percentile</span>
          {chain_percentile && (
            <span className={colors.text}>{chain_percentile}th percentile</span>
          )}
          <span className="text-gray-400">100th percentile</span>
        </div>
      </div>

      {/* Ranking info */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        {chain_rank && (
          <div>
            <span className="text-gray-500">Chain Rank:</span>
            <span className="ml-2 font-medium">{chain_rank}</span>
          </div>
        )}
        {best_in_chain && (
          <div>
            <span className="text-gray-500">Best in Chain:</span>
            <span className="ml-2 font-medium text-green-600">{best_in_chain}</span>
          </div>
        )}
      </div>

      {/* Insight */}
      {insight && (
        <div className={`p-2 rounded ${
          vs_chain_status === 'ABOVE_PEERS' ? 'bg-green-100' :
          vs_chain_status === 'BELOW_PEERS' ? 'bg-red-100' : 'bg-gray-100'
        }`}>
          <p className="text-sm">{insight}</p>
        </div>
      )}
    </div>
  );
};

export default ChainContext;
