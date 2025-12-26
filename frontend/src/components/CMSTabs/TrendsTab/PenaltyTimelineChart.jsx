import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign } from 'lucide-react';

const PenaltyTimelineChart = ({ data }) => {
  // Data is now an array of penalty events: [{date, amount}, ...]
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((event) => event.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((event) => ({
        date: new Date(event.date).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        amount: parseFloat(event.amount) || 0,
      }));
  }, [data]);

  // Check if there's any actual penalty data
  const hasAnyPenalties = chartData.length > 0 && chartData.some(d => d.amount > 0);

  if (!hasAnyPenalties) {
    return (
      <div className="trend-chart-card">
        <div className="chart-header">
          <DollarSign size={18} className="status-good" />
          <h4>Penalty History</h4>
        </div>
        <div className="chart-empty-state">
          <p style={{ color: '#22c55e', fontWeight: 500 }}>No penalties assessed</p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>This facility has no recorded CMS penalties</p>
        </div>
      </div>
    );
  }

  const formatDollar = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="trend-chart-card">
      <div className="chart-header">
        <DollarSign size={18} className="status-problem" />
        <h4>Penalty History</h4>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={formatDollar} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(value, name) => {
                if (name === 'amount') return [`$${value.toLocaleString()}`, 'Penalty Amount'];
                return [value, 'Fine Count'];
              }}
            />
            <Bar
              dataKey="amount"
              name="amount"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PenaltyTimelineChart;
