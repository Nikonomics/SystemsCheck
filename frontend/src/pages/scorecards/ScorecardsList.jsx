import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { scorecardsApi } from '../../api/scorecards';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const statusBadges = {
  draft: { label: 'Draft', variant: 'warning' },
  trial_close: { label: 'Trial Close', variant: 'primary' },
  hard_close: { label: 'Hard Close', variant: 'success' },
};

const formatTimeAgo = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return then.toLocaleDateString();
};

export function ScorecardsList() {
  const navigate = useNavigate();
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [facilityId, setFacilityId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    facilities: [],
    teams: [],
    companies: [],
    statuses: ['draft', 'trial_close', 'hard_close'],
  });

  // Sorting
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Generate year options (current year and past 2 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: '', label: 'All Years' },
      { value: currentYear.toString(), label: currentYear.toString() },
      { value: (currentYear - 1).toString(), label: (currentYear - 1).toString() },
      { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() },
    ];
  }, []);

  // Load scorecards
  useEffect(() => {
    const loadScorecards = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
        };
        if (facilityId) params.facility_id = facilityId;
        if (teamId) params.team_id = teamId;
        if (companyId) params.company_id = companyId;
        if (status) params.status = status;
        if (year) params.year = year;

        const data = await scorecardsApi.list(params);
        setScorecards(data.scorecards);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
        setFilterOptions(prev => ({
          ...prev,
          facilities: data.filters.facilities,
          teams: data.filters.teams || [],
          companies: data.filters.companies || [],
        }));
      } catch (err) {
        console.error('Error loading scorecards:', err);
        setError(err.response?.data?.message || 'Failed to load scorecards');
      } finally {
        setLoading(false);
      }
    };
    loadScorecards();
  }, [facilityId, teamId, companyId, status, year, pagination.page, pagination.limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [facilityId, teamId, companyId, status, year]);

  // Sort scorecards client-side
  const sortedScorecards = useMemo(() => {
    const sorted = [...scorecards].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'facility':
          aVal = a.facility?.name || '';
          bVal = b.facility?.name || '';
          break;
        case 'team':
          aVal = a.facility?.team?.name || '';
          bVal = b.facility?.team?.name || '';
          break;
        case 'company':
          aVal = a.facility?.team?.company?.name || '';
          bVal = b.facility?.team?.company?.name || '';
          break;
        case 'date':
          aVal = new Date(a.year, a.month - 1);
          bVal = new Date(b.year, b.month - 1);
          break;
        case 'status':
          const statusOrder = { draft: 0, trial_close: 1, hard_close: 2 };
          aVal = statusOrder[a.status];
          bVal = statusOrder[b.status];
          break;
        case 'score':
          aVal = a.totalScore;
          bVal = b.totalScore;
          break;
        case 'updatedBy':
          aVal = a.updatedBy ? `${a.updatedBy.firstName} ${a.updatedBy.lastName}` : '';
          bVal = b.updatedBy ? `${b.updatedBy.firstName} ${b.updatedBy.lastName}` : '';
          break;
        case 'updatedAt':
        default:
          aVal = new Date(a.updatedAt);
          bVal = new Date(b.updatedAt);
          break;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [scorecards, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4 inline ml-1" />
      : <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scorecards</h1>
          <p className="text-gray-500 mt-1">
            View and manage clinical audit scorecards
          </p>
        </div>
        <Button onClick={() => navigate('/facilities')}>
          <Plus className="h-4 w-4 mr-2" />
          New Scorecard
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Company filter */}
            <Select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              options={[
                { value: '', label: 'All Companies' },
                ...filterOptions.companies.map(c => ({ value: c.id.toString(), label: c.name })),
              ]}
            />

            {/* Team filter */}
            <Select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              options={[
                { value: '', label: 'All Teams' },
                ...filterOptions.teams.map(t => ({ value: t.id.toString(), label: t.name })),
              ]}
            />

            {/* Facility filter */}
            <Select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              options={[
                { value: '', label: 'All Facilities' },
                ...filterOptions.facilities.map(f => ({ value: f.id.toString(), label: f.name })),
              ]}
            />

            {/* Status filter */}
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'trial_close', label: 'Trial Close' },
                { value: 'hard_close', label: 'Hard Close' },
              ]}
            />

            {/* Year filter */}
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              options={yearOptions}
            />

            {/* Results count */}
            <div className="flex items-center text-sm text-gray-500">
              {!loading && (
                <span>{pagination.total} scorecard{pagination.total !== 1 ? 's' : ''} found</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Scorecards table */}
      {!loading && !error && (
        <>
          {sortedScorecards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No scorecards found</h3>
                <p className="mt-2 text-gray-500">
                  {facilityId || status || year
                    ? 'Try adjusting your filters.'
                    : 'Get started by creating a new scorecard.'}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate('/facilities')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Scorecard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('facility')}
                      >
                        Facility
                        <SortIcon field="facility" />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('team')}
                      >
                        Team
                        <SortIcon field="team" />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('company')}
                      >
                        Company
                        <SortIcon field="company" />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('date')}
                      >
                        Month / Year
                        <SortIcon field="date" />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        <SortIcon field="status" />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('score')}
                      >
                        Score
                        <SortIcon field="score" />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedAt')}
                      >
                        Last Updated
                        <SortIcon field="updatedAt" />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedBy')}
                      >
                        Updated By
                        <SortIcon field="updatedBy" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedScorecards.map((scorecard) => {
                      const statusBadge = statusBadges[scorecard.status];
                      return (
                        <tr
                          key={scorecard.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/scorecards/${scorecard.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {scorecard.facility?.name || 'Unknown Facility'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {scorecard.facility?.team?.name || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {scorecard.facility?.team?.company?.name || '—'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {monthNames[scorecard.month - 1]} {scorecard.year}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${getScoreColor(scorecard.percentage)}`}>
                                {scorecard.totalScore.toFixed(0)}
                              </span>
                              <span className="text-sm text-gray-400 ml-1">
                                / {scorecard.totalPossible}
                              </span>
                              <span className={`text-xs ml-2 ${getScoreColor(scorecard.percentage)}`}>
                                ({scorecard.percentage}%)
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(scorecard.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {scorecard.updatedBy
                              ? `${scorecard.updatedBy.firstName} ${scorecard.updatedBy.lastName}`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
