-- ============================================================================
-- FOCUS AREAS CALCULATIONS
-- ============================================================================
-- Comprehensive SQL to calculate all focus area metrics for facilities
-- Run against: snf_market_data database (MARKET_DATABASE_URL)
-- ============================================================================

-- This file contains the complete calculation logic.
-- Use individual CTEs or wrap in functions as needed.

-- ============================================================================
-- PART 1: CITATION PATTERN METRICS
-- ============================================================================

-- 1.1 Survey-level aggregations with system mapping
WITH survey_system_deficiencies AS (
  SELECT
    d.federal_provider_number,
    d.survey_date,
    d.is_standard_deficiency,
    -- Map F-tag to system (use inline CASE for now, or join to mapping table)
    CASE
      WHEN d.deficiency_tag IN ('0580','0684','0685','0656','0657','0636','0637','0641','0655','0638','0658','0552','0698','0697','0699','0725','0726','0727','0730','0732','0835','0838','0851','0865','0867','0868','0770','0947') THEN 1
      WHEN d.deficiency_tag IN ('0689','0688','0676','0677','0700','0584','0919','0921','0912','0908','0925','0791','0678','0694') THEN 2
      WHEN d.deficiency_tag IN ('0686','0687','0690','0695') THEN 3
      WHEN d.deficiency_tag IN ('0755','0756','0757','0758','0759','0760','0761','0692','0693','0740','0744','0554','0812','0803','0804','0805','0806','0809','0801','0802','0814') THEN 4
      WHEN d.deficiency_tag IN ('0880','0881','0882','0883','0884','0885','0886','0887','0888') THEN 5
      WHEN d.deficiency_tag IN ('0622','0623','0624','0625','0626','0627','0660','0661','0849') THEN 6
      WHEN d.deficiency_tag IN ('0600','0602','0603','0604','0605','0606','0607','0608','0609','0610','0585','0550','0557','0558','0561','0565','0577','0578','0582','0583','0842','0644','0645','0679','0745') THEN 7
      ELSE NULL
    END as system_id,
    d.deficiency_tag,
    d.scope_severity,
    -- Severity weights
    CASE
      WHEN d.scope_severity IN ('J','K','L') THEN 10  -- IJ
      WHEN d.scope_severity IN ('G','H','I') THEN 5   -- Actual Harm
      WHEN d.scope_severity IN ('D','E','F') THEN 2   -- Potential Harm
      ELSE 1                                           -- No Harm
    END as severity_weight,
    -- Severity numeric for averaging
    CASE
      WHEN d.scope_severity = 'A' THEN 1
      WHEN d.scope_severity = 'B' THEN 2
      WHEN d.scope_severity = 'C' THEN 3
      WHEN d.scope_severity = 'D' THEN 4
      WHEN d.scope_severity = 'E' THEN 5
      WHEN d.scope_severity = 'F' THEN 6
      WHEN d.scope_severity = 'G' THEN 7
      WHEN d.scope_severity = 'H' THEN 8
      WHEN d.scope_severity = 'I' THEN 9
      WHEN d.scope_severity = 'J' THEN 10
      WHEN d.scope_severity = 'K' THEN 11
      WHEN d.scope_severity = 'L' THEN 12
      ELSE 0
    END as severity_numeric
  FROM cms_facility_deficiencies d
  WHERE d.survey_date >= CURRENT_DATE - INTERVAL '3 years'
),

-- 1.2 Standard surveys with deficiency counts
standard_surveys AS (
  SELECT
    federal_provider_number,
    survey_date,
    COUNT(*) as total_deficiencies,
    SUM(severity_weight) as severity_weighted_total,
    AVG(severity_numeric) as avg_severity,
    BOOL_OR(scope_severity IN ('J','K','L')) as had_ij,
    MAX(severity_numeric) as max_severity,
    ROW_NUMBER() OVER (PARTITION BY federal_provider_number ORDER BY survey_date DESC) as survey_rank
  FROM survey_system_deficiencies
  WHERE is_standard_deficiency = true
  GROUP BY federal_provider_number, survey_date
),

