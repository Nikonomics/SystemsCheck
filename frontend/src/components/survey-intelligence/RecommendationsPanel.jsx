import React, { useState } from 'react';

/**
 * Prioritized list of recommendations with:
 * - Priority number
 * - Current vs target
 * - Impact statement
 * - Action details
 */
const RecommendationsPanel = ({ recommendations }) => {
  const [expandedIndex, setExpandedIndex] = useState(0);

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Recommendations</h3>
        <p className="text-gray-500 text-sm">No recommendations at this time. All metrics are within target ranges.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Prioritized Recommendations</h3>

      <div className="space-y-2">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`border rounded-lg overflow-hidden ${
              rec.priority === 1 ? 'border-red-200' :
              rec.priority === 2 ? 'border-orange-200' :
              rec.priority === 3 ? 'border-yellow-200' : 'border-gray-200'
            }`}
          >
            {/* Header - always visible */}
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                rec.priority === 1 ? 'bg-red-50 hover:bg-red-100' :
                rec.priority === 2 ? 'bg-orange-50 hover:bg-orange-100' :
                rec.priority === 3 ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Priority badge */}
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  rec.priority === 1 ? 'bg-red-500' :
                  rec.priority === 2 ? 'bg-orange-500' :
                  rec.priority === 3 ? 'bg-yellow-500' : 'bg-gray-500'
                }`}>
                  {rec.priority}
                </span>

                <div className="text-left">
                  <span className="font-medium text-gray-900">{rec.area}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-600">{rec.current}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600">{rec.target}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${
                  rec.priority === 1 ? 'text-red-700' :
                  rec.priority === 2 ? 'text-orange-700' :
                  rec.priority === 3 ? 'text-yellow-700' : 'text-gray-700'
                }`}>
                  {rec.impact}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {expandedIndex === index && (
              <div className="px-4 py-3 bg-white border-t">
                <div className="space-y-3">
                  {/* Action */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Action</h4>
                    <p className="text-sm text-gray-700">{rec.action}</p>
                  </div>

                  {/* Evidence */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Evidence</h4>
                    <p className="text-xs text-gray-500 italic">{rec.evidence}</p>
                  </div>

                  {/* Quick action buttons */}
                  <div className="flex gap-2 pt-2">
                    <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Create Task
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
