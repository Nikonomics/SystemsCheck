/**
 * TeamIntelligence.jsx
 * Main page for Team View in Survey Intelligence
 * 
 * Aggregates facility data and connects CMS citations with internal scorecards
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  TrendingUp,
  ChevronRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import surveyIntelApi from '../../api/surveyIntelTeam';
import { TagClickProvider } from './components/TagClickContext';
import TagDetailModal from './components/TagDetailModal';

// Section Components
import TeamRiskSummary from './components/team/TeamRiskSummary';
import FacilityComparisonTable from './components/team/FacilityComparisonTable';
import ClinicalSystemsGap from './components/team/ClinicalSystemsGap';
import CommonIssues from './components/team/CommonIssues';
import TeamMarketComparison from './components/team/TeamMarketComparison';
import ScorecardTrends from './components/team/ScorecardTrends';
import TeamRecommendations from './components/team/TeamRecommendations';

const TeamIntelligence = () => {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('teamId');

  // Data state
  const [summary, setSummary] = useState(null);
  const [facilities, setFacilities] = useState(null);
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [commonIssues, setCommonIssues] = useState(null);
  const [marketComparison, setMarketComparison] = useState(null);
  const [scorecardTrends, setScorecardTrends] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);

  // Fetch all data
  useEffect(() => {
    if (!teamId) {
      setError('No team selected. Please select a team from the navigation.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all endpoints in parallel
        const [
          summaryRes,
          facilitiesRes,
          gapRes,
          issuesRes,
          marketRes,
          trendsRes,
          recsRes
        ] = await Promise.all([
          surveyIntelApi.getTeamSummary(teamId),
          surveyIntelApi.getTeamFacilities(teamId),
          surveyIntelApi.getGapAnalysis(teamId),
          surveyIntelApi.getCommonIssues(teamId),
          surveyIntelApi.getMarketComparison(teamId),
          surveyIntelApi.getScorecardTrends(teamId),
          surveyIntelApi.getRecommendations(teamId)
        ]);

        setSummary(summaryRes);
        setFacilities(facilitiesRes);
        setGapAnalysis(gapRes);
        setCommonIssues(issuesRes);
        setMarketComparison(marketRes);
        setScorecardTrends(trendsRes);
        setRecommendations(recsRes);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  // Handle tag click
  const handleTagClick = (tag) => {
    setSelectedTag(tag);
  };

  if (!teamId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Team Selected</h2>
          <p className="text-yellow-700 mb-4">
            Please select a team from the sidebar or navigation to view team intelligence.
          </p>
          <Link 
            to="/facilities" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go to Facilities →
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-600">Loading team intelligence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <TagClickProvider onTagClick={handleTagClick}>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/survey-intelligence" className="hover:text-blue-600">
                Survey Intelligence
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span>Team View</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-600" />
              {summary?.teamName || 'Team'}
            </h1>
            <p className="text-gray-600 mt-1">
              {summary?.facilityCount || 0} facilities · Risk + Scorecard Analysis
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/survey-analytics?teamId=${teamId}`}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Raw Survey Data
            </Link>
          </div>
        </div>

        {/* Key Insight Banner */}
        {gapAnalysis?.analysis?.some(a => a.gapAlert.alert === 'URGENT') && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Attention Required</h3>
                <p className="text-red-700 text-sm mt-1">
                  {gapAnalysis.analysis.filter(a => a.gapAlert.alert === 'URGENT').length} clinical 
                  system(s) have HIGH CMS risk combined with low scorecard performance. These require immediate attention.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Summary & Quick Stats */}
          <div className="space-y-6">
            <TeamRiskSummary data={summary} />
            <TeamMarketComparison data={marketComparison} />
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <TeamRecommendations data={recommendations} />
            <ClinicalSystemsGap data={gapAnalysis} />
          </div>
        </div>

        {/* Full Width Sections */}
        <FacilityComparisonTable data={facilities} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CommonIssues data={commonIssues} />
          <ScorecardTrends data={scorecardTrends} />
        </div>

        {/* Tag Detail Modal */}
        {selectedTag && (
          <TagDetailModal 
            tag={selectedTag} 
            onClose={() => setSelectedTag(null)} 
          />
        )}
      </div>
    </TagClickProvider>
  );
};

export default TeamIntelligence;
