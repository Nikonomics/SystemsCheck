/**
 * Recommendations Component
 *
 * Generates actionable recommendations based on risk factors,
 * deficiency trends, and market alignment data.
 *
 * Uses rule-based analysis to prioritize focus areas.
 */

import { useMemo } from 'react';
import {
  AlertTriangle,
  Info,
  Target,
  Clock,
  TrendingUp,
  Repeat,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  Shield
} from 'lucide-react';

/**
 * System name mapping for readable recommendations
 */
const SYSTEM_NAMES = {
  1: 'Change of Condition',
  2: 'Falls Prevention',
  3: 'Skin Integrity',
  4: 'Medication & Weight Management',
  5: 'Infection Control',
  6: 'Transfer & Discharge',
  7: 'Abuse Prevention & Grievances'
};

/**
 * Generate recommendations based on risk and trend data
 */
function generateRecommendations(riskData, trendsData) {
  const recommendations = {
    critical: [],
    focus: [],
    watch: []
  };

  if (!riskData?.hasData) {
    return recommendations;
  }

  const { riskScore, factors, surveyTiming } = riskData;

  // 1. Survey Timing Recommendations
  if (surveyTiming?.monthsSinceSurvey >= 12) {
    recommendations.critical.push({
      id: 'survey-overdue',
      icon: Clock,
      title: 'Survey Overdue',
      description: `Last survey was ${surveyTiming.monthsSinceSurvey} months ago. Surveyors could arrive any day.`,
      action: 'Conduct a mock survey immediately and address any findings.',
      priority: 'critical'
    });
  } else if (surveyTiming?.monthsSinceSurvey >= 9) {
    recommendations.focus.push({
      id: 'survey-window',
      icon: Clock,
      title: 'Survey Window Opening',
      description: `${surveyTiming.monthsSinceSurvey} months since last survey. Expected within 0-3 months.`,
      action: 'Begin intensive survey preparation. Review all high-risk areas.',
      priority: 'high'
    });
  }

  // 2. High Severity History
  if (factors?.historySeverity?.maxSeverity) {
    const maxSev = factors.historySeverity.maxSeverity;
    if (['J', 'K', 'L'].includes(maxSev)) {
      recommendations.critical.push({
        id: 'ij-history',
        icon: AlertTriangle,
        title: 'Immediate Jeopardy History',
        description: `Facility has history of severity level ${maxSev} (Immediate Jeopardy). This triggers heightened surveyor scrutiny.`,
        action: 'Review root cause analysis from previous IJ. Ensure corrective actions are sustained.',
        priority: 'critical'
      });
    } else if (['G', 'H', 'I'].includes(maxSev)) {
      recommendations.focus.push({
        id: 'harm-history',
        icon: AlertTriangle,
        title: 'Actual Harm History',
        description: `Previous surveys found actual harm (severity ${maxSev}). Focus on preventing recurrence.`,
        action: 'Audit clinical systems associated with past harm findings.',
        priority: 'high'
      });
    }
  }

  // 3. Repeat Tag Analysis
  if (factors?.repeatRate?.rate > 30) {
    recommendations.critical.push({
      id: 'high-repeat',
      icon: Repeat,
      title: 'High Repeat Citation Rate',
      description: `${factors.repeatRate.rate}% of deficiency tags have been cited multiple times. This indicates systemic issues.`,
      action: 'Review QAPI process. Ensure root cause analysis leads to sustainable solutions, not just quick fixes.',
      priority: 'critical'
    });
  } else if (factors?.repeatRate?.rate > 15) {
    recommendations.focus.push({
      id: 'moderate-repeat',
      icon: Repeat,
      title: 'Repeat Citations Detected',
      description: `${factors.repeatRate.repeatedTagCount} tags have been cited more than once in the past 3 years.`,
      action: 'For each repeat tag, verify that previous corrective actions are being followed consistently.',
      priority: 'medium'
    });
  }

  // 4. Market Alignment (Hot Tags)
  if (factors?.marketAlignment?.matchingHotTags >= 3) {
    recommendations.focus.push({
      id: 'market-alignment',
      icon: TrendingUp,
      title: 'State Trend Alignment',
      description: `${factors.marketAlignment.matchingHotTags} of your cited tags are trending in your state. Surveyors are likely focusing on these areas.`,
      action: `Review these state hot tags: ${factors.marketAlignment.hotTags?.slice(0, 3).join(', ')}`,
      priority: 'high'
    });
  }

  // 5. Trend-Based Recommendations (from trendsData)
  if (trendsData?.hasData && trendsData.tagTrends) {
    const { worsening, persistent } = trendsData.tagTrends;

    // Worsening tags
    if (worsening?.length > 0) {
      // Group by system
      const worseningBySystems = {};
      worsening.forEach(tag => {
        const system = tag.system || 0;
        if (!worseningBySystems[system]) {
          worseningBySystems[system] = [];
        }
        worseningBySystems[system].push(tag.tag);
      });

      Object.entries(worseningBySystems).forEach(([system, tags]) => {
        const systemName = SYSTEM_NAMES[system] || 'General';
        recommendations.critical.push({
          id: `worsening-${system}`,
          icon: TrendingUp,
          title: `Worsening: ${systemName}`,
          description: `Severity is increasing for ${tags.length} tag(s): ${tags.slice(0, 3).join(', ')}${tags.length > 3 ? '...' : ''}`,
          action: `Conduct immediate focused audit on ${systemName}. Review recent incidents and staff competencies.`,
          priority: 'critical'
        });
      });
    }

    // Persistent tags
    if (persistent?.length > 0) {
      // Group by system
      const persistentBySystems = {};
      persistent.forEach(tag => {
        const system = tag.system || 0;
        if (!persistentBySystems[system]) {
          persistentBySystems[system] = [];
        }
        persistentBySystems[system].push(tag.tag);
      });

      Object.entries(persistentBySystems).forEach(([system, tags]) => {
        if (tags.length >= 2) {
          const systemName = SYSTEM_NAMES[system] || 'General';
          recommendations.focus.push({
            id: `persistent-${system}`,
            icon: Repeat,
            title: `Persistent: ${systemName}`,
            description: `${tags.length} tags have been cited at the same severity across surveys: ${tags.slice(0, 3).join(', ')}`,
            action: `Review root cause analysis for ${systemName}. Consider process redesign if current interventions aren't working.`,
            priority: 'medium'
          });
        }
      });
    }
  }

  // 6. Overall Risk Level Recommendation
  if (riskScore?.level === 'high') {
    recommendations.critical.unshift({
      id: 'high-risk',
      icon: Shield,
      title: 'High Risk Status',
      description: `Overall risk score is ${riskScore.score}/100. This facility requires immediate attention.`,
      action: 'Escalate to leadership. Consider bringing in external consultants for comprehensive review.',
      priority: 'critical'
    });
  } else if (riskScore?.level === 'moderate') {
    recommendations.focus.unshift({
      id: 'moderate-risk',
      icon: Target,
      title: 'Moderate Risk - Action Required',
      description: `Risk score of ${riskScore.score}/100 indicates room for improvement.`,
      action: 'Focus internal audit efforts on the areas highlighted below.',
      priority: 'medium'
    });
  } else if (riskScore?.level === 'low') {
    recommendations.watch.push({
      id: 'low-risk',
      icon: CheckCircle,
      title: 'Low Risk - Maintain Vigilance',
      description: `Risk score of ${riskScore.score}/100 is good, but continuous improvement is key.`,
      action: 'Continue current practices. Use internal audits to catch issues before they become deficiencies.',
      priority: 'low'
    });
  }

  // 7. No Recent Survey Data
  if (factors?.historySeverity?.totalDeficiencies === 0) {
    recommendations.watch.push({
      id: 'no-history',
      icon: Info,
      title: 'Limited Survey History',
      description: 'No deficiencies found in the 3-year lookback period.',
      action: 'This is good, but ensure internal audits are identifying issues before surveyors do.',
      priority: 'low'
    });
  }

  return recommendations;
}

