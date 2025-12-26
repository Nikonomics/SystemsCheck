/**
 * CMS Data API Routes
 *
 * Provides endpoints for accessing CMS facility data from the shared market database.
 * Used by the SystemsCheck Facility Detail page CMS tabs.
 *
 * Database: market_database (MARKET_DATABASE_URL) - read-only access
 */

const express = require('express');
const router = express.Router();
const { getMarketPool, getSNFalyzePool } = require('../config/marketDatabase');

// ============================================================================
// FACILITY SEARCH
// ============================================================================

/**
 * GET /api/cms/snf/search
 * Search SNF facilities with filters
 */
router.get('/snf/search', async (req, res) => {
  try {
    const {
      name, state, city, minBeds, maxBeds,
      minRating, maxRating, limit = 50, offset = 0
    } = req.query;

    const pool = getMarketPool();
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (name) {
      whereClause += ` AND facility_name ILIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }
    if (state) {
      whereClause += ` AND state = $${paramIndex}`;
      params.push(state.toUpperCase());
      paramIndex++;
    }
    if (city) {
      whereClause += ` AND city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }
    if (minBeds) {
      whereClause += ` AND certified_beds >= $${paramIndex}`;
      params.push(parseInt(minBeds));
      paramIndex++;
    }
    if (maxBeds) {
      whereClause += ` AND certified_beds <= $${paramIndex}`;
      params.push(parseInt(maxBeds));
      paramIndex++;
    }
    if (minRating) {
      whereClause += ` AND overall_rating >= $${paramIndex}`;
      params.push(parseInt(minRating));
      paramIndex++;
    }
    if (maxRating) {
      whereClause += ` AND overall_rating <= $${paramIndex}`;
      params.push(parseInt(maxRating));
      paramIndex++;
    }

    const exactMatchParam = name ? `${name}%` : '%';
    const facilitiesResult = await pool.query(`
      SELECT
        federal_provider_number as ccn,
        facility_name as provider_name,
        address, city, state, zip_code,
        overall_rating, health_inspection_rating,
        quality_measure_rating as quality_rating, staffing_rating,
        certified_beds, average_residents_per_day as residents_total,
        latitude, longitude, ownership_type, chain_name
      FROM snf_facilities
      WHERE ${whereClause}
      ORDER BY
        CASE WHEN facility_name ILIKE $${paramIndex} THEN 0 ELSE 1 END,
        facility_name
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `, [...params, exactMatchParam, parseInt(limit), parseInt(offset)]);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM snf_facilities WHERE ${whereClause}
    `, params);

    res.json({
      success: true,
      total: parseInt(countResult.rows[0].total),
      facilities: facilitiesResult.rows
    });

  } catch (error) {
    console.error('[CMS API] Error searching facilities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// FACILITY PROFILE
// ============================================================================

/**
 * GET /api/cms/snf/:ccn
 * Get comprehensive profile for a skilled nursing facility
 */
router.get('/snf/:ccn', async (req, res) => {
  try {
    const { ccn } = req.params;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get facility data from snf_facilities
    const facilityResult = await pool.query(`
      SELECT
        federal_provider_number as ccn,
        facility_name as provider_name,
        address, city, state, zip_code, county,
        phone as phone_number,
        overall_rating,
        health_inspection_rating,
        quality_measure_rating as qm_rating,
        quality_measure_rating as quality_rating,
        staffing_rating,
        certified_beds,
        total_beds,
        occupied_beds,
        occupancy_rate,
        average_residents_per_day,
        ownership_type,
        chain_name,
        parent_organization,
        latitude,
        longitude,
        in_hospital,
        continuing_care_retirement_community as ccrc,
        special_focus_facility as sff_status,
        abuse_icon,
        cms_processing_date as processing_date,
        -- Staffing data
        reported_cna_staffing_hours as reported_na_hrs,
        lpn_staffing_hours as reported_lpn_hrs,
        rn_staffing_hours as reported_rn_hrs,
        licensed_staffing_hours as reported_licensed_hrs,
        total_nurse_staffing_hours as reported_total_nurse_hrs,
        pt_staffing_hours as reported_pt_hrs,
        -- Turnover
        total_nursing_turnover,
        rn_turnover,
        admin_departures as administrator_departures,
        -- Deficiencies
        health_deficiencies as cycle1_total_health_deficiencies,
        fire_safety_deficiencies as total_fire_deficiencies,
        complaint_deficiencies,
        -- Fines
        total_fines_amount as fine_total_dollars,
        total_penalties_amount,
        penalty_count,
        facility_reported_incidents,
        substantiated_complaints,
        infection_control_citations
      FROM snf_facilities
      WHERE federal_provider_number = $1
      LIMIT 1
    `, [ccn]);

    if (facilityResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Facility not found'
      });
    }

    const facility = facilityResult.rows[0];

    // Get deficiencies
    const deficienciesResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity,
        deficiency_text,
        correction_date,
        is_corrected
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
      ORDER BY survey_date DESC
      LIMIT 100
    `, [ccn]);

    // Get VBP scores history
    const vbpResult = await pool.query(`
      SELECT
        fiscal_year,
        performance_score,
        incentive_payment_multiplier,
        baseline_readmission_rate,
        performance_readmission_rate,
        achievement_score,
        improvement_score
      FROM vbp_scores
      WHERE ccn = $1
      ORDER BY fiscal_year DESC
    `, [ccn]);

    // Get survey dates from deficiencies table
    const surveyResult = await pool.query(`
      SELECT DISTINCT survey_date, survey_type
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
      ORDER BY survey_date DESC
      LIMIT 10
    `, [ccn]);

    // Calculate occupancy
    const beds = parseInt(facility.certified_beds) || 1;
    const residents = parseInt(facility.average_residents_per_day) || 0;
    facility.occupancy_rate = facility.occupancy_rate || Math.round((residents / beds) * 100);

    // Get historical snapshots from SNFalyze database (has trends data from 2020-present)
    let snapshots = [];
    const snfalyzePool = getSNFalyzePool();

    if (snfalyzePool) {
      try {
        const snapshotsResult = await snfalyzePool.query(`
          SELECT
            e.extract_date,
            fs.overall_rating,
            fs.qm_rating,
            fs.staffing_rating,
            fs.health_inspection_rating,
            fs.reported_total_nurse_hrs,
            fs.reported_rn_hrs,
            fs.reported_lpn_hrs,
            fs.reported_na_hrs,
            fs.total_nursing_turnover,
            fs.rn_turnover,
            fs.cycle1_total_health_deficiencies,
            fs.certified_beds,
            fs.average_residents_per_day as average_residents,
            CASE
              WHEN fs.certified_beds > 0
              THEN ROUND((fs.average_residents_per_day::numeric / fs.certified_beds::numeric) * 100)
              ELSE NULL
            END as occupancy_rate
          FROM facility_snapshots fs
          JOIN cms_extracts e ON fs.extract_id = e.extract_id
          WHERE fs.ccn = $1
          ORDER BY e.extract_date ASC
        `, [ccn]);

        snapshots = snapshotsResult.rows;
        console.log(`[CMS API] Found ${snapshots.length} historical snapshots for CCN ${ccn}`);
      } catch (err) {
        console.error('[CMS API] Error fetching historical snapshots:', err.message);
      }
    }

    // Fallback: If no historical data, create single snapshot from current data
    if (snapshots.length === 0) {
      snapshots = [{
        extract_date: facility.processing_date || new Date().toISOString(),
        overall_rating: facility.overall_rating,
        qm_rating: facility.qm_rating,
        staffing_rating: facility.staffing_rating,
        health_inspection_rating: facility.health_inspection_rating,
        reported_total_nurse_hrs: facility.reported_total_nurse_hrs,
        reported_rn_hrs: facility.reported_rn_hrs,
        reported_lpn_hrs: facility.reported_lpn_hrs,
        reported_na_hrs: facility.reported_na_hrs,
        total_nursing_turnover: facility.total_nursing_turnover,
        rn_turnover: facility.rn_turnover,
        occupancy_rate: facility.occupancy_rate,
        cycle1_total_health_deficiencies: facility.cycle1_total_health_deficiencies,
        total_fire_deficiencies: facility.total_fire_deficiencies,
      }];
    }

    // Attach snapshots to facility for frontend
    facility.snapshots = snapshots;

    // Fetch benchmarks (national, state, market averages)
    const [nationalResult, stateResult, marketResult] = await Promise.all([
      pool.query(`
        SELECT
          AVG(overall_rating) as avg_overall_rating,
          AVG(quality_measure_rating) as avg_quality_rating,
          AVG(staffing_rating) as avg_staffing_rating,
          AVG(health_inspection_rating) as avg_inspection_rating,
          AVG(total_nurse_staffing_hours) as avg_total_nursing_hprd,
          AVG(rn_staffing_hours) as avg_rn_hprd,
          AVG(lpn_staffing_hours) as avg_lpn_hprd,
          AVG(reported_cna_staffing_hours) as avg_cna_hprd,
          AVG(rn_turnover) as avg_rn_turnover,
          AVG(total_nursing_turnover) as avg_total_turnover,
          AVG(health_deficiencies) as avg_deficiencies,
          AVG(occupancy_rate) as avg_occupancy,
          COUNT(*) as facility_count
        FROM snf_facilities
      `),
      pool.query(`
        SELECT
          AVG(overall_rating) as avg_overall_rating,
          AVG(quality_measure_rating) as avg_quality_rating,
          AVG(staffing_rating) as avg_staffing_rating,
          AVG(health_inspection_rating) as avg_inspection_rating,
          AVG(total_nurse_staffing_hours) as avg_total_nursing_hprd,
          AVG(rn_staffing_hours) as avg_rn_hprd,
          AVG(lpn_staffing_hours) as avg_lpn_hprd,
          AVG(reported_cna_staffing_hours) as avg_cna_hprd,
          AVG(rn_turnover) as avg_rn_turnover,
          AVG(total_nursing_turnover) as avg_total_turnover,
          AVG(health_deficiencies) as avg_deficiencies,
          AVG(occupancy_rate) as avg_occupancy,
          COUNT(*) as facility_count
        FROM snf_facilities
        WHERE state = $1
      `, [facility.state]),
      pool.query(`
        SELECT
          AVG(overall_rating) as avg_overall_rating,
          AVG(quality_measure_rating) as avg_quality_rating,
          AVG(staffing_rating) as avg_staffing_rating,
          AVG(health_inspection_rating) as avg_inspection_rating,
          AVG(total_nurse_staffing_hours) as avg_total_nursing_hprd,
          AVG(rn_staffing_hours) as avg_rn_hprd,
          AVG(lpn_staffing_hours) as avg_lpn_hprd,
          AVG(reported_cna_staffing_hours) as avg_cna_hprd,
          AVG(rn_turnover) as avg_rn_turnover,
          AVG(total_nursing_turnover) as avg_total_turnover,
          AVG(health_deficiencies) as avg_deficiencies,
          AVG(occupancy_rate) as avg_occupancy,
          COUNT(*) as facility_count
        FROM snf_facilities
        WHERE state = $1 AND county = $2
      `, [facility.state, facility.county])
    ]);

    const benchmarks = {
      national: nationalResult.rows[0],
      state: stateResult.rows[0],
      market: marketResult.rows[0]
    };

    res.json({
      success: true,
      facility,
      healthCitations: deficienciesResult.rows,
      vbpScores: vbpResult.rows,
      surveyDates: surveyResult.rows,
      snapshots,
      benchmarks
    });

  } catch (error) {
    console.error('[CMS API] Error getting facility profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// COMPETITORS
// ============================================================================

/**
 * GET /api/cms/snf/:ccn/competitors
 * Get nearby competing facilities
 */
router.get('/snf/:ccn/competitors', async (req, res) => {
  try {
    const { ccn } = req.params;
    const { radiusMiles = 25, limit = 20 } = req.query;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get the target facility's location
    const facilityResult = await pool.query(`
      SELECT latitude, longitude, certified_beds
      FROM snf_facilities
      WHERE federal_provider_number = $1
      LIMIT 1
    `, [ccn]);

    const facility = facilityResult.rows[0];
    if (!facility || !facility.latitude || !facility.longitude) {
      return res.json({ success: true, competitors: [] });
    }

    // Find nearby facilities using Haversine formula
    const competitorsResult = await pool.query(`
      SELECT
        federal_provider_number as ccn,
        facility_name,
        city,
        state,
        overall_rating,
        health_inspection_rating,
        staffing_rating,
        certified_beds as number_of_certified_beds,
        average_residents_per_day as number_of_residents_in_certified_beds,
        latitude,
        longitude,
        (3959 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance_miles
      FROM snf_facilities
      WHERE federal_provider_number != $3
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (3959 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) <= $4
      ORDER BY distance_miles
      LIMIT $5
    `, [
      parseFloat(facility.latitude),
      parseFloat(facility.longitude),
      ccn,
      parseInt(radiusMiles),
      parseInt(limit)
    ]);

    res.json({
      success: true,
      competitors: competitorsResult.rows
    });

  } catch (error) {
    console.error('[CMS API] Error getting competitors:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// BENCHMARKS
// ============================================================================

/**
 * GET /api/cms/snf/:ccn/benchmarks
 * Get market (county), state, and national benchmark averages
 */
router.get('/snf/:ccn/benchmarks', async (req, res) => {
  try {
    const { ccn } = req.params;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get facility's state and county
    const facilityResult = await pool.query(`
      SELECT state, county
      FROM snf_facilities
      WHERE federal_provider_number = $1
      LIMIT 1
    `, [ccn]);

    if (facilityResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    const { state, county } = facilityResult.rows[0];

    // Get national averages
    const nationalResult = await pool.query(`
      SELECT
        AVG(overall_rating) as avg_overall_rating,
        AVG(quality_measure_rating) as avg_quality_rating,
        AVG(staffing_rating) as avg_staffing_rating,
        AVG(health_inspection_rating) as avg_inspection_rating,
        AVG(total_nurse_staffing_hours) as avg_total_nursing_hprd,
        AVG(rn_staffing_hours) as avg_rn_hprd,
        AVG(lpn_staffing_hours) as avg_lpn_hprd,
        AVG(reported_cna_staffing_hours) as avg_cna_hprd,
        AVG(rn_turnover) as avg_rn_turnover,
        AVG(total_nursing_turnover) as avg_total_turnover,
        AVG(health_deficiencies) as avg_deficiencies,
        AVG(occupancy_rate) as avg_occupancy,
        COUNT(*) as facility_count
      FROM snf_facilities
    `);

    // Get state averages
    const stateResult = await pool.query(`
      SELECT
        AVG(overall_rating) as avg_overall_rating,
        AVG(quality_measure_rating) as avg_quality_rating,
        AVG(staffing_rating) as avg_staffing_rating,
        AVG(health_inspection_rating) as avg_inspection_rating,
        AVG(total_nurse_staffing_hours) as avg_total_nursing_hprd,
        AVG(rn_staffing_hours) as avg_rn_hprd,
        AVG(lpn_staffing_hours) as avg_lpn_hprd,
        AVG(reported_cna_staffing_hours) as avg_cna_hprd,
        AVG(rn_turnover) as avg_rn_turnover,
        AVG(total_nursing_turnover) as avg_total_turnover,
        AVG(health_deficiencies) as avg_deficiencies,
        AVG(occupancy_rate) as avg_occupancy,
        COUNT(*) as facility_count
      FROM snf_facilities
      WHERE state = $1
    `, [state]);

    // Get market (county) averages
    const marketResult = await pool.query(`
      SELECT
        AVG(overall_rating) as avg_overall_rating,
        AVG(quality_measure_rating) as avg_quality_rating,
        AVG(staffing_rating) as avg_staffing_rating,
        AVG(health_inspection_rating) as avg_inspection_rating,
        AVG(total_nurse_staffing_hours) as avg_total_nursing_hprd,
        AVG(rn_staffing_hours) as avg_rn_hprd,
        AVG(lpn_staffing_hours) as avg_lpn_hprd,
        AVG(reported_cna_staffing_hours) as avg_cna_hprd,
        AVG(rn_turnover) as avg_rn_turnover,
        AVG(total_nursing_turnover) as avg_total_turnover,
        AVG(health_deficiencies) as avg_deficiencies,
        AVG(occupancy_rate) as avg_occupancy,
        COUNT(*) as facility_count
      FROM snf_facilities
      WHERE state = $1 AND county = $2
    `, [state, county]);

    res.json({
      success: true,
      facility: { state, county },
      benchmarks: {
        national: nationalResult.rows[0],
        state: stateResult.rows[0],
        market: marketResult.rows[0]
      }
    });

  } catch (error) {
    console.error('[CMS API] Error fetching benchmarks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DEFICIENCIES
// ============================================================================

/**
 * GET /api/cms/snf/:ccn/deficiencies
 * Get detailed deficiency records
 */
router.get('/snf/:ccn/deficiencies', async (req, res) => {
  try {
    const { ccn } = req.params;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    const result = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        deficiency_tag,
        scope_severity,
        deficiency_text,
        correction_date,
        is_corrected
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
      ORDER BY survey_date DESC
      LIMIT 100
    `, [ccn]);

    res.json({ success: true, deficiencies: result.rows });
  } catch (error) {
    console.error('[CMS API] Error fetching deficiencies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// VBP (VALUE-BASED PURCHASING)
// ============================================================================

/**
 * GET /api/cms/snf/:ccn/vbp
 * Get comprehensive VBP data for a facility
 */
router.get('/snf/:ccn/vbp', async (req, res) => {
  try {
    const { ccn } = req.params;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get current year detailed data from snf_vbp_performance
    const currentResult = await pool.query(`
      SELECT
        fiscal_year,
        performance_score,
        incentive_payment_multiplier,
        incentive_percentage,
        baseline_readmission_rate,
        performance_readmission_rate,
        readmission_achievement_score,
        readmission_improvement_score,
        readmission_measure_score,
        baseline_hai_rate,
        performance_hai_rate,
        hai_achievement_score,
        hai_improvement_score,
        hai_measure_score,
        baseline_turnover_rate,
        performance_turnover_rate,
        turnover_achievement_score,
        turnover_improvement_score,
        turnover_measure_score,
        baseline_staffing_hours,
        performance_staffing_hours,
        staffing_achievement_score,
        staffing_improvement_score,
        staffing_measure_score
      FROM snf_vbp_performance
      WHERE cms_certification_number = $1
      ORDER BY fiscal_year DESC
      LIMIT 1
    `, [ccn]);

    // Get historical data from vbp_scores
    const historyResult = await pool.query(`
      SELECT
        fiscal_year,
        performance_score,
        incentive_payment_multiplier,
        baseline_readmission_rate,
        baseline_period,
        performance_readmission_rate,
        performance_period,
        achievement_score,
        improvement_score,
        vbp_ranking
      FROM vbp_scores
      WHERE ccn = $1
      ORDER BY fiscal_year DESC
    `, [ccn]);

    // Get rankings from facility_vbp_rankings
    const rankingsResult = await pool.query(`
      SELECT
        fiscal_year,
        national_rank, national_total, national_percentile,
        state_rank, state_total, state_percentile,
        market_rank, market_total, market_percentile,
        chain_rank, chain_total, chain_percentile
      FROM facility_vbp_rankings
      WHERE federal_provider_number = $1
      ORDER BY fiscal_year DESC
      LIMIT 1
    `, [ccn]);

    // Get facility info for dollar impact calculation
    const facilityResult = await pool.query(`
      SELECT certified_beds, state, county
      FROM snf_facilities
      WHERE federal_provider_number = $1
      LIMIT 1
    `, [ccn]);

    // Build current year response
    let current = null;
    if (currentResult.rows && currentResult.rows.length > 0) {
      const c = currentResult.rows[0];
      current = {
        fiscal_year: c.fiscal_year,
        performance_score: parseFloat(c.performance_score) || null,
        incentive_multiplier: parseFloat(c.incentive_payment_multiplier) || null,
        incentive_percentage: parseFloat(c.incentive_percentage) || null,
        measures: {
          readmission: {
            baseline_rate: parseFloat(c.baseline_readmission_rate) || null,
            performance_rate: parseFloat(c.performance_readmission_rate) || null,
            achievement_score: parseFloat(c.readmission_achievement_score) || null,
            improvement_score: parseFloat(c.readmission_improvement_score) || null,
            measure_score: parseFloat(c.readmission_measure_score) || null
          },
          hai: {
            baseline_rate: parseFloat(c.baseline_hai_rate) || null,
            performance_rate: parseFloat(c.performance_hai_rate) || null,
            achievement_score: parseFloat(c.hai_achievement_score) || null,
            improvement_score: parseFloat(c.hai_improvement_score) || null,
            measure_score: parseFloat(c.hai_measure_score) || null
          },
          turnover: {
            baseline_rate: parseFloat(c.baseline_turnover_rate) || null,
            performance_rate: parseFloat(c.performance_turnover_rate) || null,
            achievement_score: parseFloat(c.turnover_achievement_score) || null,
            improvement_score: parseFloat(c.turnover_improvement_score) || null,
            measure_score: parseFloat(c.turnover_measure_score) || null
          },
          staffing: {
            baseline_hours: parseFloat(c.baseline_staffing_hours) || null,
            performance_hours: parseFloat(c.performance_staffing_hours) || null,
            achievement_score: parseFloat(c.staffing_achievement_score) || null,
            improvement_score: parseFloat(c.staffing_improvement_score) || null,
            measure_score: parseFloat(c.staffing_measure_score) || null
          }
        }
      };
    }

    // Build history response
    const history = (historyResult.rows || []).map(h => ({
      fiscal_year: h.fiscal_year,
      performance_score: parseFloat(h.performance_score) || null,
      incentive_multiplier: parseFloat(h.incentive_payment_multiplier) || null,
      baseline_readmission_rate: parseFloat(h.baseline_readmission_rate) || null,
      baseline_period: h.baseline_period,
      performance_readmission_rate: parseFloat(h.performance_readmission_rate) || null,
      performance_period: h.performance_period,
      achievement_score: parseFloat(h.achievement_score) || null,
      improvement_score: parseFloat(h.improvement_score) || null,
      vbp_ranking: h.vbp_ranking
    }));

    // Build rankings response
    let rankings = null;
    if (rankingsResult.rows && rankingsResult.rows.length > 0) {
      const r = rankingsResult.rows[0];
      rankings = {
        fiscal_year: r.fiscal_year,
        national: {
          rank: r.national_rank,
          total: r.national_total,
          percentile: parseFloat(r.national_percentile) || null
        },
        state: {
          rank: r.state_rank,
          total: r.state_total,
          percentile: parseFloat(r.state_percentile) || null
        },
        market: {
          rank: r.market_rank,
          total: r.market_total,
          percentile: parseFloat(r.market_percentile) || null
        },
        chain: {
          rank: r.chain_rank,
          total: r.chain_total,
          percentile: parseFloat(r.chain_percentile) || null
        }
      };
    }

    // Calculate estimated dollar impact
    let estimated_impact = null;
    const certifiedBeds = facilityResult.rows && facilityResult.rows.length > 0
      ? parseInt(facilityResult.rows[0].certified_beds)
      : null;
    const multiplier = current?.incentive_multiplier || (history.length > 0 ? history[0].incentive_multiplier : null);

    if (certifiedBeds && multiplier) {
      const estimatedMedicareRevenue = certifiedBeds * 365 * 0.30 * 500;
      const dollarImpact = estimatedMedicareRevenue * (multiplier - 1);
      const targetMultiplier = 1.02;
      const improvementPotential = multiplier < targetMultiplier
        ? estimatedMedicareRevenue * (targetMultiplier - multiplier)
        : 0;

      estimated_impact = {
        certified_beds: certifiedBeds,
        estimated_medicare_revenue: Math.round(estimatedMedicareRevenue),
        current_multiplier: multiplier,
        dollar_impact: Math.round(dollarImpact),
        target_multiplier: targetMultiplier,
        improvement_potential: Math.round(improvementPotential)
      };
    }

    res.json({
      success: true,
      data: {
        current,
        history,
        rankings,
        estimated_impact
      }
    });

  } catch (error) {
    console.error('[CMS API] Error fetching VBP data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// VBP RANKINGS
// ============================================================================

/**
 * GET /api/cms/snf/:ccn/vbp-rankings
 * Get VBP rankings for a facility
 */
router.get('/snf/:ccn/vbp-rankings', async (req, res) => {
  try {
    const { ccn } = req.params;
    const { year } = req.query;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    let query;
    let params;

    if (year) {
      query = `
        SELECT *
        FROM facility_vbp_rankings
        WHERE federal_provider_number = $1
          AND fiscal_year = $2
      `;
      params = [ccn, parseInt(year)];
    } else {
      query = `
        SELECT *
        FROM facility_vbp_rankings
        WHERE federal_provider_number = $1
        ORDER BY fiscal_year DESC
        LIMIT 1
      `;
      params = [ccn];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        rankings: null,
        message: 'No VBP rankings found for this facility'
      });
    }

    const r = result.rows[0];
    const rankings = {
      fiscal_year: r.fiscal_year,
      national: {
        rank: r.national_rank,
        total: r.national_total,
        percentile: parseFloat(r.national_percentile)
      },
      state: r.state_rank ? {
        rank: r.state_rank,
        total: r.state_total,
        percentile: parseFloat(r.state_percentile)
      } : null,
      market: r.market_rank ? {
        rank: r.market_rank,
        total: r.market_total,
        percentile: parseFloat(r.market_percentile)
      } : null,
      chain: r.chain_rank ? {
        rank: r.chain_rank,
        total: r.chain_total,
        percentile: parseFloat(r.chain_percentile)
      } : null
    };

    res.json({ success: true, rankings });
  } catch (error) {
    console.error('[CMS API] Error fetching VBP rankings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PERCENTILES
// ============================================================================

/**
 * GET /api/cms/snf/:ccn/percentiles
 * Get percentile rankings compared to peers
 */
router.get('/snf/:ccn/percentiles', async (req, res) => {
  try {
    const { ccn } = req.params;
    const { scope = 'national', state: filterState, size } = req.query;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get the facility's current data
    const facilityResult = await pool.query(`
      SELECT *
      FROM snf_facilities
      WHERE federal_provider_number = $1
      LIMIT 1
    `, [ccn]);

    if (facilityResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    const facility = facilityResult.rows[0];

    // Build WHERE clause based on peer group filters
    let whereClause = 'WHERE 1=1';
    const params = [ccn];
    let paramIndex = 2;

    if (scope === 'state' || filterState) {
      whereClause += ` AND state = $${paramIndex}`;
      params.push(filterState || facility.state);
      paramIndex++;
    }

    if (size) {
      if (size === 'small') {
        whereClause += ' AND certified_beds < 60';
      } else if (size === 'medium') {
        whereClause += ' AND certified_beds >= 60 AND certified_beds <= 120';
      } else if (size === 'large') {
        whereClause += ' AND certified_beds > 120';
      }
    }

    // Get total count for peer group
    const countResult = await pool.query(`
      SELECT COUNT(*) as facility_count FROM snf_facilities ${whereClause}
    `, params.slice(1));
    const facilityCount = parseInt(countResult.rows[0].facility_count);

    // Calculate percentiles for key metrics
    const metrics = [
      { key: 'overall_rating', field: 'overall_rating', higherIsBetter: true },
      { key: 'quality_rating', field: 'quality_measure_rating', higherIsBetter: true },
      { key: 'staffing_rating', field: 'staffing_rating', higherIsBetter: true },
      { key: 'inspection_rating', field: 'health_inspection_rating', higherIsBetter: true },
      { key: 'total_nursing_hprd', field: 'reported_total_nurse_staffing_hours_per_resident_per_day', higherIsBetter: true },
      { key: 'rn_hprd', field: 'reported_rn_staffing_hours_per_resident_per_day', higherIsBetter: true },
      { key: 'rn_turnover', field: 'registered_nurse_turnover', higherIsBetter: false },
      { key: 'deficiency_count', field: 'total_number_of_health_deficiencies', higherIsBetter: false }
    ];

    const percentiles = {};

    for (const metric of metrics) {
      const facilityValue = parseFloat(facility[metric.field]) || 0;

      let countQuery;
      if (metric.higherIsBetter) {
        countQuery = `
          SELECT COUNT(*) as count FROM snf_facilities
          ${whereClause}
          AND ${metric.field} < $1
        `;
      } else {
        countQuery = `
          SELECT COUNT(*) as count FROM snf_facilities
          ${whereClause}
          AND ${metric.field} > $1
        `;
      }

      const result = await pool.query(countQuery, [facilityValue, ...params.slice(1)]);
      const betterThan = parseInt(result.rows[0].count);
      const percentile = facilityCount > 0 ? Math.round((betterThan / facilityCount) * 100) : 0;

      percentiles[metric.key] = {
        value: Math.round(facilityValue * 100) / 100,
        percentile,
        better_than: betterThan
      };
    }

    // Add occupancy percentile
    const beds = parseFloat(facility.certified_beds) || 1;
    const residents = parseFloat(facility.average_residents_per_day) || 0;
    const occupancy = (residents / beds) * 100;

    const occupancyResult = await pool.query(`
      SELECT COUNT(*) as count FROM snf_facilities
      ${whereClause}
      AND certified_beds > 0
      AND (average_residents_per_day::float / certified_beds * 100) < $1
    `, [occupancy, ...params.slice(1)]);

    percentiles.occupancy = {
      value: Math.round(occupancy * 100) / 100,
      percentile: facilityCount > 0 ? Math.round((parseInt(occupancyResult.rows[0].count) / facilityCount) * 100) : 0,
      better_than: parseInt(occupancyResult.rows[0].count)
    };

    res.json({
      success: true,
      facility: {
        ccn: facility.federal_provider_number,
        name: facility.facility_name,
        state: facility.state
      },
      percentiles,
      peer_group: {
        scope: scope,
        state: filterState || (scope === 'state' ? facility.state : null),
        size: size || null,
        facility_count: facilityCount
      }
    });

  } catch (error) {
    console.error('[CMS API] Error fetching percentiles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
