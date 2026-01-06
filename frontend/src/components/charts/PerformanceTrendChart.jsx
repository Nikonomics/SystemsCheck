import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const TOTAL_POSSIBLE_SCORE = 700;

// Format month key (2024-07) to display format (Jul)
function formatMonth(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

// Format month key with year for tooltip (Jul 2024)
function formatMonthFull(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Performance Trend Chart Component
 * Shows monthly trends for multiple entities (companies or teams)
 *
 * @param {Object} props
 * @param {Array} props.entities - Array of { id, name, color, data: [{ month, avgScore, completionPct }] }
 * @param {string} props.title - Chart title
 * @param {string} props.defaultMetric - 'score' or 'completion'
 * @param {boolean} props.loading - Loading state
 * @param {string} props.emptyMessage - Message to show when no data
 */
export function PerformanceTrendChart({
  entities = [],
  title = 'Performance Trends',
  defaultMetric = 'score',
  loading = false,
  emptyMessage = 'No trend data available',
}) {
  const [metric, setMetric] = useState(defaultMetric);

  // Transform data for Recharts - needs flat array with month as key
  const chartData = useMemo(() => {
    if (!entities.length) return [];

    // Get all months from first entity (assumes all have same months)
    const months = entities[0]?.data?.map(d => d.month) || [];

    return months.map(month => {
      const point = { month };
      entities.forEach(entity => {
        const monthData = entity.data.find(d => d.month === month);
        if (monthData) {
          point[`${entity.id}_score`] = monthData.avgScore;
          point[`${entity.id}_completion`] = monthData.completionPct;
        }
      });
      return point;
    });
  }, [entities]);

  // Check if we have any data
  const hasData = entities.some(e => e.data?.some(d => d.avgScore !== null || d.completionPct > 0));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {/* Metric Toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setMetric('score')}
              className={`px-3 py-1 text-sm rounded-md transition ${
                metric === 'score'
                  ? 'bg-white shadow text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Avg Score
            </button>
            <button
              onClick={() => setMetric('completion')}
              className={`px-3 py-1 text-sm rounded-md transition ${
                metric === 'completion'
                  ? 'bg-white shadow text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Completion %
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatMonth}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={metric === 'score' ? [0, TOTAL_POSSIBLE_SCORE] : [0, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={metric === 'completion' ? (v) => `${v}%` : undefined}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border text-sm">
                        <p className="font-medium text-gray-900 mb-2">{formatMonthFull(label)}</p>
                        <div className="space-y-1">
                          {payload.map((p, i) => {
                            // Find entity name from dataKey
                            const entityId = p.dataKey.split('_')[0];
                            const entity = entities.find(e => String(e.id) === entityId);
                            return (
                              <div key={i} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: p.color }}
                                  />
                                  <span className="text-gray-700">{entity?.name || entityId}</span>
                                </div>
                                <span className="font-medium">
                                  {p.value !== null && p.value !== undefined
                                    ? metric === 'completion'
                                      ? `${p.value}%`
                                      : p.value
                                    : '—'
                                  }
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const entityId = value.split('_')[0];
                    const entity = entities.find(e => String(e.id) === entityId);
                    return <span className="text-xs">{entity?.name || entityId}</span>;
                  }}
                  iconType="line"
                  wrapperStyle={{ paddingTop: '10px' }}
                />
                {entities.map((entity) => (
                  <Line
                    key={entity.id}
                    type="monotone"
                    dataKey={`${entity.id}_${metric}`}
                    name={`${entity.id}_${metric}`}
                    stroke={entity.color}
                    strokeWidth={2}
                    dot={{ fill: entity.color, r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceTrendChart;
