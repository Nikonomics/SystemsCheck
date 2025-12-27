/**
 * TeamIntelligence.jsx
 * Main page for Team View in Survey Intelligence
 * 
 * Aggregates facility data and connects CMS citations with internal scorecards
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import surveyIntelApi from '../../api/surveyIntelTeam';
import { organizationApi } from '../../api/organization';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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

  // Team selector state
  const [availableTeams, setAvailableTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Fetch available teams (for selector and team switcher)
  useEffect(() => {
    const fetchTeams = async () => {
      setTeamsLoading(true);
      try {
        const response = await organizationApi.listTeams();
        setAvailableTeams(response.teams || []);
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Fetch all data
  useEffect(() => {
    if (!teamId) {
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

  // Handle team selection
  const handleTeamSelect = (selectedTeamId) => {
    if (selectedTeamId) {
      setSearchParams({ teamId: selectedTeamId });
    }
  };

  if (!teamId) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="text-center mb-6">
              <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Team Intelligence</h2>
              <p className="text-gray-600">
                Select a team to view aggregated risk analysis, scorecard trends, and recommendations.
              </p>
            </div>

            {teamsLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                <span className="text-gray-600">Loading teams...</span>
              </div>
            ) : availableTeams.length > 0 ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select a Team
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => handleTeamSelect(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Choose a team...</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.facilityCount} facilities)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No teams available.</p>
                <Link
                  to="/admin/organization"
                  className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                >
                  Create a team →
                </Link>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Or view individual facility intelligence on the{' '}
                <Link to="/survey-intelligence" className="text-blue-600 hover:text-blue-700">
                  Survey Intelligence
                </Link>{' '}
                page.
              </p>
            </div>
          </div>
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
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-600" />
              {/* Team Switcher Dropdown */}
              {availableTeams.length > 1 ? (
                <div className="relative">
                  <select
                    value={teamId || ''}
                    onChange={(e) => handleTeamSelect(e.target.value)}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-none cursor-pointer appearance-none pr-8 focus:outline-none focus:ring-0"
                  >
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">
                  {summary?.teamName || 'Team'}
                </h1>
              )}
            </div>
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
