/**
 * TeamSelectorCards.jsx
 * Grid of team cards for selecting a team to view details
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const TeamSelectorCards = ({ teams, loading }) => {
  const navigate = useNavigate();

  const handleTeamClick = (teamId) => {
    navigate(`/survey-intelligence/team?teamId=${teamId}`);
  };

  // Get risk level styling
  const getRiskStyles = (level) => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
          dot: 'bg-red-500'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-200',
          dot: 'bg-green-500'
        };
    }
  };

  // Get risk score color
  const getRiskScoreColor = (score) => {
    if (score > 70) return 'text-red-600';
    if (score > 40) return 'text-amber-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Select a Team to View Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Select a Team to View Details</h2>
        </div>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No teams available.</p>
          <p className="text-sm text-gray-400 mt-1">
            Create teams in Organization Settings to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900">Select a Team to View Details</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => {
          const riskStyles = getRiskStyles(team.riskLevel);

          return (
            <button
              key={team.teamId}
              onClick={() => handleTeamClick(team.teamId)}
              className="group text-left border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white"
            >
              {/* Team Name & Arrow */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {team.teamName}
                </h3>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Risk Score */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-3xl font-bold ${getRiskScoreColor(team.currentRiskScore)}`}>
                  {team.currentRiskScore}
                </span>
                <span className="text-sm text-gray-500">risk score</span>
              </div>

              {/* Risk Level Badge & Facility Count */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${riskStyles.bg} ${riskStyles.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${riskStyles.dot}`} />
                  {team.riskLevel} Risk
                </span>

                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{team.facilityCount} facilities</span>
                </div>
              </div>

              {/* Color indicator bar at bottom */}
              <div
                className="mt-3 h-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: team.color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeamSelectorCards;
