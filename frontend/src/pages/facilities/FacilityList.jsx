import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { facilitiesApi } from '../../api/facilities';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const facilityTypeBadges = {
  SNF: { label: 'SNF', variant: 'primary' },
  ALF: { label: 'ALF', variant: 'success' },
  ILF: { label: 'ILF', variant: 'warning' },
};

const scorecardStatusBadges = {
  hard_close: { label: 'Completed', variant: 'success' },
  trial_close: { label: 'In Review', variant: 'warning' },
  draft: { label: 'In Progress', variant: 'primary' },
  none: { label: 'Not Started', variant: 'default' },
};

export function FacilityList() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [facilityType, setFacilityType] = useState('');

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    teams: [],
    facilityTypes: [],
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load filter options on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const data = await facilitiesApi.getFilters();
        setFilterOptions(data);
      } catch (err) {
        console.error('Error loading filters:', err);
      }
    };
    loadFilters();
  }, []);

  // Filter teams based on selected company
  const filteredTeams = useMemo(() => {
    if (!companyId) return filterOptions.teams;
    return filterOptions.teams.filter(t => t.companyId === parseInt(companyId));
  }, [companyId, filterOptions.teams]);

  // Reset team when company changes
  useEffect(() => {
    if (companyId && teamId) {
      const teamBelongsToCompany = filterOptions.teams.some(
        t => t.id === parseInt(teamId) && t.companyId === parseInt(companyId)
      );
      if (!teamBelongsToCompany) {
        setTeamId('');
      }
    }
  }, [companyId, teamId, filterOptions.teams]);

  // Load facilities
  useEffect(() => {
    const loadFacilities = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (companyId) params.company_id = companyId;
        if (teamId) params.team_id = teamId;
        if (facilityType) params.facility_type = facilityType;

        const data = await facilitiesApi.list(params);
        setFacilities(data.facilities);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load facilities');
      } finally {
        setLoading(false);
      }
    };
    loadFacilities();
  }, [debouncedSearch, companyId, teamId, facilityType, pagination.page, pagination.limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch, companyId, teamId, facilityType]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const getScorecardStatus = (facility) => {
    if (!facility.latestScorecard) return 'none';
    return facility.latestScorecard.status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facilities</h1>
        <p className="text-gray-500 mt-1">
          Manage and view scorecards for your facilities
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search facilities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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
                ...filteredTeams.map(t => ({ value: t.id.toString(), label: t.name })),
              ]}
            />

            {/* Facility type filter */}
            <Select
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                ...filterOptions.facilityTypes.map(t => ({ value: t, label: t })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Facilities grid */}
      {!loading && !error && (
        <>
          {facilities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No facilities found</h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map((facility) => {
                const status = getScorecardStatus(facility);
                const statusBadge = scorecardStatusBadges[status];
                const typeBadge = facilityTypeBadges[facility.facilityType];

                return (
                  <Link key={facility.id} to={`/facilities/${facility.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {facility.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {facility.team.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {facility.company.name}
                            </p>
                          </div>
                          <Badge variant={typeBadge.variant}>
                            {typeBadge.label}
                          </Badge>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.label}
                            </Badge>
                            {facility.latestScorecard && (
                              <span className="text-sm font-medium text-gray-900">
                                {facility.latestScorecard.totalScore || 0}/800
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
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