/**
 * Recommendation card component
 */
const RecommendationCard = ({ recommendation }) => {
  const Icon = recommendation.icon;

  const priorityColors = {
    critical: 'border-l-red-500 bg-red-50',
    high: 'border-l-orange-500 bg-orange-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-green-500 bg-green-50'
  };

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${priorityColors[recommendation.priority]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
          recommendation.priority === 'critical' ? 'text-red-600' :
          recommendation.priority === 'high' ? 'text-orange-600' :
          recommendation.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
        }`} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <ArrowRight className="h-4 w-4 text-purple-600" />
            <span className="text-purple-700 font-medium">{recommendation.action}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Section header
 */
const SectionHeader = ({ icon: Icon, title, count, color }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className={`h-5 w-5 ${color}`} />
    <h4 className="font-semibold text-gray-900">{title}</h4>
    <span className="text-sm text-gray-500">({count})</span>
  </div>
);

export function Recommendations({ riskData, trendsData, loading, error }) {
  const recommendations = useMemo(() => {
    return generateRecommendations(riskData, trendsData);
  }, [riskData, trendsData]);

  const totalCount = recommendations.critical.length +
    recommendations.focus.length +
    recommendations.watch.length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Unable to generate recommendations</p>
        </div>
      </div>
    );
  }

  if (!riskData?.hasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            No data available to generate recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {totalCount} actionable items based on survey history and risk analysis
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Critical */}
        {recommendations.critical.length > 0 && (
          <div>
            <SectionHeader
              icon={AlertTriangle}
              title="Critical Actions"
              count={recommendations.critical.length}
              color="text-red-600"
            />
            <div className="space-y-3">
              {recommendations.critical.map(rec => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Focus Areas */}
        {recommendations.focus.length > 0 && (
          <div>
            <SectionHeader
              icon={Target}
              title="Focus Areas"
              count={recommendations.focus.length}
              color="text-orange-600"
            />
            <div className="space-y-3">
              {recommendations.focus.map(rec => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Watch Items */}
        {recommendations.watch.length > 0 && (
          <div>
            <SectionHeader
              icon={CheckCircle}
              title="Watch Items"
              count={recommendations.watch.length}
              color="text-green-600"
            />
            <div className="space-y-3">
              {recommendations.watch.map(rec => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {/* No Recommendations */}
        {totalCount === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">Looking Good!</h4>
            <p className="text-sm text-gray-500 mt-1">
              No specific recommendations at this time. Continue current practices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Recommendations;
