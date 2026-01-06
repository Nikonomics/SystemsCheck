import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Key,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Building2,
  Users,
  MapPin,
  LogIn,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/users';
import { facilitiesApi } from '../../api/facilities';

const roleOptions = [
  { value: 'clinical_resource', label: 'Clinical Resource' },
  { value: 'facility_leader', label: 'Facility Leader' },
  { value: 'team_leader', label: 'Team Leader' },
  { value: 'company_leader', label: 'Company Leader' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'admin', label: 'Admin' },
];

const roleLabels = {
  clinical_resource: 'Clinical Resource',
  facility_leader: 'Facility Leader',
  team_leader: 'Team Leader',
  company_leader: 'Company Leader',
  corporate: 'Corporate',
  admin: 'Admin',
};

const roleBadgeVariants = {
  admin: 'destructive',
  corporate: 'primary',
  company_leader: 'warning',
  team_leader: 'success',
  facility_leader: 'secondary',
  clinical_resource: 'secondary',
};

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, totalCount: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', status: 'active' });
  const [facilities, setFacilities] = useState([]);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'clinical_resource',
    password: '',
    confirmPassword: '',
    facilityIds: [],
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [facilityViewMode, setFacilityViewMode] = useState('team'); // 'company', 'team', 'facility'

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const result = await usersApi.list({
          page: pagination.page,
          limit: pagination.limit,
          ...filters,
        });
        setUsers(result.users || []);
        setPagination(prev => ({
          ...prev,
          totalPages: result.pagination?.totalPages || 1,
          totalCount: result.pagination?.totalCount || 0,
        }));
      } catch (err) {
        console.error('Error loading users:', err);
        showError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [pagination.page, filters]);

  // Load facilities for assignment
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const result = await facilitiesApi.list({ limit: 500 });
        setFacilities(result.facilities || []);
      } catch (err) {
        console.error('Error loading facilities:', err);
      }
    };
    loadFacilities();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'clinical_resource',
      password: '',
      confirmPassword: '',
      facilityIds: [],
    });
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      password: '',
      confirmPassword: '',
      facilityIds: user.assignedFacilities?.map(f => f.id) || [],
    });
    setFormError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openResetPasswordModal = (user) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    setFormError('');
    setShowResetPasswordModal(true);
  };

  const handleCreate = async () => {
    setFormError('');

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setFormError('First name, last name, and email are required');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await usersApi.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        facilityIds: formData.facilityIds,
      });

      success('User created successfully');
      setShowCreateModal(false);

      // Reload users
      const result = await usersApi.list({ page: 1, limit: pagination.limit, ...filters });
      setUsers(result.users || []);
      setPagination(prev => ({ ...prev, page: 1, totalPages: result.pagination?.totalPages || 1, totalCount: result.pagination?.totalCount || 0 }));
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    setFormError('');

    if (!formData.firstName || !formData.lastName) {
      setFormError('First name and last name are required');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        facilityIds: formData.facilityIds,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await usersApi.update(selectedUser.id, updateData);

      success('User updated successfully');
      setShowEditModal(false);

      // Reload users
      const result = await usersApi.list({ page: pagination.page, limit: pagination.limit, ...filters });
      setUsers(result.users || []);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await usersApi.delete(selectedUser.id);
      success('User deactivated successfully');
      setShowDeleteModal(false);

      // Reload users
      const result = await usersApi.list({ page: pagination.page, limit: pagination.limit, ...filters });
      setUsers(result.users || []);
      setPagination(prev => ({ ...prev, totalCount: result.pagination?.totalCount || 0 }));
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setFormError('');

    if (!formData.password || formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await usersApi.resetPassword(selectedUser.id, formData.password);
      success('Password reset successfully');
      setShowResetPasswordModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImpersonate = async (user) => {
    if (!window.confirm(`Login as ${user.firstName} ${user.lastName} (${user.email})? You will be logged out of your current session.`)) {
      return;
    }

    try {
      const result = await usersApi.impersonate(user.id);
      // Store token and user in localStorage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      success(`Logged in as ${result.user.email}`);
      // Reload the page to refresh auth context
      window.location.href = '/dashboard';
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to login as user');
    }
  };

  const toggleFacility = (facilityId) => {
    setFormData(prev => ({
      ...prev,
      facilityIds: prev.facilityIds.includes(facilityId)
        ? prev.facilityIds.filter(id => id !== facilityId)
        : [...prev.facilityIds, facilityId],
    }));
  };

  // Group facilities by company
  const facilitiesByCompany = useMemo(() => {
    const grouped = {};
    facilities.forEach(facility => {
      const companyName = facility.company?.name || 'Unknown';
      const companyId = facility.company?.id || 0;
      if (!grouped[companyId]) {
        grouped[companyId] = { name: companyName, id: companyId, facilities: [] };
      }
      grouped[companyId].facilities.push(facility);
    });
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  }, [facilities]);

  // Group facilities by team (within company)
  const facilitiesByTeam = useMemo(() => {
    const grouped = {};
    facilities.forEach(facility => {
      const teamName = facility.team?.name || 'No Team';
      const teamId = facility.team?.id || 0;
      const companyName = facility.company?.name || 'Unknown';
      if (!grouped[teamId]) {
        grouped[teamId] = {
          name: teamName,
          id: teamId,
          companyName,
          facilities: []
        };
      }
      grouped[teamId].facilities.push(facility);
    });
    return Object.values(grouped).sort((a, b) => {
      const companyCompare = a.companyName.localeCompare(b.companyName);
      if (companyCompare !== 0) return companyCompare;
      return a.name.localeCompare(b.name);
    });
  }, [facilities]);

  // Toggle all facilities in a company
  const toggleCompany = (companyId) => {
    const company = facilitiesByCompany.find(c => c.id === companyId);
    if (!company) return;

    const companyFacilityIds = company.facilities.map(f => f.id);
    const allSelected = companyFacilityIds.every(id => formData.facilityIds.includes(id));

    setFormData(prev => ({
      ...prev,
      facilityIds: allSelected
        ? prev.facilityIds.filter(id => !companyFacilityIds.includes(id))
        : [...new Set([...prev.facilityIds, ...companyFacilityIds])],
    }));
  };

  // Toggle all facilities in a team
  const toggleTeam = (teamId) => {
    const team = facilitiesByTeam.find(t => t.id === teamId);
    if (!team) return;

    const teamFacilityIds = team.facilities.map(f => f.id);
    const allSelected = teamFacilityIds.every(id => formData.facilityIds.includes(id));

    setFormData(prev => ({
      ...prev,
      facilityIds: allSelected
        ? prev.facilityIds.filter(id => !teamFacilityIds.includes(id))
        : [...new Set([...prev.facilityIds, ...teamFacilityIds])],
    }));
  };

  // Check if all facilities in a company are selected
  const isCompanyFullySelected = (companyId) => {
    const company = facilitiesByCompany.find(c => c.id === companyId);
    if (!company) return false;
    return company.facilities.every(f => formData.facilityIds.includes(f.id));
  };

  // Check if some (but not all) facilities in a company are selected
  const isCompanyPartiallySelected = (companyId) => {
    const company = facilitiesByCompany.find(c => c.id === companyId);
    if (!company) return false;
    const selectedCount = company.facilities.filter(f => formData.facilityIds.includes(f.id)).length;
    return selectedCount > 0 && selectedCount < company.facilities.length;
  };

  // Check if all facilities in a team are selected
  const isTeamFullySelected = (teamId) => {
    const team = facilitiesByTeam.find(t => t.id === teamId);
    if (!team) return false;
    return team.facilities.every(f => formData.facilityIds.includes(f.id));
  };

  // Check if some (but not all) facilities in a team are selected
  const isTeamPartiallySelected = (teamId) => {
    const team = facilitiesByTeam.find(t => t.id === teamId);
    if (!team) return false;
    const selectedCount = team.facilities.filter(f => formData.facilityIds.includes(f.id)).length;
    return selectedCount > 0 && selectedCount < team.facilities.length;
  };

  // Get count of selected facilities in a company
  const getCompanySelectedCount = (companyId) => {
    const company = facilitiesByCompany.find(c => c.id === companyId);
    if (!company) return 0;
    return company.facilities.filter(f => formData.facilityIds.includes(f.id)).length;
  };

  // Get count of selected facilities in a team
  const getTeamSelectedCount = (teamId) => {
    const team = facilitiesByTeam.find(t => t.id === teamId);
    if (!team) return 0;
    return team.facilities.filter(f => formData.facilityIds.includes(f.id)).length;
  };

  const showFacilityAssignment = ['clinical_resource', 'team_leader'].includes(formData.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage system users and their access</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="w-40">
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="">All</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilities</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={roleBadgeVariants[user.role] || 'secondary'}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">
                      {user.assignedFacilities?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {user.id !== currentUser?.id && user.isActive && (
                          <Button variant="ghost" size="sm" onClick={() => handleImpersonate(user)} title="Login As" className="text-blue-600 hover:text-blue-700">
                            <LogIn className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(user)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openResetPasswordModal(user)} title="Reset Password">
                          <Key className="h-4 w-4" />
                        </Button>
                        {user.id !== currentUser?.id && user.isActive && (
                          <Button variant="ghost" size="sm" onClick={() => openDeleteModal(user)} title="Deactivate" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No users found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create User" size="lg">
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {showFacilityAssignment && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Assign Facilities ({formData.facilityIds.length} selected)
                </label>
                <div className="flex rounded-md border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFacilityViewMode('company')}
                    className={`px-2 py-1 text-xs flex items-center gap-1 ${
                      facilityViewMode === 'company'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="h-3 w-3" /> Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityViewMode('team')}
                    className={`px-2 py-1 text-xs flex items-center gap-1 border-l border-r border-gray-300 ${
                      facilityViewMode === 'team'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="h-3 w-3" /> Team
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityViewMode('facility')}
                    className={`px-2 py-1 text-xs flex items-center gap-1 ${
                      facilityViewMode === 'facility'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="h-3 w-3" /> Facility
                  </button>
                </div>
              </div>
              <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto p-2">
                {/* Company View */}
                {facilityViewMode === 'company' && facilitiesByCompany.map(company => (
                  <label key={company.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompanyFullySelected(company.id)}
                      ref={el => {
                        if (el) el.indeterminate = isCompanyPartiallySelected(company.id);
                      }}
                      onChange={() => toggleCompany(company.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{company.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {getCompanySelectedCount(company.id)}/{company.facilities.length} facilities
                    </span>
                  </label>
                ))}
                {/* Team View */}
                {facilityViewMode === 'team' && facilitiesByTeam.map(team => (
                  <label key={team.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTeamFullySelected(team.id)}
                      ref={el => {
                        if (el) el.indeterminate = isTeamPartiallySelected(team.id);
                      }}
                      onChange={() => toggleTeam(team.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{team.name}</span>
                    <span className="text-xs text-gray-400">{team.companyName}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {getTeamSelectedCount(team.id)}/{team.facilities.length}
                    </span>
                  </label>
                ))}
                {/* Facility View */}
                {facilityViewMode === 'facility' && facilities.map(facility => (
                  <label key={facility.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.facilityIds.includes(facility.id)}
                      onChange={() => toggleFacility(facility.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{facility.name}</span>
                    <span className="text-xs text-gray-400">{facility.team?.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} loading={submitting}>Create User</Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="lg">
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Leave blank to keep current"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          {showFacilityAssignment && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Assign Facilities ({formData.facilityIds.length} selected)
                </label>
                <div className="flex rounded-md border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFacilityViewMode('company')}
                    className={`px-2 py-1 text-xs flex items-center gap-1 ${
                      facilityViewMode === 'company'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="h-3 w-3" /> Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityViewMode('team')}
                    className={`px-2 py-1 text-xs flex items-center gap-1 border-l border-r border-gray-300 ${
                      facilityViewMode === 'team'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="h-3 w-3" /> Team
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacilityViewMode('facility')}
                    className={`px-2 py-1 text-xs flex items-center gap-1 ${
                      facilityViewMode === 'facility'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="h-3 w-3" /> Facility
                  </button>
                </div>
              </div>
              <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto p-2">
                {/* Company View */}
                {facilityViewMode === 'company' && facilitiesByCompany.map(company => (
                  <label key={company.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompanyFullySelected(company.id)}
                      ref={el => {
                        if (el) el.indeterminate = isCompanyPartiallySelected(company.id);
                      }}
                      onChange={() => toggleCompany(company.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{company.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {getCompanySelectedCount(company.id)}/{company.facilities.length} facilities
                    </span>
                  </label>
                ))}
                {/* Team View */}
                {facilityViewMode === 'team' && facilitiesByTeam.map(team => (
                  <label key={team.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTeamFullySelected(team.id)}
                      ref={el => {
                        if (el) el.indeterminate = isTeamPartiallySelected(team.id);
                      }}
                      onChange={() => toggleTeam(team.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{team.name}</span>
                    <span className="text-xs text-gray-400">{team.companyName}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {getTeamSelectedCount(team.id)}/{team.facilities.length}
                    </span>
                  </label>
                ))}
                {/* Facility View */}
                {facilityViewMode === 'facility' && facilities.map(facility => (
                  <label key={facility.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.facilityIds.includes(facility.id)}
                      onChange={() => toggleFacility(facility.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{facility.name}</span>
                    <span className="text-xs text-gray-400">{facility.team?.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleEdit} loading={submitting}>Save Changes</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Deactivate User" size="sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Are you sure you want to deactivate <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              They will no longer be able to log in, but their data will be preserved.
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} loading={submitting}>Deactivate</Button>
        </ModalFooter>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={showResetPasswordModal} onClose={() => setShowResetPasswordModal(false)} title="Reset Password" size="sm">
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {formError}
            </div>
          )}
          <p className="text-sm text-gray-600">
            Set a new password for <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleResetPassword} loading={submitting}>Reset Password</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
