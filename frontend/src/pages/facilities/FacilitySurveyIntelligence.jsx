/**
 * FacilitySurveyIntelligence
 *
 * Displays comprehensive Survey Intelligence data from our calculated database:
 * - Survey Risk Score with lagging/leading components
 * - Operational Context (Quadrant, Capacity Strain, Resource Score)
 * - Individual Metrics with thresholds
 * - Alert Flags
 * - Recommendations
 * - Chain Context
 * - Gap Analysis
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Building2,
  Gauge
} from 'lucide-react';
import { facilitiesApi } from '../../api/facilities';

// API call to get survey intelligence data
const getSurveyIntelligence = async (facilityId) => {
  const response = await fetch(`/api/survey-intelligence/facility/${facilityId}`);
  if (!response.ok) throw new Error('Failed to fetch survey intelligence');
  return response.json();
};

// Risk tier colors
const RISK_TIER_COLORS = {
  Critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  High: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  Moderate: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  Low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
};

// Quadrant configuration
const QUADRANT_CONFIG = {
  'High Performing': { icon: '✅', color: 'text-green-600', bg: 'bg-green-50', description: 'Strong resources handling demand well' },
  'Comfortable': { icon: '✓', color: 'text-blue-600', bg: 'bg-blue-50', description: 'Adequate resources with lower demand' },
  'Overextended': { icon: '⚠️', color: 'text-orange-600', bg: 'bg-orange-50', description: 'High demand straining resources' },
  'Struggling': { icon: '🚨', color: 'text-red-600', bg: 'bg-red-50', description: 'Low resources and struggling with demand' }
};

// Status colors
const STATUS_COLORS = {
  EXCELLENT: 'text-green-600',
  TARGET: 'text-blue-600',
  WARNING: 'text-orange-600',
  CRITICAL: 'text-red-600'
};

// Alert flag configuration
const ALERT_CONFIG = {
  DEATH_SPIRAL_RISK: { color: 'bg-red-100 text-red-800', description: 'High turnover combined with low star ratings' },
  DOUBLE_TROUBLE: { color: 'bg-orange-100 text-orange-800', description: 'Multiple metrics below thresholds' },
  WEEKEND_VULNERABILITY: { color: 'bg-yellow-100 text-yellow-800', description: 'Significant weekend staffing gap' },
  ABUSE_HISTORY: { color: 'bg-purple-100 text-purple-800', description: 'Prior abuse-related citations' }
};

// Score Card Component
const ScoreCard = ({ title, score, tier, icon, subtitle }) => {
  const tierColors = RISK_TIER_COLORS[tier] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">{score ?? '--'}</span>
        {tier && (
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${tierColors.bg} ${tierColors.text}`}>
            {tier}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

// Metric Bar Component
const MetricBar = ({ label, value, status, thresholds, format = 'percent' }) => {
  const statusColor = STATUS_COLORS[status] || 'text-gray-600';
  const formattedValue = value !== null && value !== undefined
    ? format === 'percent' ? `${(value * 100).toFixed(1)}%` : value.toFixed(1)
    : '--';

  // Calculate position on gradient bar
  const getPosition = () => {
    if (value === null || value === undefined) return 50;
    const numValue = format === 'percent' ? value * 100 : value;
    // Clamp to 0-100
    return Math.min(100, Math.max(0, numValue));
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${statusColor}`}>{formattedValue}</span>
      </div>
      <div className="relative h-2 bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 rounded-full">
        <div
          className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full border-2 border-white shadow"
          style={{ left: `${getPosition()}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{thresholds?.min || 'Low'}</span>
        <span>{thresholds?.target || 'Target'}</span>
        <span>{thresholds?.max || 'High'}</span>
      </div>
    </div>
  );
};

export function FacilitySurveyIntelligence() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [facility, setFacility] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    operational: true,
    recommendations: true,
    chain: false
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load facility and intelligence data in parallel
      const [facilityData, intelligenceData] = await Promise.all([
        facilitiesApi.get(id),
        getSurveyIntelligence(id).catch(() => null)
      ]);

      setFacility(facilityData);
      setIntelligence(intelligenceData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load facility data: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  const hasIntelligence = intelligence && intelligence.status !== 'NOT_CALCULATED';
  const quadrantConfig = QUADRANT_CONFIG[intelligence?.operational_context?.quadrant] || {};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/facilities/${id}`)}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Facility</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{facility.name}</h1>
            <p className="text-gray-500">Survey Intelligence</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {!hasIntelligence ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Survey Intelligence Not Calculated
          </h3>
          <p className="text-yellow-700">
            {intelligence?.message || 'Intelligence data has not been calculated for this facility yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* Score Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ScoreCard
              title="Survey Risk Score"
              score={intelligence.scores?.survey_risk?.score}
              tier={intelligence.scores?.survey_risk?.tier}
              icon={<Gauge className="w-5 h-5 text-gray-400" />}
              subtitle={`Lagging: ${intelligence.scores?.survey_risk?.lagging_component || '--'} | Leading: ${intelligence.scores?.survey_risk?.leading_component || '--'}`}
            />
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Focus Areas</h3>
                <Target className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-1">
                {(intelligence.scores?.focus_areas || []).slice(0, 3).map((fa, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">#{fa.rank} {fa.system}</span>
                    <span className="font-medium">{fa.score}</span>
                  </div>
                ))}
                {(!intelligence.scores?.focus_areas || intelligence.scores?.focus_areas.length === 0) && (
                  <p className="text-gray-400 text-sm">No focus areas identified</p>
                )}
              </div>
            </div>
            <ScoreCard
              title="Audit Score"
              score={intelligence.scores?.audit_score?.score}
              tier={intelligence.scores?.audit_score?.tier}
              icon={<Activity className="w-5 h-5 text-gray-400" />}
              subtitle="From internal audits"
            />
          </div>

          {/* Operational Context Section */}
          <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
            <button
              onClick={() => toggleSection('operational')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Operational Context</h2>
              </div>
              {expandedSections.operational ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections.operational && (
              <div className="p-4 border-t">
                {/* Quadrant */}
                <div className={`${quadrantConfig.bg || 'bg-gray-50'} rounded-lg p-4 mb-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{quadrantConfig.icon || '?'}</span>
                    <span className={`text-lg font-semibold ${quadrantConfig.color || 'text-gray-700'}`}>
                      {intelligence.operational_context?.quadrant || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{quadrantConfig.description}</p>
                </div>

                {/* Strain and Resource Score */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Capacity Strain</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {intelligence.operational_context?.capacity_strain?.toFixed(1) || '--'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Resource Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {intelligence.operational_context?.resource_score?.toFixed(1) || '--'}
                    </p>
                  </div>
                </div>

                {/* Individual Metrics */}
                <div className="space-y-2">
                  <MetricBar
                    label="Turnover Rate"
                    value={intelligence.operational_context?.metrics?.turnover?.value}
                    status={intelligence.operational_context?.metrics?.turnover?.status}
                    thresholds={{ min: '0%', target: '<40%', max: '>60%' }}
                    format="number"
                  />
                  <MetricBar
                    label="RN Skill Mix"
                    value={intelligence.operational_context?.metrics?.rn_skill_mix?.value}
                    status={intelligence.operational_context?.metrics?.rn_skill_mix?.status}
                    thresholds={{ min: '<10%', target: '25-30%', max: '>30%' }}
                  />
                  <MetricBar
                    label="RN Hours/Resident/Day"
                    value={intelligence.operational_context?.metrics?.rn_hours?.value}
                    status={intelligence.operational_context?.metrics?.rn_hours?.status}
                    thresholds={{ min: '<0.4', target: '0.5-0.75', max: '>0.75' }}
                    format="number"
                  />
                  <MetricBar
                    label="Weekend Gap"
                    value={intelligence.operational_context?.metrics?.weekend_gap?.value}
                    status={intelligence.operational_context?.metrics?.weekend_gap?.status}
                    thresholds={{ min: '<10%', target: '10-20%', max: '>30%' }}
                  />
                  <MetricBar
                    label="Occupancy"
                    value={intelligence.operational_context?.metrics?.occupancy?.value}
                    status={intelligence.operational_context?.metrics?.occupancy?.status}
                    thresholds={{ min: '<60%', target: '80-90%', max: '>95%' }}
                  />
                </div>

                {/* Alert Flags */}
                {intelligence.operational_context?.alert_flags?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Alert Flags</h3>
                    <div className="flex flex-wrap gap-2">
                      {intelligence.operational_context.alert_flags.map((flag, i) => {
                        const flagName = typeof flag === 'string' ? flag : flag.name;
                        const config = ALERT_CONFIG[flagName] || { color: 'bg-gray-100 text-gray-800' };
                        return (
                          <span
                            key={i}
                            className={`px-2 py-1 text-xs font-medium rounded ${config.color}`}
                            title={config.description}
                          >
                            {flagName.replace(/_/g, ' ')}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recommendations Section */}
          {intelligence.recommendations?.length > 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
              <button
                onClick={() => toggleSection('recommendations')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
                </div>
                {expandedSections.recommendations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.recommendations && (
                <div className="p-4 border-t space-y-3">
                  {intelligence.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className={`border rounded-lg p-3 ${
                        rec.priority === 1 ? 'border-red-200 bg-red-50' :
                        rec.priority === 2 ? 'border-orange-200 bg-orange-50' :
                        'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          rec.priority === 1 ? 'bg-red-500' :
                          rec.priority === 2 ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`}>
                          {rec.priority}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{rec.area}</span>
                            <span className="text-xs text-gray-500">
                              {rec.current} → {rec.target}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{rec.action}</p>
                          {rec.impact && (
                            <p className="text-xs text-gray-500 mt-1">Impact: {rec.impact}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chain Context Section */}
          {intelligence.chain_context && !intelligence.chain_context.is_independent && (
            <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
              <button
                onClick={() => toggleSection('chain')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Chain Context: {intelligence.chain_context.chain_name}
                  </h2>
                </div>
                {expandedSections.chain ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {expandedSections.chain && (
                <div className="p-4 border-t">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Chain Average QM</p>
                      <p className="text-xl font-bold text-gray-700">
                        {intelligence.chain_context.chain_avg_qm?.toFixed(1) || '--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">vs Chain</p>
                      <p className={`text-xl font-bold ${
                        intelligence.chain_context.facility_vs_chain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {intelligence.chain_context.facility_vs_chain >= 0 ? '+' : ''}
                        {intelligence.chain_context.facility_vs_chain?.toFixed(1) || '--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Chain Facilities</p>
                      <p className="text-xl font-bold text-gray-700">
                        {intelligence.chain_context.chain_facility_count || '--'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gap Analysis Section */}
          {intelligence.gap_analysis?.status && (
            <div className={`rounded-lg border p-4 ${
              intelligence.gap_analysis.status === 'CONFIRMED_RISK' ? 'bg-red-50 border-red-200' :
              intelligence.gap_analysis.status === 'VALIDATE' ? 'bg-orange-50 border-orange-200' :
              intelligence.gap_analysis.status === 'HIDDEN_RISK' ? 'bg-yellow-50 border-yellow-200' :
              'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5" />
                <h3 className="font-semibold">Gap Analysis: {intelligence.gap_analysis.status.replace(/_/g, ' ')}</h3>
              </div>
              <p className="text-sm">{intelligence.gap_analysis.insight}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            Last calculated: {intelligence.metadata?.calculated_at
              ? new Date(intelligence.metadata.calculated_at).toLocaleString()
              : 'Unknown'}
          </div>
        </>
      )}
    </div>
  );
}

export default FacilitySurveyIntelligence;
