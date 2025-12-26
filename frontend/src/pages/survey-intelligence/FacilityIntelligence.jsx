/**
 * FacilityIntelligence Component
 *
 * Main page for Survey Intelligence - Facility View
 * Shows risk score, trends, and actionable recommendations
 * based on CMS survey data analysis.
 */

import { useState, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  Brain,
  RefreshCw
} from 'lucide-react';
import { facilitiesApi } from '../../api/facilities';
import surveyIntelApi from '../../api/surveyIntel';
import { RiskScoreCard } from './components/RiskScoreCard';
import { TrendsSummary } from './components/TrendsSummary';
import { TagsHeatmap } from './components/TagsHeatmap';
import { Recommendations } from './components/Recommendations';
import { ClinicalSystemsBreakdown } from './components/ClinicalSystemsBreakdown';
import { MarketContext } from './components/MarketContext';
import { SurveyTypeBreakdown } from './components/SurveyTypeBreakdown';
import { SurveyTimeline } from './components/SurveyTimeline';
import { TagClickProvider } from './components/TagClickContext';

export function FacilityIntelligence() {
  // State
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [error, setError] = useState(null);

  // Data state
  const [riskData, setRiskData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [systemRiskData, setSystemRiskData] = useState(null);
  const [marketContextData, setMarketContextData] = useState(null);
  const [surveyTypeData, setSurveyTypeData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [loadingSystemRisk, setLoadingSystemRisk] = useState(false);
  const [loadingMarketContext, setLoadingMarketContext] = useState(false);
  const [loadingSurveyType, setLoadingSurveyType] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [riskError, setRiskError] = useState(null);
  const [trendsError, setTrendsError] = useState(null);
  const [heatmapError, setHeatmapError] = useState(null);
  const [systemRiskError, setSystemRiskError] = useState(null);
  const [marketContextError, setMarketContextError] = useState(null);
  const [surveyTypeError, setSurveyTypeError] = useState(null);
  const [timelineError, setTimelineError] = useState(null);

  // Load facilities on mount
  useEffect(() => {
    loadFacilities();
  }, []);

  // Load intelligence data when facility changes
  useEffect(() => {
    if (selectedFacility?.id) {
      loadIntelligenceData(selectedFacility.id);
    } else {
      setRiskData(null);
      setTrendsData(null);
      setHeatmapData(null);
      setSystemRiskData(null);
      setMarketContextData(null);
      setSurveyTypeData(null);
      setTimelineData(null);
    }
  }, [selectedFacility?.id]);

  const loadFacilities = async () => {
    try {
      setLoadingFacilities(true);
      setError(null);
      const data = await facilitiesApi.list({ limit: 1000 });

      // Filter to only SNF facilities with CCN
      const snfFacilities = (data.facilities || []).filter(
        f => f.facilityType === 'SNF' || f.ccn
      );
      setFacilities(snfFacilities);

      // Auto-select first facility with CCN
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
      setLoadingFacilities(false);
    }
  };

  const loadIntelligenceData = async (facilityId) => {
    // Load risk score
    setLoadingRisk(true);
    setRiskError(null);
    try {
      const risk = await surveyIntelApi.getRiskScore(facilityId);
      setRiskData(risk);
    } catch (err) {
      console.error('Error loading risk score:', err);
      setRiskError(err.response?.data?.error || 'Failed to load risk score');
    } finally {
      setLoadingRisk(false);
    }

    // Load trends
    setLoadingTrends(true);
    setTrendsError(null);
    try {
      const trends = await surveyIntelApi.getTrends(facilityId);
      setTrendsData(trends);
    } catch (err) {
      console.error('Error loading trends:', err);
      setTrendsError(err.response?.data?.error || 'Failed to load trends');
    } finally {
      setLoadingTrends(false);
    }

    // Load heatmap
    setLoadingHeatmap(true);
    setHeatmapError(null);
    try {
      const heatmap = await surveyIntelApi.getHeatmap(facilityId);
      setHeatmapData(heatmap);
    } catch (err) {
      console.error('Error loading heatmap:', err);
      setHeatmapError(err.response?.data?.error || 'Failed to load heatmap');
    } finally {
      setLoadingHeatmap(false);
    }

    // Load survey type breakdown
    setLoadingSurveyType(true);
    setSurveyTypeError(null);
    try {
      const surveyType = await surveyIntelApi.getSurveyTypeBreakdown(facilityId);
      setSurveyTypeData(surveyType);
    } catch (err) {
      console.error('Error loading survey type breakdown:', err);
      setSurveyTypeError(err.response?.data?.error || 'Failed to load survey type breakdown');
    } finally {
      setLoadingSurveyType(false);
    }

    // Load timeline
    setLoadingTimeline(true);
    setTimelineError(null);
    try {
      const timeline = await surveyIntelApi.getTimeline(facilityId);
      setTimelineData(timeline);
    } catch (err) {
      console.error('Error loading timeline:', err);
      setTimelineError(err.response?.data?.error || 'Failed to load timeline');
    } finally {
      setLoadingTimeline(false);
    }

    // Load system risk
    setLoadingSystemRisk(true);
    setSystemRiskError(null);
    try {
      const systemRisk = await surveyIntelApi.getSystemRisk(facilityId);
      setSystemRiskData(systemRisk);
    } catch (err) {
      console.error('Error loading system risk:', err);
      setSystemRiskError(err.response?.data?.error || 'Failed to load system risk');
    } finally {
      setLoadingSystemRisk(false);
    }

    // Load market context
    setLoadingMarketContext(true);
    setMarketContextError(null);
    try {
      const marketContext = await surveyIntelApi.getMarketContext(facilityId);
      setMarketContextData(marketContext);
    } catch (err) {
      console.error('Error loading market context:', err);
      setMarketContextError(err.response?.data?.error || 'Failed to load market context');
    } finally {
      setLoadingMarketContext(false);
    }
  };

  const handleFacilityChange = (e) => {
    const facilityId = parseInt(e.target.value);
    const facility = facilities.find(f => f.id === facilityId);
    setSelectedFacility(facility);
  };

  const handleRefresh = () => {
    if (selectedFacility?.id) {
      loadIntelligenceData(selectedFacility.id);
    }
  };

  // Loading state
  if (loadingFacilities) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
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
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Survey Intelligence</h1>
          </div>
          <p className="text-gray-500 mt-1">
            Predictive risk insights based on CMS survey data
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={!selectedFacility || loadingRisk || loadingTrends || loadingHeatmap || loadingSystemRisk || loadingMarketContext || loadingSurveyType || loadingTimeline}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${(loadingRisk || loadingTrends || loadingHeatmap || loadingSystemRisk || loadingMarketContext || loadingSurveyType || loadingTimeline) ? 'animate-spin' : ''}`} />
          </button>

          {/* Facility Selector */}
          <div className="w-full sm:w-80">
            <label htmlFor="facility-select" className="sr-only">
              Select Facility
            </label>
            <select
              id="facility-select"
              value={selectedFacility?.id || ''}
              onChange={handleFacilityChange}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
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
      </div>

      {/* No Facility Selected */}
      {!selectedFacility && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select a facility to view survey intelligence</p>
        </div>
      )}

      {/* No CCN Warning */}
      {selectedFacility && !selectedFacility.ccn && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No CMS Data Available</h3>
          <p className="text-gray-500">
            CCN (CMS Certification Number) is not configured for this facility.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Contact an administrator to link this facility to CMS data.
          </p>
        </div>
      )}

      {/* Main Content */}
      {selectedFacility && selectedFacility.ccn && (
        <TagClickProvider
          facilityId={selectedFacility.id}
          state={selectedFacility.state}
        >
          <div className="space-y-6">
            {/* Facility Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedFacility.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedFacility.city}, {selectedFacility.state} • CCN: {selectedFacility.ccn}
                  </p>
                </div>
                {riskData?.hasData && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Risk Level</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      riskData.riskScore.level === 'low' ? 'bg-green-100 text-green-800' :
                      riskData.riskScore.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {riskData.riskScore.level === 'low' ? 'Low' :
                       riskData.riskScore.level === 'moderate' ? 'Moderate' : 'High'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Two Column Layout */}
            <div id="risk-score" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Risk Score (1/3 width) */}
              <div className="lg:col-span-1">
                <RiskScoreCard
                  data={riskData}
                  loading={loadingRisk}
                  error={riskError}
                />
              </div>

              {/* Right Column - Trends (2/3 width) */}
              <div id="deficiency-trends" className="lg:col-span-2">
                <TrendsSummary
                  data={trendsData}
                  loading={loadingTrends}
                  error={trendsError}
                />
              </div>
            </div>

            {/* Section 2: Recommendations */}
            <div id="recommendations">
              <Recommendations
                riskData={riskData}
                trendsData={trendsData}
                loading={loadingRisk || loadingTrends}
                error={riskError || trendsError}
              />
            </div>

            {/* Section 3: Clinical Systems Breakdown */}
            <div id="clinical-systems">
              <ClinicalSystemsBreakdown
                data={systemRiskData}
                loading={loadingSystemRisk}
                error={systemRiskError}
              />
            </div>

            {/* Section 4: Tags Heatmap */}
            <div id="tags-heatmap">
              <TagsHeatmap
                data={heatmapData}
                loading={loadingHeatmap}
                error={heatmapError}
              />
            </div>

            {/* Section 5: Market Context */}
            <div id="market-context">
              <MarketContext
                data={marketContextData}
                loading={loadingMarketContext}
                error={marketContextError}
              />
            </div>

            {/* Section 6: Survey Type Breakdown */}
            <div id="survey-types">
              <SurveyTypeBreakdown
                data={surveyTypeData}
                loading={loadingSurveyType}
                error={surveyTypeError}
              />
            </div>

            {/* Section 7: Survey Timeline */}
            <div id="survey-timeline">
              <SurveyTimeline
                data={timelineData}
                loading={loadingTimeline}
                error={timelineError}
              />
            </div>
          </div>
        </TagClickProvider>
      )}
    </div>
  );
}

export default FacilityIntelligence;
