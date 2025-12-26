import { useState, useEffect, useMemo } from 'react';
import {
  Star,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { getSurveySummary, getQualityMeasures } from '../../../api/cms';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

// Star rating colors
const STAR_COLORS = {
  5: '#10B981',
  4: '#84CC16',
  3: '#EAB308',
  2: '#F97316',
  1: '#EF4444',
};

export function BenchmarksTab({ ccn }) {
  const [summaryData, setSummaryData] = useState(null);
  const [qmData, setQmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ccn) {
      loadBenchmarkData();
    }
  }, [ccn]);

  const loadBenchmarkData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both survey summary and quality measures for comprehensive benchmarks
      const [summaryResult, qmResult] = await Promise.all([
        getSurveySummary(ccn),
        getQualityMeasures(ccn),
      ]);

      if (summaryResult.success) {
        setSummaryData(summaryResult.summary);
      }
      if (qmResult.success) {
        setQmData(qmResult);
      }

      if (!summaryResult.success && !qmResult.success) {
        setError('Failed to load benchmark data');
      }
    } catch (err) {
      console.error('Error loading benchmark data:', err);
      setError('Failed to load benchmark data');
    } finally {
      setLoading(false);
    }
  };

  // Build comparison table data
  const comparisonData = useMemo(() => {
    if (!summaryData && !qmData) return [];

    const rows = [];
    const ratings = summaryData?.ratings || {};
    const deficiencies = summaryData?.cycle1Deficiencies || {};
    const qmFacility = qmData?.facility || {};
    const qmState = qmData?.stateAverage || {};
    const qmNational = qmData?.nationalAverage || {};

    // Overall Rating
    if (ratings.overall) {
      rows.push({
        metric: 'Overall Rating',
        facility: ratings.overall,
        stateAvg: qmState.avgOverall,
        nationalAvg: qmNational.avgOverall || 3.0, // National avg is ~3
        type: 'rating',
        higherIsBetter: true,
      });
    }

    // Health Inspection Rating
    if (ratings.health) {
      rows.push({
        metric: 'Health Inspection Rating',
        facility: ratings.health,
        stateAvg: qmState.avgHealth,
        nationalAvg: qmNational.avgHealth || 3.0,
        type: 'rating',
        higherIsBetter: true,
      });
    }

    // QM Rating
    if (ratings.qm || qmFacility.qualityMeasureRating) {
      rows.push({
        metric: 'Quality Measures Rating',
        facility: ratings.qm || qmFacility.qualityMeasureRating,
        stateAvg: qmState.avgQmRating,
        nationalAvg: qmNational.avgQmRating,
        type: 'rating',
        higherIsBetter: true,
      });
    }

    // Staffing Rating
    if (ratings.staffing) {
      rows.push({
        metric: 'Staffing Rating',
        facility: ratings.staffing,
        stateAvg: qmState.avgStaffing,
        nationalAvg: qmNational.avgStaffing || 3.0,
        type: 'rating',
        higherIsBetter: true,
      });
    }

    // Cycle 1 Health Deficiencies
    if (deficiencies.health != null) {
      rows.push({
        metric: 'Cycle 1 Health Deficiencies',
        facility: deficiencies.health,
        stateAvg: null, // We don't have state averages for deficiencies in current API
        nationalAvg: 7.2, // National average is approximately 7.2
        type: 'count',
        higherIsBetter: false,
      });
    }

    // Cycle 1 Fire Safety Deficiencies
    if (deficiencies.fireSafety != null) {
      rows.push({
        metric: 'Cycle 1 Fire Safety Deficiencies',
        facility: deficiencies.fireSafety,
        stateAvg: null,
        nationalAvg: 2.5, // Approximate national average
        type: 'count',
        higherIsBetter: false,
      });
    }

    // Long-Stay QM Rating
    if (qmFacility.longStayQmRating) {
      rows.push({
        metric: 'Long-Stay QM Rating',
        facility: qmFacility.longStayQmRating,
        stateAvg: qmState.avgLongStayQm,
        nationalAvg: qmNational.avgLongStayQm,
        type: 'rating',
        higherIsBetter: true,
      });
    }

    // Short-Stay QM Rating
    if (qmFacility.shortStayQmRating) {
      rows.push({
        metric: 'Short-Stay QM Rating',
        facility: qmFacility.shortStayQmRating,
        stateAvg: qmState.avgShortStayQm,
        nationalAvg: qmNational.avgShortStayQm,
        type: 'rating',
        higherIsBetter: true,
      });
    }

    return rows;
  }, [summaryData, qmData]);

  // Build radar chart data
  const radarData = useMemo(() => {
    if (!summaryData?.ratings) return [];

    const ratings = summaryData.ratings;
    const qmNational = qmData?.nationalAverage || {};

    return [
      {
        metric: 'Overall',
        facility: parseInt(ratings.overall) || 0,
        national: qmNational.avgOverall ? parseFloat(qmNational.avgOverall) : 3,
      },
      {
        metric: 'Health',
        facility: parseInt(ratings.health) || 0,
        national: qmNational.avgHealth ? parseFloat(qmNational.avgHealth) : 3,
      },
      {
        metric: 'QM',
        facility: parseInt(ratings.qm) || 0,
        national: qmNational.avgQmRating ? parseFloat(qmNational.avgQmRating) : 3,
      },
      {
        metric: 'Staffing',
        facility: parseInt(ratings.staffing) || 0,
        national: qmNational.avgStaffing ? parseFloat(qmNational.avgStaffing) : 3,
      },
    ];
  }, [summaryData, qmData]);

  // Calculate percentile estimate
  const percentileEstimate = useMemo(() => {
    if (!summaryData?.ratings?.overall) return null;

    const rating = parseInt(summaryData.ratings.overall);
    // Rough percentile estimates based on CMS star distribution
    const percentiles = {
      5: 'Top 10%',
      4: 'Top 30%',
      3: 'Middle 40%',
      2: 'Bottom 30%',
      1: 'Bottom 10%',
    };

    return percentiles[rating] || null;
  }, [summaryData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summaryData && !qmData) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No benchmark data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Percentile Indicator */}
      {percentileEstimate && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-900">
                  This facility ranks in the <span className="text-blue-600">{percentileEstimate}</span> nationally
                </p>
                <p className="text-sm text-blue-700">
                  Based on Overall CMS Star Rating of {summaryData?.ratings?.overall} stars
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Comparison - Radar Chart */}
      {radarData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Comparison</h2>
          <Card>
            <CardContent className="py-4">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 5]}
                      tickCount={6}
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                    />
                    <Radar
                      name="Facility"
                      dataKey="facility"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="National Avg"
                      dataKey="national"
                      stroke="#9ca3af"
                      fill="#9ca3af"
                      fillOpacity={0.1}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toFixed(1) : value,
                        name,
                      ]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparison Table */}
      {comparisonData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Comparison</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State Avg
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      National Avg
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      vs National
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonData.map((row, index) => (
                    <ComparisonRow key={index} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* State Context */}
      {qmData?.stateAverage?.facilityCount && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Info className="h-5 w-5 text-gray-400" />
              <p className="text-sm">
                State comparisons are based on {qmData.stateAverage.facilityCount.toLocaleString()} facilities in {qmData.facility?.state || 'your state'}.
                National comparisons include {qmData.nationalAverage?.facilityCount?.toLocaleString() || '15,000+'} facilities.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interpretation Guide */}
      <InterpretationGuide />
    </div>
  );
}

