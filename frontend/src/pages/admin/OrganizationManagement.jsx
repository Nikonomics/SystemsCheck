import { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Home,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { organizationApi } from '../../api/organization';

const tabs = [
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'facilities', label: 'Facilities', icon: Home },
];

const facilityTypes = [
  { value: 'SNF', label: 'Skilled Nursing Facility' },
  { value: 'ALF', label: 'Assisted Living Facility' },
  { value: 'ILF', label: 'Independent Living Facility' },
];

export function OrganizationManagement() {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState('companies');

  // Data
  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [companyFilter, setCompanyFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [companiesRes, teamsRes, facilitiesRes] = await Promise.all([
          organizationApi.listCompanies(),
          organizationApi.listTeams(),
          organizationApi.listFacilities({ status: statusFilter }),
        ]);
        setCompanies(companiesRes.companies || []);
        setTeams(teamsRes.teams || []);
        setFacilities(facilitiesRes.facilities || []);
      } catch (err) {
        console.error('Error loading data:', err);
        showError('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [statusFilter]);

  // Filter teams by company
  const filteredTeams = useMemo(() => {
    if (!companyFilter) return teams;
    return teams.filter(t => t.company?.id === parseInt(companyFilter));
  }, [teams, companyFilter]);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    let result = facilities;
    if (companyFilter) {
      result = result.filter(f => f.team?.company?.id === parseInt(companyFilter));
    }
    if (teamFilter) {
      result = result.filter(f => f.team?.id === parseInt(teamFilter));
    }
    if (searchFilter) {
      result = result.filter(f => f.name.toLowerCase().includes(searchFilter.toLowerCase()));
    }
    return result;
  }, [facilities, companyFilter, teamFilter, searchFilter]);

  // Reset form
  const resetForm = () => {
    setFormData({});
    setFormError('');
  };

  // Open create modal
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedItem(null);
    resetForm();
    if (activeTab === 'teams') {
      setFormData({ companyId: companyFilter || '' });
    } else if (activeTab === 'facilities') {
      setFormData({ teamId: teamFilter || '', facilityType: 'SNF' });
    }
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormError('');
    if (activeTab === 'companies') {
      setFormData({ name: item.name });
    } else if (activeTab === 'teams') {
      setFormData({ name: item.name, companyId: item.company?.id?.toString() || '' });
    } else if (activeTab === 'facilities') {
      setFormData({
        name: item.name,
        facilityType: item.facilityType,
        teamId: item.team?.id?.toString() || '',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        zipCode: item.zipCode || '',
      });
    }
    setShowModal(true);
  };

  // Open delete modal
  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Handle save (create or edit)
  const handleSave = async () => {
    setFormError('');

    if (!formData.name?.trim()) {
      setFormError('Name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === 'companies') {
        if (modalMode === 'create') {
          await organizationApi.createCompany({ name: formData.name });
        } else {
          await organizationApi.updateCompany(selectedItem.id, { name: formData.name });
        }
        const res = await organizationApi.listCompanies();
        setCompanies(res.companies || []);
      } else if (activeTab === 'teams') {
        if (!formData.companyId) {
          setFormError('Company is required');
          setSubmitting(false);
          return;
        }
        if (modalMode === 'create') {
          await organizationApi.createTeam({
            name: formData.name,
            companyId: parseInt(formData.companyId),
          });
        } else {
          await organizationApi.updateTeam(selectedItem.id, {
            name: formData.name,
            companyId: parseInt(formData.companyId),
          });
        }
        const res = await organizationApi.listTeams();
        setTeams(res.teams || []);
      } else if (activeTab === 'facilities') {
        if (!formData.teamId) {
          setFormError('Team is required');
          setSubmitting(false);
          return;
        }
        const data = {
          name: formData.name,
          facilityType: formData.facilityType || 'SNF',
          teamId: parseInt(formData.teamId),
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zipCode: formData.zipCode || null,
        };
        if (modalMode === 'create') {
          await organizationApi.createFacility(data);
        } else {
          await organizationApi.updateFacility(selectedItem.id, data);
        }
        const res = await organizationApi.listFacilities({ status: statusFilter });
        setFacilities(res.facilities || []);
      }

      success(modalMode === 'create' ? 'Created successfully' : 'Updated successfully');
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setSubmitting(true);
    try {
      if (activeTab === 'companies') {
        await organizationApi.deleteCompany(selectedItem.id);
        const res = await organizationApi.listCompanies();
        setCompanies(res.companies || []);
      } else if (activeTab === 'teams') {
        await organizationApi.deleteTeam(selectedItem.id);
        const res = await organizationApi.listTeams();
        setTeams(res.teams || []);
      } else if (activeTab === 'facilities') {
        await organizationApi.deleteFacility(selectedItem.id);
        const res = await organizationApi.listFacilities({ status: statusFilter });
        setFacilities(res.facilities || []);
      }

      success('Deleted successfully');
      setShowDeleteModal(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  // Get modal title
  const getModalTitle = () => {
    const action = modalMode === 'create' ? 'Add' : 'Edit';
    const entity = activeTab === 'companies' ? 'Company' : activeTab === 'teams' ? 'Team' : 'Facility';
    return `${action} ${entity}`;
  };

  // Get delete message
  const getDeleteMessage = () => {
    if (activeTab === 'companies') {
      return 'This company will be permanently deleted. Make sure all teams are removed first.';
    } else if (activeTab === 'teams') {
      return 'This team will be permanently deleted. Make sure all facilities are removed first.';
    }
    return 'This facility will be deactivated and hidden from normal views.';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
          <p className="text-sm text-gray-500">Manage companies, teams, and facilities</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" /> Add {activeTab === 'companies' ? 'Company' : activeTab === 'teams' ? 'Team' : 'Facility'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCompanyFilter('');
                setTeamFilter('');
                setSearchFilter('');
              }}
              className={`
                flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters for Teams and Facilities */}
      {(activeTab === 'teams' || activeTab === 'facilities') && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  value={companyFilter}
                  onChange={(e) => {
                    setCompanyFilter(e.target.value);
                    setTeamFilter('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Companies</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {activeTab === 'facilities' && (
                <>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Teams</option>
                      {filteredTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="">All</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search facilities..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Teams</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilities</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companies.map(company => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{company.name}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{company.teamCount}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{company.facilityCount}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(company)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(company)}
                              className="text-red-600 hover:text-red-700"
                              disabled={company.teamCount > 0}
                              title={company.teamCount > 0 ? 'Remove teams first' : 'Delete'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {companies.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No companies found.</div>
                )}
              </div>
            </Card>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facilities</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTeams.map(team => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{team.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{team.company?.name}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{team.facilityCount}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(team)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(team)}
                              className="text-red-600 hover:text-red-700"
                              disabled={team.facilityCount > 0}
                              title={team.facilityCount > 0 ? 'Remove facilities first' : 'Delete'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTeams.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No teams found.</div>
                )}
              </div>
            </Card>
          )}

          {/* Facilities Tab */}
          {activeTab === 'facilities' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility Name</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredFacilities.map(facility => (
                      <tr key={facility.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{facility.name}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary">{facility.facilityType}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <div>{facility.team?.name}</div>
                          <div className="text-xs text-gray-400">{facility.team?.company?.name}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {facility.city && facility.state ? `${facility.city}, ${facility.state}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {facility.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(facility)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {facility.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(facility)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredFacilities.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No facilities found.</div>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={getModalTitle()} size="md">
        <div className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {activeTab === 'teams' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <select
                value={formData.companyId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'facilities' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.facilityType || 'SNF'}
                    onChange={(e) => setFormData(prev => ({ ...prev, facilityType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {facilityTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team *</label>
                  <select
                    value={formData.teamId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, teamId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.company?.name})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={formData.zipCode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={submitting}>
            {modalMode === 'create' ? 'Create' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Confirmation" size="sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete <strong>{selectedItem?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {getDeleteMessage()}
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} loading={submitting}>Delete</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