-- 1.3 Citation velocity calculation
citation_velocity AS (
  SELECT
    federal_provider_number,
    MAX(CASE WHEN survey_rank = 1 THEN total_deficiencies END) as current_deficiencies,
    MAX(CASE WHEN survey_rank = 2 THEN total_deficiencies END) as prev_deficiencies,
    MAX(CASE WHEN survey_rank = 3 THEN total_deficiencies END) as prev2_deficiencies,
    MAX(CASE WHEN survey_rank = 1 THEN avg_severity END) as current_avg_severity,
    MAX(CASE WHEN survey_rank = 2 THEN avg_severity END) as prev_avg_severity,
    MAX(CASE WHEN survey_rank = 1 THEN survey_date END) as last_survey_date,
    MAX(CASE WHEN survey_rank = 1 AND had_ij THEN survey_date END) as last_ij_date
  FROM standard_surveys
  WHERE survey_rank <= 3
  GROUP BY federal_provider_number
),

-- 1.4 Repeat F-tags (cited in consecutive surveys)
ftag_by_survey AS (
  SELECT
    federal_provider_number,
    survey_date,
    deficiency_tag,
    ROW_NUMBER() OVER (PARTITION BY federal_provider_number ORDER BY survey_date DESC) as survey_rank
  FROM survey_system_deficiencies
  WHERE is_standard_deficiency = true
  GROUP BY federal_provider_number, survey_date, deficiency_tag
),

repeat_ftags AS (
  SELECT
    a.federal_provider_number,
    COUNT(DISTINCT a.deficiency_tag) as current_ftag_count,
    COUNT(DISTINCT CASE WHEN b.deficiency_tag IS NOT NULL THEN a.deficiency_tag END) as repeat_ftag_count,
    ARRAY_AGG(DISTINCT a.deficiency_tag) FILTER (WHERE b.deficiency_tag IS NOT NULL) as repeat_ftag_list
  FROM ftag_by_survey a
  LEFT JOIN ftag_by_survey b ON a.federal_provider_number = b.federal_provider_number
    AND a.deficiency_tag = b.deficiency_tag
    AND a.survey_rank = 1
    AND b.survey_rank = 2
  WHERE a.survey_rank = 1
  GROUP BY a.federal_provider_number
),

-- 1.5 System concentration (what % of deficiencies in top system)
system_concentration AS (
  SELECT
    federal_provider_number,
    MAX(system_pct) as top_system_concentration,
    MAX(CASE WHEN system_rank = 1 THEN system_id END) as top_system_id
  FROM (
    SELECT
      federal_provider_number,
      system_id,
      COUNT(*)::FLOAT / SUM(COUNT(*)) OVER (PARTITION BY federal_provider_number) as system_pct,
      ROW_NUMBER() OVER (PARTITION BY federal_provider_number ORDER BY COUNT(*) DESC) as system_rank
    FROM survey_system_deficiencies
    WHERE is_standard_deficiency = true
      AND survey_date >= CURRENT_DATE - INTERVAL '3 years'
      AND system_id IS NOT NULL
    GROUP BY federal_provider_number, system_id
  ) sub
  GROUP BY federal_provider_number
),

-- 1.6 Combined citation metrics
facility_citation_metrics_calc AS (
  SELECT
    cv.federal_provider_number,
    cv.current_deficiencies,
    cv.prev_deficiencies,
    cv.prev2_deficiencies,
    cv.current_avg_severity,
    cv.prev_avg_severity,
    cv.last_survey_date,
    cv.last_ij_date,
    CURRENT_DATE - cv.last_survey_date as days_since_last_survey,
    CASE
      WHEN cv.last_ij_date IS NOT NULL THEN CURRENT_DATE - cv.last_ij_date
      ELSE NULL
    END as days_since_last_ij,
    (CURRENT_DATE - cv.last_survey_date) > 456 as survey_overdue, -- ~15 months
    -- Citation velocity
    CASE
      WHEN cv.current_deficiencies < COALESCE(cv.prev_deficiencies, cv.current_deficiencies) THEN 'improving'
      WHEN cv.current_deficiencies > COALESCE(cv.prev_deficiencies, cv.current_deficiencies) THEN 'worsening'
      ELSE 'stable'
    END as citation_velocity,
    -- Severity trend
    CASE
      WHEN cv.current_avg_severity < COALESCE(cv.prev_avg_severity, cv.current_avg_severity) - 0.5 THEN 'improving'
      WHEN cv.current_avg_severity > COALESCE(cv.prev_avg_severity, cv.current_avg_severity) + 0.5 THEN 'worsening'
      ELSE 'stable'
    END as severity_trend,
    -- Repeat F-tags
    COALESCE(rf.repeat_ftag_count::FLOAT / NULLIF(rf.current_ftag_count, 0), 0) as repeat_ftag_rate,
    rf.repeat_ftag_list,
    -- System concentration
    COALESCE(sc.top_system_concentration, 0) as top_system_concentration,
    sc.top_system_id
  FROM citation_velocity cv
  LEFT JOIN repeat_ftags rf ON cv.federal_provider_number = rf.federal_provider_number
  LEFT JOIN system_concentration sc ON cv.federal_provider_number = sc.federal_provider_number
)

