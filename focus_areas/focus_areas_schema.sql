-- ============================================================================
-- FOCUS AREAS DATABASE SCHEMA
-- ============================================================================
-- Tables for storing focus area analysis results
-- Run against: snf_market_data database (MARKET_DATABASE_URL)
-- ============================================================================

-- Clinical Systems Reference Table
CREATE TABLE IF NOT EXISTS clinical_systems (
  system_id INTEGER PRIMARY KEY,
  system_name VARCHAR(50) NOT NULL,
  system_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO clinical_systems (system_id, system_name, system_description) VALUES
  (1, 'Change of Condition', 'Notification, care planning, and monitoring of resident condition changes'),
  (2, 'Accidents/Falls', 'Fall prevention, environmental safety, and supervision'),
  (3, 'Skin', 'Pressure injury prevention, wound care, and skin integrity'),
  (4, 'Med Management/Weight Loss', 'Pharmacy services, medication management, and nutrition'),
  (5, 'Infection Control', 'Infection prevention, COVID protocols, and vaccinations'),
  (6, 'Transfer/Discharge', 'Discharge planning, transfers, and care transitions'),
  (7, 'Abuse/Grievances', 'Abuse prevention, resident rights, and grievance handling')
ON CONFLICT (system_id) DO NOTHING;

-- F-Tag to System Mapping Table
CREATE TABLE IF NOT EXISTS ftag_system_mapping (
  id SERIAL PRIMARY KEY,
  deficiency_tag VARCHAR(10) NOT NULL,
  primary_system_id INTEGER NOT NULL REFERENCES clinical_systems(system_id),
  secondary_system_id INTEGER REFERENCES clinical_systems(system_id),
  rationale TEXT,
  citation_frequency VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(deficiency_tag)
);

-- Quality Measure to System Mapping Table
CREATE TABLE IF NOT EXISTS qm_system_mapping (
  id SERIAL PRIMARY KEY,
  qm_code VARCHAR(20) NOT NULL,
  qm_name VARCHAR(100) NOT NULL,
  qm_type VARCHAR(20) NOT NULL, -- 'long_stay', 'short_stay', 'vbp'
  primary_system_id INTEGER NOT NULL REFERENCES clinical_systems(system_id),
  secondary_system_id INTEGER REFERENCES clinical_systems(system_id),
  higher_is_worse BOOLEAN DEFAULT true,
  rationale TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(qm_code)
);

-- Facility Focus Areas Results Table (main output)
CREATE TABLE IF NOT EXISTS facility_focus_areas (
  id SERIAL PRIMARY KEY,
  federal_provider_number VARCHAR(10) NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  model_version VARCHAR(10) NOT NULL DEFAULT '1.0',

  -- Overall facility metrics
  overall_risk_score NUMERIC(5,2),
  overall_risk_tier VARCHAR(20), -- 'Low', 'Medium', 'High', 'Very High'

  -- Key facility-level metrics (JSON for flexibility)
  key_metrics JSONB,

  -- The focus areas JSON blob (ranked systems with evidence)
  focus_areas JSONB,

  -- Metadata
  data_as_of_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Index for quick lookups
  UNIQUE(federal_provider_number, calculated_at)
);

CREATE INDEX IF NOT EXISTS idx_focus_areas_fpn ON facility_focus_areas(federal_provider_number);
CREATE INDEX IF NOT EXISTS idx_focus_areas_calculated ON facility_focus_areas(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_areas_risk ON facility_focus_areas(overall_risk_tier);

-- System Risk Scores Table (intermediate calculations)
CREATE TABLE IF NOT EXISTS facility_system_scores (
  id SERIAL PRIMARY KEY,
  federal_provider_number VARCHAR(10) NOT NULL,
  system_id INTEGER NOT NULL REFERENCES clinical_systems(system_id),
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Component scores (0-100 scale)
  citation_factor_score NUMERIC(5,2),
  qm_factor_score NUMERIC(5,2),
  qm_trend_score NUMERIC(5,2),
  peer_factor_score NUMERIC(5,2),
  state_factor_score NUMERIC(5,2),

  -- Weighted final score
  system_risk_score NUMERIC(5,2),

  -- Evidence counts
  citation_count_3yr INTEGER,
  severity_weighted_count NUMERIC(8,2),
  repeat_ftag_count INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(federal_provider_number, system_id, calculated_at)
);

CREATE INDEX IF NOT EXISTS idx_system_scores_fpn ON facility_system_scores(federal_provider_number);
CREATE INDEX IF NOT EXISTS idx_system_scores_system ON facility_system_scores(system_id);

-- Facility Citation Metrics (derived metrics)
CREATE TABLE IF NOT EXISTS facility_citation_metrics (
  id SERIAL PRIMARY KEY,
  federal_provider_number VARCHAR(10) NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Citation velocity
  current_survey_deficiencies INTEGER,
  previous_survey_deficiencies INTEGER,
  prev2_survey_deficiencies INTEGER,
  citation_velocity VARCHAR(20), -- 'improving', 'stable', 'worsening'

  -- Scope/severity trends
  current_avg_severity NUMERIC(4,2),
  previous_avg_severity NUMERIC(4,2),
  severity_trend VARCHAR(20),

  -- Repeat F-tags
  repeat_ftag_rate NUMERIC(5,4),
  repeat_ftag_list TEXT[], -- Array of repeated F-tags

  -- Time since events
  days_since_last_survey INTEGER,
  days_since_last_ij INTEGER,
  survey_overdue BOOLEAN,

  -- Concentration
  top_system_concentration NUMERIC(5,4), -- Herfindahl-style

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(federal_provider_number, calculated_at)
);

CREATE INDEX IF NOT EXISTS idx_citation_metrics_fpn ON facility_citation_metrics(federal_provider_number);

-- State Survey Trends (for state factor calculation)
CREATE TABLE IF NOT EXISTS state_survey_trends (
  id SERIAL PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  system_id INTEGER NOT NULL REFERENCES clinical_systems(system_id),
  year INTEGER NOT NULL,

  total_citations INTEGER,
  yoy_change_pct NUMERIC(6,4),
  avg_citations_per_facility NUMERIC(8,4),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(state, system_id, year)
);

CREATE INDEX IF NOT EXISTS idx_state_trends_state ON state_survey_trends(state);

-- Peer Group Statistics (for peer comparison)
CREATE TABLE IF NOT EXISTS peer_group_stats (
  id SERIAL PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  bed_bucket VARCHAR(20) NOT NULL, -- 'small', 'medium', 'large'
  system_id INTEGER NOT NULL REFERENCES clinical_systems(system_id),
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  facility_count INTEGER,
  avg_citations_3yr NUMERIC(8,4),
  median_citations_3yr NUMERIC(8,4),
  p75_citations_3yr NUMERIC(8,4),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(state, bed_bucket, system_id, calculated_at)
);

CREATE INDEX IF NOT EXISTS idx_peer_stats_lookup ON peer_group_stats(state, bed_bucket, system_id);

-- Scorecard Alignment Reference (maps systems to audit items)
CREATE TABLE IF NOT EXISTS scorecard_alignment (
  id SERIAL PRIMARY KEY,
  system_id INTEGER NOT NULL REFERENCES clinical_systems(system_id),
  audit_item_number INTEGER NOT NULL,
  audit_item_description TEXT NOT NULL,
  priority VARCHAR(20), -- 'High', 'Medium', 'Low'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(system_id, audit_item_number)
);

-- Sample scorecard alignment data
INSERT INTO scorecard_alignment (system_id, audit_item_number, audit_item_description, priority) VALUES
  -- Infection Control (System 5)
  (5, 4, 'Glucometer cleaning observation', 'High'),
  (5, 5, 'Vital sign equipment cleaning', 'High'),
  (5, 6, 'PPE compliance observation', 'High'),
  (5, 8, 'Hand hygiene observation', 'High'),
  (5, 10, 'Isolation precautions', 'Medium'),

  -- Accidents/Falls (System 2)
  (2, 12, 'Fall risk assessment documentation', 'High'),
  (2, 13, 'Call light response time', 'High'),
  (2, 14, 'Bed/chair alarm compliance', 'Medium'),
  (2, 15, 'Wheelchair positioning safety', 'Medium'),

  -- Skin (System 3)
  (3, 20, 'Pressure ulcer risk assessment', 'High'),
  (3, 21, 'Turning/repositioning documentation', 'High'),
  (3, 22, 'Wound care supply availability', 'Medium'),

  -- Med Management (System 4)
  (4, 30, 'Medication administration observation', 'High'),
  (4, 31, 'Narcotic count accuracy', 'High'),
  (4, 32, 'PRN medication follow-up', 'Medium'),
  (4, 35, 'Weight monitoring compliance', 'High'),
  (4, 36, 'Meal intake documentation', 'Medium'),

  -- Change of Condition (System 1)
  (1, 40, 'Vital signs notification protocol', 'High'),
  (1, 41, 'Physician notification documentation', 'High'),
  (1, 42, 'Care plan update timeliness', 'Medium'),

  -- Transfer/Discharge (System 6)
  (6, 50, 'Discharge summary completeness', 'High'),
  (6, 51, 'Medication reconciliation at transfer', 'High'),

  -- Abuse/Grievances (System 7)
  (7, 60, 'Grievance log review', 'High'),
  (7, 61, 'Abuse reporting protocol compliance', 'High'),
  (7, 62, 'Restraint reduction program review', 'Medium')
ON CONFLICT (system_id, audit_item_number) DO NOTHING;