function ComparisonRow({ row }) {
  const { metric, facility, stateAvg, nationalAvg, type, higherIsBetter } = row;

  const formatValue = (value, isRating) => {
    if (value == null) return '--';
    if (isRating) {
      const numVal = parseFloat(value);
      return (
        <div className="inline-flex items-center gap-1">
          <Star
            className="h-4 w-4"
            fill={STAR_COLORS[Math.round(numVal)] || '#9ca3af'}
            stroke={STAR_COLORS[Math.round(numVal)] || '#9ca3af'}
          />
          <span>{Number.isInteger(numVal) ? numVal : numVal.toFixed(1)}</span>
        </div>
      );
    }
    return typeof value === 'number' ? value.toLocaleString() : value;
  };

  const getDifference = () => {
    if (facility == null || nationalAvg == null) return null;

    const diff = parseFloat(facility) - parseFloat(nationalAvg);
    const isPositive = higherIsBetter ? diff > 0 : diff < 0;
    const isNeutral = Math.abs(diff) < 0.05;

    if (isNeutral) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Minus className="h-4 w-4" />
          Same
        </span>
      );
    }

    const displayDiff = type === 'rating'
      ? (diff > 0 ? '+' : '') + diff.toFixed(1)
      : (diff > 0 ? '+' : '') + diff.toFixed(0);

    if (isPositive) {
      return (
        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
          <TrendingUp className="h-4 w-4" />
          {displayDiff}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-red-600 font-medium">
        <TrendingDown className="h-4 w-4" />
        {displayDiff}
      </span>
    );
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {metric}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
        {formatValue(facility, type === 'rating')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
        {formatValue(stateAvg, type === 'rating')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
        {formatValue(nationalAvg, type === 'rating')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
        {getDifference()}
      </td>
    </tr>
  );
}

function InterpretationGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">Understanding These Benchmarks</span>
        </div>
        <span className="text-gray-400">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <CardContent className="pt-0 pb-4">
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Rating Metrics</h4>
                <p className="text-sm text-gray-600">
                  CMS star ratings range from 1 to 5 stars, with 5 being the best.
                  Higher ratings indicate better performance compared to other facilities.
                </p>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• <strong>Overall:</strong> Composite of all ratings</li>
                  <li>• <strong>Health:</strong> Based on inspection findings</li>
                  <li>• <strong>QM:</strong> Quality measure outcomes</li>
                  <li>• <strong>Staffing:</strong> Nurse staffing levels</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Deficiency Metrics</h4>
                <p className="text-sm text-gray-600">
                  Deficiency counts show citations from the most recent survey cycle.
                  Lower numbers are better, indicating fewer regulatory issues.
                </p>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• <strong>Health:</strong> Clinical care issues</li>
                  <li>• <strong>Fire Safety:</strong> Life safety code violations</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Comparison Colors</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="inline-flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" /> Better than average
                </span>
                <span className="inline-flex items-center gap-1 text-gray-500">
                  <Minus className="h-4 w-4" /> At average
                </span>
                <span className="inline-flex items-center gap-1 text-red-600">
                  <TrendingDown className="h-4 w-4" /> Below average
                </span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://www.medicare.gov/care-compare/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View on CMS Care Compare →
              </a>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default BenchmarksTab;
