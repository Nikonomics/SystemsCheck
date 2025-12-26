import { useState, useEffect } from 'react';
import {
  Activity,
  ClipboardCheck,
  Flame,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { facilitiesApi } from '../../api/facilities';
import { OverviewTab } from './components/OverviewTab';
import { HealthSurveysTab } from './components/HealthSurveysTab';
import { FireSafetyTab } from './components/FireSafetyTab';
import { DeficienciesTab } from './components/DeficienciesTab';
import { QualityMeasuresTab } from './components/QualityMeasuresTab';
import { BenchmarksTab } from './components/BenchmarksTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'health-surveys', label: 'Health Surveys', icon: ClipboardCheck },
  { id: 'fire-safety', label: 'Fire Safety', icon: Flame },
  { id: 'deficiencies', label: 'Deficiencies', icon: AlertTriangle },
  { id: 'quality-measures', label: 'Quality Measures', icon: TrendingUp },
  { id: 'benchmarks', label: 'Benchmarks', icon: BarChart3 },
];

export function SurveyAnalytics() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load facilities on mount
  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await facilitiesApi.list({ limit: 1000 });
      // Filter to only SNF facilities (they have CCN potential)
      const snfFacilities = (data.facilities || []).filter(
        f => f.facilityType === 'SNF' || f.ccn
      );
      setFacilities(snfFacilities);

      // Auto-select first facility with CCN if available
      const firstWithCcn = snfFacilities.find(f => f.ccn);
      if (firstWithCcn) {
        setSelectedFacility(firstWithCcn);
      } else if (snfFacilities.length > 0) {
        setSelectedFacility(snfFacilities[0]);
      }
    } catch (err) {
      console.error('Error loading facilities:', err);
      setError('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityChange = (e) => {
    const facilityId = parseInt(e.target.value);
    const facility = facilities.find(f => f.id === facilityId);
    setSelectedFacility(facility);
  };

  const renderTabContent = () => {
    if (!selectedFacility) {
      return (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select a facility to view survey analytics</p>
        </div>
      );
    }

    if (!selectedFacility.ccn) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No CMS Data Available</h3>
          <p className="text-gray-500">
            CCN (CMS Certification Number) is not configured for this facility.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Contact an administrator to link this facility to CMS data.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab ccn={selectedFacility.ccn} facilityName={selectedFacility.name} />;
      case 'health-surveys':
        return <HealthSurveysTab ccn={selectedFacility.ccn} />;
      case 'fire-safety':
        return <FireSafetyTab ccn={selectedFacility.ccn} />;
      case 'deficiencies':
        return <DeficienciesTab ccn={selectedFacility.ccn} />;
      case 'quality-measures':
        return <QualityMeasuresTab ccn={selectedFacility.ccn} />;
      case 'benchmarks':
        return <BenchmarksTab ccn={selectedFacility.ccn} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Analytics</h1>
          <p className="text-gray-500 mt-1">CMS survey data and regulatory intelligence</p>
        </div>

        {/* Facility Selector */}
        <div className="w-full sm:w-80">
          <label htmlFor="facility-select" className="sr-only">
            Select Facility
          </label>
          <select
            id="facility-select"
            value={selectedFacility?.id || ''}
            onChange={handleFacilityChange}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">Select a facility...</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} {facility.ccn ? `(${facility.ccn})` : '(No CCN)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default SurveyAnalytics;
