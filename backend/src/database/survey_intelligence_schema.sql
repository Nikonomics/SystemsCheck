-- ============================================================
-- SURVEY INTELLIGENCE SCHEMA
-- Complete schema for Survey Intelligence system
-- ============================================================

-- Drop existing tables if they exist (for clean rebuild)
DROP TABLE IF EXISTS survey_intelligence_recommendations CASCADE;
DROP TABLE IF EXISTS survey_intelligence_focus_areas CASCADE;
DROP TABLE IF EXISTS survey_intelligence_history CASCADE;
DROP TABLE IF EXISTS survey_intelligence CASCADE;

-- ============================================================
-- CORE INTELLIGENCE RESULTS
-- ============================================================
CREATE TABLE survey_intelligence (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES facilities(id),
    federal_provider_number VARCHAR(10),

    -- Survey Risk Score (0-100)
    survey_risk_score INTEGER,
    survey_risk_tier VARCHAR(20), -- Critical, High, Moderate, Low
    survey_risk_lagging_component INTEGER,
    survey_risk_leading_component INTEGER,

    -- Capacity Strain / Operational Context
    resource_score DECIMAL(5,2),
    capacity_strain DECIMAL(5,2),
    quadrant VARCHAR(20), -- High Performing, Comfortable, Overextended, Struggling

    -- Individual Operational Metrics
    turnover_rate DECIMAL(5,2),
    turnover_status VARCHAR(20), -- CRITICAL, WARNING, TARGET, EXCELLENT
    rn_skill_mix DECIMAL(5,4),
    rn_skill_mix_status VARCHAR(20),
    rn_hours DECIMAL(5,2),
    rn_hours_status VARCHAR(20),
    weekend_gap DECIMAL(5,4),
    weekend_gap_status VARCHAR(20),
    occupancy_rate DECIMAL(5,4),
    occupancy_status VARCHAR(20),

    -- Alert Flags (stored as JSONB array)
    -- Each flag: {name, severity, impact, message}
    alert_flags JSONB DEFAULT '[]',

    -- Chain Context
    chain_name VARCHAR(255),
    chain_facility_count INTEGER,
    chain_avg_qm DECIMAL(3,2),
    chain_rank VARCHAR(20), -- "42 of 350"
    chain_percentile INTEGER,
    facility_vs_chain DECIMAL(3,2),
    vs_chain_status VARCHAR(20), -- ABOVE_PEERS, AT_PEERS, BELOW_PEERS

    -- Gap Analysis (External vs Internal)
    audit_score INTEGER, -- from scorecards
    gap_status VARCHAR(20), -- CONFIRMED_RISK, VALIDATE, HIDDEN_RISK, GOOD_SHAPE
    gap_insight TEXT,

    -- Timestamps
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cms_data_as_of DATE,

    UNIQUE(facility_id)
);

