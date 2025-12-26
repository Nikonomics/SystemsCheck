/**
 * SectionTakeaway Component
 *
 * Displays a highlighted "What This Means" takeaway at the bottom of sections.
 * Used to provide actionable insights based on the data shown.
 */

import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

const ICON_MAP = {
  '💡': Lightbulb,
  '⚠️': AlertTriangle,
  '📈': TrendingUp,
  '✅': CheckCircle
};

const TYPE_STYLES = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-900',
    icon: 'text-blue-600'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-900',
    icon: 'text-yellow-600'
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-900',
    icon: 'text-red-600'
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-900',
    icon: 'text-green-600'
  }
};

export function SectionTakeaway({ icon = '💡', type = 'info', children }) {
  const IconComponent = ICON_MAP[icon] || Lightbulb;
  const styles = TYPE_STYLES[type] || TYPE_STYLES.info;

  return (
    <div className={`mt-4 p-4 ${styles.bg} border-l-4 ${styles.border} rounded-r`}>
      <div className="flex items-start gap-2">
        <IconComponent className={`h-5 w-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
        <div className={`text-sm ${styles.text}`}>{children}</div>
      </div>
    </div>
  );
}

/**
 * Generate dynamic takeaway for Risk Score section
 */
export function RiskScoreTakeaway({ riskScore, surveyTiming }) {
  if (!riskScore) return null;

  const { level, score } = riskScore;
  const monthsSince = surveyTiming?.monthsSinceSurvey || 0;

  if (level === 'high') {
    return (
      <SectionTakeaway icon="⚠️" type="danger">
        <strong>Immediate attention needed.</strong> Your risk score is {score}/100 (high)
        {monthsSince >= 10 && ` with a survey window ${monthsSince >= 12 ? 'now open' : 'opening soon'}`}.
        Focus on your worsening and persistent tags before surveyors arrive.
      </SectionTakeaway>
    );
  }

  if (level === 'moderate') {
    return (
      <SectionTakeaway icon="💡" type="warning">
        <strong>Monitor closely.</strong> Your risk score of {score}/100 indicates moderate risk.
        {monthsSince >= 9 && ` Survey expected within ${Math.max(0, 15 - monthsSince)} months.`}
        {' '}Address worsening tags to prevent escalation.
      </SectionTakeaway>
    );
  }

  return (
    <SectionTakeaway icon="✅" type="success">
      <strong>Continue current practices.</strong> Your risk score of {score}/100 is low.
      Use internal audits to catch issues before they become deficiencies.
    </SectionTakeaway>
  );
}

/**
 * Generate dynamic takeaway for Clinical Systems section
 */
export function ClinicalSystemsTakeaway({ systems, summary }) {
  if (!systems || !summary) return null;

  const needingAttention = summary.systemsNeedingAttention || [];

  if (needingAttention.length > 0) {
    const topSystem = needingAttention[0];
    return (
      <SectionTakeaway icon="⚠️" type="warning">
        <strong>{topSystem.name}</strong> needs attention - it has CMS risk and your scorecard is
        {' '}{topSystem.scorecardScore ? `${Math.round(topSystem.scorecardScore)}%` : 'not scored'},
        {topSystem.gap ? ` ${Math.abs(topSystem.gap)}% below` : ' below'} the 85% threshold.
      </SectionTakeaway>
    );
  }

  const highRiskCount = summary.highRiskCount || 0;
  if (highRiskCount > 0) {
    return (
      <SectionTakeaway icon="💡" type="info">
        <strong>{highRiskCount} system{highRiskCount > 1 ? 's have' : ' has'} high CMS risk</strong>
        {' '}based on survey history. Review your scorecard alignment for{' '}
        {summary.highRiskSystems?.join(', ')}.
      </SectionTakeaway>
    );
  }

  return (
    <SectionTakeaway icon="✅" type="success">
      <strong>Good alignment.</strong> Your clinical audit systems are aligned with CMS survey findings.
      Continue using scorecards to maintain compliance.
    </SectionTakeaway>
  );
}

/**
 * Generate dynamic takeaway for Market Context section
 */
export function MarketContextTakeaway({ yourTrendingTags, emergingRisks, stateStats }) {
  if (!stateStats) return null;

  const trendingCount = yourTrendingTags?.length || 0;
  const emergingCount = emergingRisks?.length || 0;

  if (trendingCount > 0) {
    return (
      <SectionTakeaway icon="⚠️" type="warning">
        <strong>{trendingCount} of your historical tags are trending in {stateStats.state}.</strong>
        {' '}Surveyors are likely to focus on these areas.
        {emergingCount > 0 && ` Also watch ${emergingCount} emerging risks not yet in your history.`}
      </SectionTakeaway>
    );
  }

  if (emergingCount > 0) {
    return (
      <SectionTakeaway icon="💡" type="info">
        <strong>{emergingCount} emerging risk{emergingCount > 1 ? 's' : ''}</strong> trending statewide
        that {emergingCount > 1 ? 'are' : 'is'} not in your history. Consider proactive auditing in these areas.
      </SectionTakeaway>
    );
  }

  return (
    <SectionTakeaway icon="✅" type="success">
      <strong>No urgent market alignment concerns.</strong> Your historical tags are not currently
      trending in {stateStats.state}. Continue monitoring state trends.
    </SectionTakeaway>
  );
}

/**
 * Generate dynamic takeaway for Trends section
 */
export function TrendsTakeaway({ tagTrends, summary }) {
  if (!tagTrends || !summary) return null;

  const worseningCount = summary.worseningCount || 0;
  const persistentCount = summary.persistentCount || 0;
  const newCount = summary.newCount || 0;

  if (worseningCount > 0) {
    const topWorsening = tagTrends.worsening?.[0];
    return (
      <SectionTakeaway icon="⚠️" type="danger">
        <strong>{worseningCount} tag{worseningCount > 1 ? 's are' : ' is'} worsening.</strong>
        {topWorsening && ` Priority: ${topWorsening.tagFormatted || topWorsening.tag}${topWorsening.tagName ? ` (${topWorsening.tagName})` : ''}.`}
        {' '}Address root causes before the next survey.
      </SectionTakeaway>
    );
  }

  if (persistentCount > 2) {
    return (
      <SectionTakeaway icon="💡" type="warning">
        <strong>{persistentCount} persistent tags</strong> indicate ongoing challenges.
        Review your corrective action plans for these areas - surveyors notice patterns.
      </SectionTakeaway>
    );
  }

  if (newCount > 0) {
    return (
      <SectionTakeaway icon="💡" type="info">
        <strong>{newCount} new tag{newCount > 1 ? 's' : ''}</strong> appeared in your most recent survey.
        Monitor these to prevent them from becoming persistent issues.
      </SectionTakeaway>
    );
  }

  return (
    <SectionTakeaway icon="✅" type="success">
      <strong>Positive trend trajectory.</strong> No worsening tags and low persistence.
      Your corrective actions are working.
    </SectionTakeaway>
  );
}

export default SectionTakeaway;