-- Output for facility_citation_metrics table
SELECT * FROM facility_citation_metrics_calc;


-- ============================================================================
-- PART 2: SYSTEM-LEVEL CITATION ANALYSIS
-- ============================================================================

-- 2.1 Citations by system per facility (3 year rolling)
WITH system_citations AS (
  SELECT
    d.federal_provider_number,
    CASE
      WHEN d.deficiency_tag IN ('0580','0684','0685','0656','0657','0636','0637','0641','0655','0638','0658','0552','0698','0697','0699','0725','0726','0727','0730','0732','0835','0838','0851','0865','0867','0868','0770','0947') THEN 1
      WHEN d.deficiency_tag IN ('0689','0688','0676','0677','0700','0584','0919','0921','0912','0908','0925','0791','0678','0694') THEN 2
      WHEN d.deficiency_tag IN ('0686','0687','0690','0695') THEN 3
      WHEN d.deficiency_tag IN ('0755','0756','0757','0758','0759','0760','0761','0692','0693','0740','0744','0554','0812','0803','0804','0805','0806','0809','0801','0802','0814') THEN 4
      WHEN d.deficiency_tag IN ('0880','0881','0882','0883','0884','0885','0886','0887','0888') THEN 5
      WHEN d.deficiency_tag IN ('0622','0623','0624','0625','0626','0627','0660','0661','0849') THEN 6
      WHEN d.deficiency_tag IN ('0600','0602','0603','0604','0605','0606','0607','0608','0609','0610','0585','0550','0557','0558','0561','0565','0577','0578','0582','0583','0842','0644','0645','0679','0745') THEN 7
      ELSE NULL
    END as system_id,
    COUNT(*) as citation_count,
    SUM(CASE
      WHEN d.scope_severity IN ('J','K','L') THEN 10
      WHEN d.scope_severity IN ('G','H','I') THEN 5
      WHEN d.scope_severity IN ('D','E','F') THEN 2
      ELSE 1
    END) as severity_weighted_count,
    MAX(d.survey_date) as last_cited_date,
    ARRAY_AGG(DISTINCT d.deficiency_tag) as ftags_cited
  FROM cms_facility_deficiencies d
  WHERE d.survey_date >= CURRENT_DATE - INTERVAL '3 years'
    AND d.is_standard_deficiency = true
  GROUP BY d.federal_provider_number,
    CASE
      WHEN d.deficiency_tag IN ('0580','0684','0685','0656','0657','0636','0637','0641','0655','0638','0658','0552','0698','0697','0699','0725','0726','0727','0730','0732','0835','0838','0851','0865','0867','0868','0770','0947') THEN 1
      WHEN d.deficiency_tag IN ('0689','0688','0676','0677','0700','0584','0919','0921','0912','0908','0925','0791','0678','0694') THEN 2
      WHEN d.deficiency_tag IN ('0686','0687','0690','0695') THEN 3
      WHEN d.deficiency_tag IN ('0755','0756','0757','0758','0759','0760','0761','0692','0693','0740','0744','0554','0812','0803','0804','0805','0806','0809','0801','0802','0814') THEN 4
      WHEN d.deficiency_tag IN ('0880','0881','0882','0883','0884','0885','0886','0887','0888') THEN 5
      WHEN d.deficiency_tag IN ('0622','0623','0624','0625','0626','0627','0660','0661','0849') THEN 6
      WHEN d.deficiency_tag IN ('0600','0602','0603','0604','0605','0606','0607','0608','0609','0610','0585','0550','0557','0558','0561','0565','0577','0578','0582','0583','0842','0644','0645','0679','0745') THEN 7
      ELSE NULL
    END
),

-- 2.2 Calculate max values for normalization
system_max_values AS (
  SELECT
    MAX(citation_count) as max_citations,
    MAX(severity_weighted_count) as max_severity_weighted
  FROM system_citations
),

-- 2.3 Normalize citation factor to 0-100
system_citation_factor AS (
  SELECT
    sc.federal_provider_number,
    sc.system_id,
    sc.citation_count,
    sc.severity_weighted_count,
    sc.last_cited_date,
    sc.ftags_cited,
    -- Citation factor score (0-100)
    LEAST(100, (sc.severity_weighted_count::FLOAT / NULLIF(mv.max_severity_weighted, 0)) * 100) as citation_factor_score
  FROM system_citations sc
  CROSS JOIN system_max_values mv
  WHERE sc.system_id IS NOT NULL
)