-- ============================================================
-- FOCUS AREAS (7 Clinical Systems)
-- ============================================================
CREATE TABLE survey_intelligence_focus_areas (
    id SERIAL PRIMARY KEY,
    survey_intelligence_id INTEGER REFERENCES survey_intelligence(id) ON DELETE CASCADE,
    system_id INTEGER, -- 1-7 matching clinical_systems
    system_name VARCHAR(100),
    system_score INTEGER, -- 0-100
    rank INTEGER, -- 1-7 priority rank

    -- Evidence breakdown
    citation_score INTEGER,
    qm_score INTEGER,
    qm_trend_score INTEGER,
    peer_score INTEGER,
    state_trend_score INTEGER,

    -- Top F-tags for this system
    top_ftags JSONB, -- [{tag, description, count, severity}]

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================
CREATE TABLE survey_intelligence_recommendations (
    id SERIAL PRIMARY KEY,
    survey_intelligence_id INTEGER REFERENCES survey_intelligence(id) ON DELETE CASCADE,
    priority INTEGER, -- 1 = highest
    area VARCHAR(100), -- Turnover, RN Skill Mix, RN Hours, Focus Area, etc.
    current_value VARCHAR(50),
    target_value VARCHAR(50),
    impact VARCHAR(255),
    action TEXT,
    evidence TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- HISTORY FOR TRENDING
-- ============================================================
CREATE TABLE survey_intelligence_history (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES facilities(id),
    snapshot_date DATE,
    snapshot_type VARCHAR(20), -- 'monthly', 'survey', 'qm_update'

    -- Snapshot of key metrics
    survey_risk_score INTEGER,
    survey_risk_tier VARCHAR(20),
    resource_score DECIMAL(5,2),
    capacity_strain DECIMAL(5,2),
    quadrant VARCHAR(20),

    -- Individual metrics at time of snapshot
    turnover_rate DECIMAL(5,2),
    rn_skill_mix DECIMAL(5,4),
    rn_hours DECIMAL(5,2),
    occupancy_rate DECIMAL(5,4),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(facility_id, snapshot_date, snapshot_type)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_survey_intel_facility ON survey_intelligence(facility_id);
CREATE INDEX idx_survey_intel_fpn ON survey_intelligence(federal_provider_number);
CREATE INDEX idx_survey_intel_risk ON survey_intelligence(survey_risk_score DESC);
CREATE INDEX idx_survey_intel_quadrant ON survey_intelligence(quadrant);
CREATE INDEX idx_survey_intel_tier ON survey_intelligence(survey_risk_tier);
CREATE INDEX idx_survey_intel_chain ON survey_intelligence(chain_name);

CREATE INDEX idx_focus_areas_intel ON survey_intelligence_focus_areas(survey_intelligence_id);
CREATE INDEX idx_focus_areas_rank ON survey_intelligence_focus_areas(rank);

CREATE INDEX idx_recommendations_intel ON survey_intelligence_recommendations(survey_intelligence_id);
CREATE INDEX idx_recommendations_priority ON survey_intelligence_recommendations(priority);

CREATE INDEX idx_history_facility ON survey_intelligence_history(facility_id);
CREATE INDEX idx_history_date ON survey_intelligence_history(snapshot_date DESC);
CREATE INDEX idx_history_facility_date ON survey_intelligence_history(facility_id, snapshot_date DESC);

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- High-risk facilities view
CREATE OR REPLACE VIEW survey_intelligence_high_risk AS
SELECT
    si.*,
    f.facility_name,
    t.name as team_name
FROM survey_intelligence si
JOIN facilities f ON si.facility_id = f.id
LEFT JOIN teams t ON f.team_id = t.id
WHERE si.survey_risk_tier IN ('Critical', 'High')
   OR si.quadrant IN ('Struggling', 'Overextended')
ORDER BY si.survey_risk_score DESC;

-- Team summary view
CREATE OR REPLACE VIEW survey_intelligence_team_summary AS
SELECT
    t.id as team_id,
    t.name as team_name,
    COUNT(*) as facility_count,
    AVG(si.survey_risk_score)::INTEGER as avg_risk_score,
    COUNT(*) FILTER (WHERE si.survey_risk_tier = 'Critical') as critical_count,
    COUNT(*) FILTER (WHERE si.survey_risk_tier = 'High') as high_count,
    COUNT(*) FILTER (WHERE si.survey_risk_tier = 'Moderate') as moderate_count,
    COUNT(*) FILTER (WHERE si.survey_risk_tier = 'Low') as low_count,
    COUNT(*) FILTER (WHERE si.quadrant = 'Struggling') as struggling_count,
    COUNT(*) FILTER (WHERE si.quadrant = 'Overextended') as overextended_count,
    COUNT(*) FILTER (WHERE si.quadrant = 'Comfortable') as comfortable_count,
    COUNT(*) FILTER (WHERE si.quadrant = 'High Performing') as high_performing_count
FROM teams t
LEFT JOIN facilities f ON f.team_id = t.id
LEFT JOIN survey_intelligence si ON si.facility_id = f.id
GROUP BY t.id, t.name;

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================
COMMENT ON TABLE survey_intelligence IS 'Core Survey Intelligence scores and metrics for each facility';
COMMENT ON COLUMN survey_intelligence.survey_risk_score IS 'Combined risk score 0-100: (Lagging × 0.70) + (Leading × 0.30)';
COMMENT ON COLUMN survey_intelligence.resource_score IS 'Resource adequacy score 0-100 based on staffing, QM, RN hours, turnover';
COMMENT ON COLUMN survey_intelligence.capacity_strain IS 'Occupancy × (100 - Resource Score) / 100 - measures demand vs capacity mismatch';
COMMENT ON COLUMN survey_intelligence.quadrant IS 'Classification: High Performing, Comfortable, Overextended, Struggling';
COMMENT ON COLUMN survey_intelligence.alert_flags IS 'JSONB array of risk flags: DOUBLE_TROUBLE, DEATH_SPIRAL_RISK, WEEKEND_VULNERABILITY, ABUSE_HISTORY';
COMMENT ON COLUMN survey_intelligence.gap_status IS 'External vs Internal alignment: CONFIRMED_RISK, VALIDATE, HIDDEN_RISK, GOOD_SHAPE';

COMMENT ON TABLE survey_intelligence_focus_areas IS '7 clinical system focus areas with scores and priority ranking';
COMMENT ON TABLE survey_intelligence_recommendations IS 'Prioritized actionable recommendations based on operational metrics';
COMMENT ON TABLE survey_intelligence_history IS 'Historical snapshots for trending analysis';
