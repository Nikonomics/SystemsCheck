import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { reportsApi } from '../../api/reports';
import { facilitiesApi } from '../../api/facilities';

const dateRangeOptions = [
  { value: '3', label: 'Last 3 Months' },
  { value: '6', label: 'Last 6 Months' },
  { value: '12', label: 'Last 12 Months' },
];

const lineColors = [
  '#0284c7', '#dc2626', '#16a34a', '#9333ea', '#ea580c',
  '#0891b2', '#be185d', '#65a30d', '#7c3aed', '#c2410c',
];

function getScoreClass(score) {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

export function FacilityComparison() {
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('6');
  const [showFilters, setShowFilters] = useState(true);

  // Facility selection
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ companies: [], teams: [] });
  const [facilityFilters, setFacilityFilters] = useState({
    company_id: '',
    team_id: '',
    search: '',
  });
  const [loadingFacilities, setLoadingFacilities] = useState(true);

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const options = await facilitiesApi.getFilters();
        setFilterOptions(options);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFilters();
  }, []);

  // Load facilities for selection
  useEffect(() => {
    const loadFacilities = async () => {
      setLoadingFacilities(true);
      try {
        const result = await facilitiesApi.list({
          ...facilityFilters,
          limit: 100,
        });
        setFacilities(result.facilities || []);
      } catch (err) {
        console.error('Error loading facilities:', err);
      } finally {
        setLoadingFacilities(false);
      }
    };
    loadFacilities();
  }, [facilityFilters]);

  // Load comparison data when facilities are selected
  useEffect(() => {
    if (selectedFacilityIds.length < 2) {
      setComparisonData(null);
      return;
    }

    const loadComparison = async () => {
      setLoading(true);
      try {
        const result = await reportsApi.compareFacilities({
          facility_ids: selectedFacilityIds.join(','),
          date_range: dateRange,
        });
        setComparisonData(result);
      } catch (err) {
        console.error('Error loading comparison:', err);
        setError(err.response?.data?.message || 'Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };
    loadComparison();
  }, [selectedFacilityIds, dateRange]);

  // Toggle facility selection
  const toggleFacility = (facilityId) => {
    setSelectedFacilityIds(prev => {
      if (prev.includes(facilityId)) {
        return prev.filter(id => id !== facilityId);
      }
      if (prev.length >= 5) {
        // Max 5 facilities
        return prev;
      }
      return [...prev, facilityId];
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFacilityIds([]);
    setComparisonData(null);
  };

  // Get filtered teams based on company selection
  const filteredTeams = useMemo(() => {
    if (!facilityFilters.company_id) return filterOptions.teams || [];
    return (filterOptions.teams || []).filter(
      t => t.companyId === parseInt(facilityFilters.company_id)
    );
  }, [filterOptions.teams, facilityFilters.company_id]);

  // Prepare trend chart data (combine all facilities)
  const trendChartData = useMemo(() => {
    if (!comparisonData?.facilities) return [];

    // Get all unique months
    const allMonths = new Set();
    comparisonData.facilities.forEach(f => {
      f.trendData?.forEach(d => allMonths.add(d.month));
    });

    // Create data points for each month
    return Array.from(allMonths).map(month => {
      const point = { month };
      comparisonData.facilities.forEach(f => {
        const dataPoint = f.trendData?.find(d => d.month === month);
        point[f.name] = dataPoint?.score || null;
      });
      return point;
    });
  }, [comparisonData]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!comparisonData?.facilities) return [];

    // Get system breakdown for first facility as template
    const systems = comparisonData.facilities[0]?.systemBreakdown || [];

    return systems.map(sys => {
      const point = {
        system: `S${sys.systemNumber}`,
        fullName: sys.systemName,
      };
      comparisonData.facilities.forEach(f => {
        const sysData = f.systemBreakdown?.find(s => s.systemNumber === sys.systemNumber);
        point[f.name] = sysData?.avgScore || 0;
      });
      return point;
    });
  }, [comparisonData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Facility Comparison</h1>
            <p className="text-sm text-gray-500">
              Select 2-5 facilities to compare side by side
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedFacilityIds.length > 0 && (
            <Button variant="secondary" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" /> Clear ({selectedFacilityIds.length})
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" /> Filters
            {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>

      {/* Filters & Facility Selection */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  value={facilityFilters.company_id}
                  onChange={(e) => setFacilityFilters(prev => ({
                    ...prev,
                    company_id: e.target.value,
                    team_id: '',
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Companies</option>
                  {filterOptions.companies?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={facilityFilters.team_id}
                  onChange={(e) => setFacilityFilters(prev => ({ ...prev, team_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Teams</option>
                  {filteredTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {dateRangeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  value={facilityFilters.search}
                  onChange={(e) => setFacilityFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search facilities..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Facility checkboxes */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">
                Select facilities to compare (max 5):
              </p>
              {loadingFacilities ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {facilities.map(facility => {
                    const isSelected = selectedFacilityIds.includes(facility.id);
                    const isDisabled = !isSelected && selectedFacilityIds.length >= 5;

                    return (
                      <button
                        key={facility.id}
                        onClick={() => toggleFacility(facility.id)}
                        disabled={isDisabled}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm
                          ${isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : isDisabled
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className={`
                          w-4 h-4 rounded border flex items-center justify-center
                          ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}
                        `}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="truncate">{facility.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No selection message */}
      {selectedFacilityIds.length < 2 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              Select at least 2 facilities to see comparison data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData && !loading && (
        <>
          {/* Overall Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {comparisonData.facilities?.map((facility, index) => (
                  <div
                    key={facility.id}
                    className="p-4 rounded-lg border"
                    style={{ borderColor: lineColors[index] }}
                  >
                    <div
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: lineColors[index] }}
                    />
                    <h3 className="font-medium text-gray-900 truncate">{facility.name}</h3>
                    <p className="text-xs text-gray-500">{facility.team}</p>
                    <p className={`text-2xl font-bold mt-2 ${getScoreClass((facility.avgScore / 700) * 100)}`}>
                      {facility.avgScore || '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {facility.scorecardCount} scorecards
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trend Lines */}
          {trendChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Score Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 700]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {comparisonData.facilities?.map((facility, index) => (
                        <Line
                          key={facility.id}
                          type="monotone"
                          dataKey={facility.name}
                          stroke={lineColors[index]}
                          strokeWidth={2}
                          dot={{ fill: lineColors[index], r: 3 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Radar Chart - System Breakdown */}
          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>System-by-System Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="system" tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      {comparisonData.facilities?.map((facility, index) => (
                        <Radar
                          key={facility.id}
                          name={facility.name}
                          dataKey={facility.name}
                          stroke={lineColors[index]}
                          fill={lineColors[index]}
                          fillOpacity={0.1}
                        />
                      ))}
                      <Legend />
                      <Tooltip
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
                              <p className="font-medium">{data.fullName}</p>
                              {payload.map((p, i) => (
                                <p key={i} className="text-sm" style={{ color: p.color }}>
                                  {p.name}: {p.value?.toFixed(1) || '—'}
                                </p>
                              ))}
                            </div>
                          );
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Scores Breakdown</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
                    {comparisonData.facilities?.map((facility, index) => (
                      <th
                        key={facility.id}
                        className="px-4 py-3 text-center text-xs font-medium uppercase"
                        style={{ color: lineColors[index] }}
                      >
                        {facility.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisonData.facilities?.[0]?.systemBreakdown?.map(sys => (
                    <tr key={sys.systemNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="font-medium">S{sys.systemNumber}:</span> {sys.systemName}
                      </td>
                      {comparisonData.facilities?.map(facility => {
                        const sysData = facility.systemBreakdown?.find(s => s.systemNumber === sys.systemNumber);
                        const score = sysData?.avgScore;
                        return (
                          <td key={facility.id} className="px-4 py-3 text-center">
                            <span className={`font-medium ${getScoreClass(score || 0)}`}>
                              {score?.toFixed(1) || '—'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