SELECT * FROM system_citation_factor;


-- ============================================================================
-- PART 3: PEER COMPARISON
-- ============================================================================

-- 3.1 Bed size buckets
WITH facility_bed_buckets AS (
  SELECT
    federal_provider_number,
    state,
    certified_beds,
    CASE
      WHEN certified_beds < 60 THEN 'small'
      WHEN certified_beds < 120 THEN 'medium'
      ELSE 'large'
    END as bed_bucket
  FROM snf_facilities
),

-- 3.2 Peer group statistics by system
peer_stats AS (
  SELECT
    fb.state,
    fb.bed_bucket,
    sc.system_id,
    COUNT(DISTINCT fb.federal_provider_number) as facility_count,
    AVG(sc.citation_count) as avg_citations,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sc.citation_count) as median_citations,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY sc.citation_count) as p75_citations
  FROM facility_bed_buckets fb
  LEFT JOIN system_citation_factor sc ON fb.federal_provider_number = sc.federal_provider_number
  WHERE sc.system_id IS NOT NULL
  GROUP BY fb.state, fb.bed_bucket, sc.system_id
),

-- 3.3 Calculate peer factor for each facility-system
peer_factor AS (
  SELECT
    sc.federal_provider_number,
    sc.system_id,
    ps.avg_citations as peer_avg_citations,
    ps.facility_count as peer_group_size,
    -- Peer factor score (0-100): higher if above peer average
    CASE
      WHEN ps.avg_citations = 0 THEN 50
      ELSE LEAST(100, GREATEST(0, 50 + (sc.citation_count - ps.avg_citations) / GREATEST(ps.avg_citations, 1) * 50))
    END as peer_factor_score
  FROM system_citation_factor sc
  JOIN facility_bed_buckets fb ON sc.federal_provider_number = fb.federal_provider_number
  JOIN peer_stats ps ON fb.state = ps.state
    AND fb.bed_bucket = ps.bed_bucket
    AND sc.system_id = ps.system_id
)

SELECT * FROM peer_factor;


-- ============================================================================
-- PART 4: STATE SURVEY TRENDS
-- ============================================================================

WITH state_system_citations_by_year AS (
  SELECT
    f.state,
    EXTRACT(YEAR FROM d.survey_date) as survey_year,
    CASE
      WHEN d.deficiency_tag IN ('0580','0684','0685','0656','0657','0636','0637','0641','0655','0638','0658','0552','0698','0697','0699','0725','0726','0727','0730','0732','0835','0838','0851','0865','0867','0868','0770','0947') THEN 1
      WHEN d.deficiency_tag IN ('0689','0688','0676','0677','0700','0584','0919','0921','0912','0908','0925','0791','0678','0694') THEN 2
      WHEN d.deficiency_tag IN ('0686','0687','0690','0695') THEN 3
      WHEN d.deficiency_tag IN ('0755','0756','0757','0758','0759','0760','0761','0692','0693','0740','0744','0554','0812','0803','0804','0805','0806','0809','0801','0802','0814') THEN 4
      WHEN d.deficiency_tag IN ('0880','0881','0882','0883','0884','0885','0886','0887','0888') THEN 5
      WHEN d.deficiency_tag IN ('0622','0623','0624','0625','0626','0627','0660','0661','0849') THEN 6
      WHEN d.deficiency_tag IN ('0600','0602','0603','0604','0605','0606','0607','0608','0609','0610','0585','0550','0557','0558','0561','0565','0577','0578','0582','0583','0842','0644','0645','0679','0745') THEN 7
      ELSE NULL
    END as system_id,
    COUNT(*) as citation_count,
    COUNT(DISTINCT d.federal_provider_number) as facilities_surveyed
  FROM cms_facility_deficiencies d
  JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
  WHERE d.is_standard_deficiency = true
    AND d.survey_date >= CURRENT_DATE - INTERVAL '3 years'
  GROUP BY f.state, EXTRACT(YEAR FROM d.survey_date),
    CASE
      WHEN d.deficiency_tag IN ('0580','0684','0685','0656','0657','0636','0637','0641','0655','0638','0658','0552','0698','0697','0699','0725','0726','0727','0730','0732','0835','0838','0851','0865','0867','0868','0770','0947') THEN 1
      WHEN d.deficiency_tag IN ('0689','0688','0676','0677','0700','0584','0919','0921','0912','0908','0925','0791','0678','0694') THEN 2
      WHEN d.deficiency_tag IN ('0686','0687','0690','0695') THEN 3
      WHEN d.deficiency_tag IN ('0755','0756','0757','0758','0759','0760','0761','0692','0693','0740','0744','0554','0812','0803','0804','0805','0806','0809','0801','0802','0814') THEN 4
      WHEN d.deficiency_tag IN ('0880','0881','0882','0883','0884','0885','0886','0887','0888') THEN 5
      WHEN d.deficiency_tag IN ('0622','0623','0624','0625','0626','0627','0660','0661','0849') THEN 6
      WHEN d.deficiency_tag IN ('0600','0602','0603','0604','0605','0606','0607','0608','0609','0610','0585','0550','0557','0558','0561','0565','0577','0578','0582','0583','0842','0644','0645','0679','0745') THEN 7
      ELSE NULL
    END
),

