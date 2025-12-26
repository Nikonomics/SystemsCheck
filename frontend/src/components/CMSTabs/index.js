/**
 * CMS Tab Components
 *
 * Components for displaying CMS facility data in the Facility Detail page.
 * These tabs are shown when a facility has a CCN (CMS Certification Number) linked.
 */

// Tab Components
export { default as SnapshotTab } from './SnapshotTab/SnapshotTab';
export { default as TrendsTab } from './TrendsTab/TrendsTab';
export { default as BenchmarksTab } from './BenchmarksTab/BenchmarksTab';
export { default as RiskAnalysisTab } from './RiskAnalysisTab/RiskAnalysisTab';
export { default as VBPTab } from './VBPTab/VBPTab';
export { default as CompetitionTab } from './CompetitionTab/CompetitionTab';
export { default as ReportsTab } from './ReportsTab/ReportsTab';
export { default as SurveyIntelligenceTab } from './SurveyIntelligenceTab/SurveyIntelligenceTab';

// Shared Components
export { TabEmpty, TabError, TabSkeleton } from './shared';

// Styles
import './FacilityMetrics.css';