state_yoy_change AS (
  SELECT
    state,
    system_id,
    survey_year,
    citation_count,
    LAG(citation_count) OVER (PARTITION BY state, system_id ORDER BY survey_year) as prev_year_citations,
    (citation_count - LAG(citation_count) OVER (PARTITION BY state, system_id ORDER BY survey_year))::FLOAT /
      NULLIF(LAG(citation_count) OVER (PARTITION BY state, system_id ORDER BY survey_year), 0) as yoy_change_pct
  FROM state_system_citations_by_year
  WHERE system_id IS NOT NULL
),

-- State factor: elevated if state is cracking down on this system
state_factor AS (
  SELECT
    state,
    system_id,
    -- State factor score (0-100): higher if state citations increasing
    CASE
      WHEN yoy_change_pct IS NULL THEN 50
      WHEN yoy_change_pct > 0.20 THEN 80  -- >20% increase
      WHEN yoy_change_pct > 0.10 THEN 70  -- >10% increase
      WHEN yoy_change_pct > 0 THEN 60     -- Any increase
      WHEN yoy_change_pct > -0.10 THEN 50 -- Stable
      ELSE 40                              -- Decreasing
    END as state_factor_score,
    yoy_change_pct
  FROM state_yoy_change
  WHERE survey_year = EXTRACT(YEAR FROM CURRENT_DATE)
)

SELECT * FROM state_factor;


-- ============================================================================
-- PART 5: COMBINED SYSTEM RISK SCORE
-- ============================================================================

WITH all_factors AS (
  SELECT
    scf.federal_provider_number,
    scf.system_id,
    scf.citation_count as citation_count_3yr,
    scf.severity_weighted_count,
    scf.citation_factor_score,
    COALESCE(pf.peer_factor_score, 50) as peer_factor_score,
    COALESCE(sf.state_factor_score, 50) as state_factor_score,
    -- QM factor (placeholder - would need to join to QM data)
    50 as qm_factor_score,
    50 as qm_trend_score
  FROM system_citation_factor scf
  LEFT JOIN peer_factor pf ON scf.federal_provider_number = pf.federal_provider_number
    AND scf.system_id = pf.system_id
  LEFT JOIN snf_facilities f ON scf.federal_provider_number = f.federal_provider_number
  LEFT JOIN state_factor sf ON f.state = sf.state AND scf.system_id = sf.system_id
),

-- Final system risk score calculation
system_risk_scores AS (
  SELECT
    federal_provider_number,
    system_id,
    citation_count_3yr,
    severity_weighted_count,
    citation_factor_score,
    qm_factor_score,
    qm_trend_score,
    peer_factor_score,
    state_factor_score,
    -- Weighted system risk score
    -- Weights: Citation 40%, QM 25%, QM Trend 15%, Peer 10%, State 10%
    ROUND(
      (citation_factor_score * 0.40) +
      (qm_factor_score * 0.25) +
      (qm_trend_score * 0.15) +
      (peer_factor_score * 0.10) +
      (state_factor_score * 0.10)
    , 2) as system_risk_score
  FROM all_factors
)

SELECT * FROM system_risk_scores
ORDER BY federal_provider_number, system_risk_score DESC;


-- ============================================================================
-- PART 6: FULL FOCUS AREAS QUERY FOR ONE FACILITY
-- ============================================================================
-- Example: Get focus areas for a specific facility
-- Replace :fpn with actual federal_provider_number

-- WITH facility_param AS (SELECT '105001' as fpn)

-- [The complete query would join all the above CTEs and format as JSON]
-- See focus_areas_api.js for the final query implementation
