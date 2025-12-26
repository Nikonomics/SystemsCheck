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

    // Get fire safety deficiency count (for compliance score calculation)
    const fireDeficiencyResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM fire_safety_citations
      WHERE ccn = $1
    `, [ccn]);
    facility.total_fire_deficiencies = parseInt(fireDeficiencyResult.rows[0]?.count || 0);

    // Get historical snapshots from SNFalyze database (has trends data from 2020-present)
    // IMPORTANT: Use the LATEST snapshot for current data since snf_facilities may be stale
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

        // Use the LATEST snapshot data for current facility values (snf_facilities may be stale)
        if (snapshots.length > 0) {
          const latestSnapshot = snapshots[snapshots.length - 1];
          console.log(`[CMS API] Using latest snapshot from ${latestSnapshot.extract_date} for current data`);

          // Overlay latest snapshot values onto facility data
          if (latestSnapshot.overall_rating != null) facility.overall_rating = latestSnapshot.overall_rating;
          if (latestSnapshot.qm_rating != null) facility.qm_rating = latestSnapshot.qm_rating;
          if (latestSnapshot.qm_rating != null) facility.quality_rating = latestSnapshot.qm_rating;
          if (latestSnapshot.staffing_rating != null) facility.staffing_rating = latestSnapshot.staffing_rating;
          if (latestSnapshot.health_inspection_rating != null) facility.health_inspection_rating = latestSnapshot.health_inspection_rating;
          if (latestSnapshot.reported_total_nurse_hrs != null) facility.reported_total_nurse_hrs = latestSnapshot.reported_total_nurse_hrs;
          if (latestSnapshot.reported_rn_hrs != null) facility.reported_rn_hrs = latestSnapshot.reported_rn_hrs;
          if (latestSnapshot.reported_lpn_hrs != null) facility.reported_lpn_hrs = latestSnapshot.reported_lpn_hrs;
          if (latestSnapshot.reported_na_hrs != null) facility.reported_na_hrs = latestSnapshot.reported_na_hrs;
          if (latestSnapshot.total_nursing_turnover != null) facility.total_nursing_turnover = latestSnapshot.total_nursing_turnover;
          if (latestSnapshot.rn_turnover != null) facility.rn_turnover = latestSnapshot.rn_turnover;
          if (latestSnapshot.cycle1_total_health_deficiencies != null) facility.cycle1_total_health_deficiencies = latestSnapshot.cycle1_total_health_deficiencies;
          if (latestSnapshot.certified_beds != null) facility.certified_beds = latestSnapshot.certified_beds;
          if (latestSnapshot.average_residents != null) facility.average_residents_per_day = latestSnapshot.average_residents;
          if (latestSnapshot.occupancy_rate != null) facility.occupancy_rate = latestSnapshot.occupancy_rate;

          // Add extract date to facility response so frontend knows data freshness
          facility.cms_extract_date = latestSnapshot.extract_date;
        }
      } catch (err) {
        console.error('[CMS API] Error fetching historical snapshots:', err.message);
      }
    }

    // Calculate occupancy if not set from snapshots
    if (!facility.occupancy_rate) {
      const beds = parseInt(facility.certified_beds) || 1;
      const residents = parseInt(facility.average_residents_per_day) || 0;
      facility.occupancy_rate = Math.round((residents / beds) * 100);
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

    // Get penalty events from facility_events table
    let penaltyEvents = [];
    try {
      const penaltyResult = await pool.query(`
        SELECT
          event_date,
          new_value as amount,
          previous_value,
          change_magnitude
        FROM facility_events
        WHERE ccn = $1 AND event_type = 'PENALTY_ISSUED'
        ORDER BY event_date ASC
      `, [ccn]);
      penaltyEvents = penaltyResult.rows.map(row => ({
        date: row.event_date,
        amount: parseFloat(row.amount) || 0,
      }));
      console.log(`[CMS API] Found ${penaltyEvents.length} penalty events for CCN ${ccn}`);
    } catch (err) {
      console.error('[CMS API] Error fetching penalty events:', err.message);
    }

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
      penaltyEvents,
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

    // Get latest snapshot data to overlay on stale snf_facilities values
    const snfalyzePool = getSNFalyzePool();
    if (snfalyzePool) {
      try {
        const latestSnapshotResult = await snfalyzePool.query(`
          SELECT
            fs.overall_rating,
            fs.qm_rating,
            fs.staffing_rating,
            fs.health_inspection_rating,
            fs.reported_total_nurse_hrs,
            fs.reported_rn_hrs,
            fs.rn_turnover,
            fs.total_nursing_turnover,
            fs.cycle1_total_health_deficiencies as health_deficiencies,
            CASE
              WHEN fs.certified_beds > 0
              THEN ROUND((fs.average_residents_per_day::numeric / fs.certified_beds::numeric) * 100)
              ELSE NULL
            END as occupancy_rate
          FROM facility_snapshots fs
          JOIN cms_extracts e ON fs.extract_id = e.extract_id
          WHERE fs.ccn = $1
          ORDER BY e.extract_date DESC
          LIMIT 1
        `, [ccn]);

        if (latestSnapshotResult.rows.length > 0) {
          const snapshot = latestSnapshotResult.rows[0];
          // Overlay latest snapshot values onto facility (snf_facilities may be stale)
          if (snapshot.overall_rating != null) facility.overall_rating = snapshot.overall_rating;
          if (snapshot.qm_rating != null) facility.quality_measure_rating = snapshot.qm_rating;
          if (snapshot.staffing_rating != null) facility.staffing_rating = snapshot.staffing_rating;
          if (snapshot.health_inspection_rating != null) facility.health_inspection_rating = snapshot.health_inspection_rating;
          if (snapshot.reported_total_nurse_hrs != null) facility.total_nurse_staffing_hours = parseFloat(snapshot.reported_total_nurse_hrs);
          if (snapshot.reported_rn_hrs != null) facility.rn_staffing_hours = parseFloat(snapshot.reported_rn_hrs);
          if (snapshot.rn_turnover != null) facility.rn_turnover = parseFloat(snapshot.rn_turnover);
          if (snapshot.health_deficiencies != null) facility.health_deficiencies = snapshot.health_deficiencies;
          if (snapshot.occupancy_rate != null) facility.occupancy_rate = parseFloat(snapshot.occupancy_rate);
        }
      } catch (err) {
        console.error('[CMS API] Error fetching latest snapshot for percentiles:', err.message);
      }
    }

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
      { key: 'total_nursing_hprd', field: 'total_nurse_staffing_hours', higherIsBetter: true },
      { key: 'rn_hprd', field: 'rn_staffing_hours', higherIsBetter: true },
      { key: 'rn_turnover', field: 'rn_turnover', higherIsBetter: false },
      { key: 'deficiency_count', field: 'health_deficiencies', higherIsBetter: false }
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

    // Add occupancy percentile - use occupancy_rate directly instead of calculating
    const occupancy = parseFloat(facility.occupancy_rate) || 0;

    const occupancyResult = await pool.query(`
      SELECT COUNT(*) as count FROM snf_facilities
      ${whereClause}
      AND occupancy_rate IS NOT NULL
      AND occupancy_rate::float < $1
    `, [occupancy, ...params.slice(1)]);

    percentiles.occupancy = {
      value: Math.round(occupancy * 100) / 100,
      percentile: facilityCount > 0 ? Math.round((parseInt(occupancyResult.rows[0].count) / facilityCount) * 100) : 0,
      better_than: parseInt(occupancyResult.rows[0].count)
    };

    // Add RN turnover percentile - now snf_facilities has rn_turnover data after sync
    const rnTurnover = parseFloat(facility.rn_turnover) || 0;
    if (rnTurnover > 0) {
      // Count facilities with HIGHER turnover (lower is better)
      const rnTurnoverResult = await pool.query(`
        SELECT COUNT(*) as count FROM snf_facilities
        ${whereClause}
        AND rn_turnover IS NOT NULL
        AND rn_turnover::float > $1
      `, [rnTurnover, ...params.slice(1)]);

      // Use total facility count (not just those with data) for percentile calculation
      // This matches SNFalyze's methodology
      percentiles.rn_turnover = {
        value: Math.round(rnTurnover * 100) / 100,
        percentile: facilityCount > 0 ? Math.round((parseInt(rnTurnoverResult.rows[0].count) / facilityCount) * 100) : 0,
        better_than: parseInt(rnTurnoverResult.rows[0].count)
      };
    }

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

// ============================================================================
// SURVEY ANALYTICS
// ============================================================================

/**
 * GET /api/cms/snf/:ccn/surveys
 * Get survey history with both health and fire safety surveys
 */
router.get('/snf/:ccn/surveys', async (req, res) => {
  try {
    const { ccn } = req.params;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get health surveys from cms_facility_deficiencies
    const healthSurveysResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        COUNT(*) as deficiency_count,
        MAX(scope_severity) as max_severity,
        'health' as survey_category
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
      GROUP BY survey_date, survey_type
      ORDER BY survey_date DESC
    `, [ccn]);

    // Get fire safety surveys from fire_safety_citations
    const fireSurveysResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        inspection_cycle as cycle,
        COUNT(*) as deficiency_count,
        MAX(scope_severity_code) as max_severity,
        'fire_safety' as survey_category
      FROM fire_safety_citations
      WHERE ccn = $1
      GROUP BY survey_date, survey_type, inspection_cycle
      ORDER BY survey_date DESC
    `, [ccn]);

    // Combine and sort all surveys
    const allSurveys = [
      ...healthSurveysResult.rows.map(s => ({
        surveyDate: s.survey_date,
        surveyType: s.survey_type,
        category: 'health',
        cycle: null,
        totalDeficiencies: parseInt(s.deficiency_count),
        maxSeverity: s.max_severity
      })),
      ...fireSurveysResult.rows.map(s => ({
        surveyDate: s.survey_date,
        surveyType: s.survey_type,
        category: 'fire_safety',
        cycle: s.cycle,
        totalDeficiencies: parseInt(s.deficiency_count),
        maxSeverity: s.max_severity
      }))
    ].sort((a, b) => new Date(b.surveyDate) - new Date(a.surveyDate));

    res.json({
      success: true,
      surveys: allSurveys,
      summary: {
        totalHealthSurveys: healthSurveysResult.rows.length,
        totalFireSafetySurveys: fireSurveysResult.rows.length,
        lastHealthSurvey: healthSurveysResult.rows[0]?.survey_date || null,
        lastFireSafetySurvey: fireSurveysResult.rows[0]?.survey_date || null
      }
    });

  } catch (error) {
    console.error('[CMS API] Error fetching surveys:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cms/snf/:ccn/deficiency-analysis
 * Get aggregated deficiency analysis with category, severity, and trend breakdowns
 */
router.get('/snf/:ccn/deficiency-analysis', async (req, res) => {
  try {
    const { ccn } = req.params;
    const { startDate, endDate, surveyType } = req.query;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Build WHERE clause with filters
    let whereClause = 'WHERE d.federal_provider_number = $1';
    const params = [ccn];
    let paramIndex = 2;

    if (startDate) {
      whereClause += ` AND d.survey_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      whereClause += ` AND d.survey_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    if (surveyType) {
      whereClause += ` AND d.survey_type = $${paramIndex}`;
      params.push(surveyType);
      paramIndex++;
    }

    // Get deficiencies by category (using citation_descriptions)
    const byCategoryResult = await pool.query(`
      SELECT
        COALESCE(c.category, 'Unknown') as category,
        COUNT(*) as count
      FROM cms_facility_deficiencies d
      LEFT JOIN citation_descriptions c ON d.deficiency_tag = c.deficiency_tag
      ${whereClause}
      GROUP BY c.category
      ORDER BY count DESC
    `, params);

    // Get deficiencies by severity
    const bySeverityResult = await pool.query(`
      SELECT
        scope_severity,
        COUNT(*) as count
      FROM cms_facility_deficiencies d
      ${whereClause}
      GROUP BY scope_severity
      ORDER BY scope_severity
    `, params);

    // Get deficiencies by year for trending
    const byYearResult = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM survey_date) as year,
        COUNT(*) as count
      FROM cms_facility_deficiencies d
      ${whereClause}
      GROUP BY EXTRACT(YEAR FROM survey_date)
      ORDER BY year DESC
    `, params);

    // Get top F-tags with descriptions
    const topTagsResult = await pool.query(`
      SELECT
        d.deficiency_tag,
        COALESCE(c.category, 'Unknown') as category,
        COALESCE(c.description, d.deficiency_text) as description,
        COUNT(*) as count,
        MAX(d.scope_severity) as max_severity
      FROM cms_facility_deficiencies d
      LEFT JOIN citation_descriptions c ON d.deficiency_tag = c.deficiency_tag
      ${whereClause}
      GROUP BY d.deficiency_tag, c.category, c.description, d.deficiency_text
      ORDER BY count DESC
      LIMIT 10
    `, params);

    // Get total count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM cms_facility_deficiencies d
      ${whereClause}
    `, params);

    res.json({
      success: true,
      analysis: {
        totalDeficiencies: parseInt(totalResult.rows[0].total),
        byCategory: byCategoryResult.rows.map(r => ({
          category: r.category,
          count: parseInt(r.count)
        })),
        bySeverity: bySeverityResult.rows.map(r => ({
          severity: r.scope_severity,
          count: parseInt(r.count)
        })),
        byYear: byYearResult.rows.map(r => ({
          year: parseInt(r.year),
          count: parseInt(r.count)
        })),
        topTags: topTagsResult.rows.map(r => ({
          tag: r.deficiency_tag,
          category: r.category,
          description: r.description?.substring(0, 200) + (r.description?.length > 200 ? '...' : ''),
          count: parseInt(r.count),
          maxSeverity: r.max_severity
        }))
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        surveyType: surveyType || null
      }
    });

  } catch (error) {
    console.error('[CMS API] Error fetching deficiency analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cms/snf/:ccn/fire-safety
 * Get fire safety citations with category breakdown
 */
router.get('/snf/:ccn/fire-safety', async (req, res) => {
  try {
    const { ccn } = req.params;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get all fire safety surveys
    const surveysResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        inspection_cycle,
        COUNT(*) as deficiency_count,
        MAX(scope_severity_code) as max_severity
      FROM fire_safety_citations
      WHERE ccn = $1
      GROUP BY survey_date, survey_type, inspection_cycle
      ORDER BY survey_date DESC
    `, [ccn]);

    // Get all fire safety deficiencies
    const deficienciesResult = await pool.query(`
      SELECT
        deficiency_tag,
        deficiency_prefix,
        deficiency_category,
        deficiency_description,
        scope_severity_code,
        survey_date,
        survey_type,
        deficiency_corrected,
        correction_date,
        is_standard_deficiency,
        is_complaint_deficiency
      FROM fire_safety_citations
      WHERE ccn = $1
      ORDER BY survey_date DESC
      LIMIT 100
    `, [ccn]);

    // Get category breakdown (K-tags vs E-tags and subcategories)
    const categoryBreakdownResult = await pool.query(`
      SELECT
        deficiency_prefix,
        deficiency_category,
        COUNT(*) as count
      FROM fire_safety_citations
      WHERE ccn = $1
      GROUP BY deficiency_prefix, deficiency_category
      ORDER BY count DESC
    `, [ccn]);

    // Separate K-tags (Life Safety Code) from E-tags (Emergency Preparedness)
    const lifeSafetyDeficiencies = deficienciesResult.rows.filter(d => d.deficiency_prefix === 'K');
    const emergencyPrepDeficiencies = deficienciesResult.rows.filter(d => d.deficiency_prefix === 'E');

    const categoryBreakdown = {};
    categoryBreakdownResult.rows.forEach(r => {
      const key = r.deficiency_category || `${r.deficiency_prefix}-Other`;
      categoryBreakdown[key] = parseInt(r.count);
    });

    res.json({
      success: true,
      surveys: surveysResult.rows.map(s => ({
        date: s.survey_date,
        type: s.survey_type,
        cycle: s.inspection_cycle,
        deficiencyCount: parseInt(s.deficiency_count),
        maxSeverity: s.max_severity
      })),
      deficiencies: deficienciesResult.rows.map(d => ({
        tag: d.deficiency_tag,
        prefix: d.deficiency_prefix,
        category: d.deficiency_category,
        severity: d.scope_severity_code,
        description: d.deficiency_description,
        surveyDate: d.survey_date,
        surveyType: d.survey_type,
        corrected: d.deficiency_corrected,
        correctionDate: d.correction_date,
        isStandard: d.is_standard_deficiency,
        isComplaint: d.is_complaint_deficiency
      })),
      summary: {
        totalDeficiencies: deficienciesResult.rows.length,
        lifeSafetyCount: lifeSafetyDeficiencies.length,
        emergencyPrepCount: emergencyPrepDeficiencies.length,
        categoryBreakdown
      }
    });

  } catch (error) {
    console.error('[CMS API] Error fetching fire safety data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cms/snf/:ccn/survey-summary
 * Get combined survey overview for the Survey Analytics tab
 */
router.get('/snf/:ccn/survey-summary', async (req, res) => {
  try {
    const { ccn } = req.params;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get facility ratings and alerts from snf_facilities
    const facilityResult = await pool.query(`
      SELECT
        overall_rating,
        health_inspection_rating,
        quality_measure_rating as qm_rating,
        staffing_rating,
        abuse_icon,
        special_focus_facility as sff_status,
        has_sprinkler_system,
        health_deficiencies as cycle1_health_deficiencies,
        fire_safety_deficiencies as cycle1_fire_deficiencies,
        total_fines_amount,
        penalty_count
      FROM snf_facilities
      WHERE federal_provider_number = $1
      LIMIT 1
    `, [ccn]);

    if (facilityResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    const facility = facilityResult.rows[0];

    // Get last health survey details
    const lastHealthSurveyResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        COUNT(*) as deficiency_count,
        MAX(scope_severity) as max_severity
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
      GROUP BY survey_date, survey_type
      ORDER BY survey_date DESC
      LIMIT 1
    `, [ccn]);

    // Get last fire safety survey details
    const lastFireSurveyResult = await pool.query(`
      SELECT
        survey_date,
        survey_type,
        COUNT(*) as deficiency_count,
        MAX(scope_severity_code) as max_severity
      FROM fire_safety_citations
      WHERE ccn = $1
      GROUP BY survey_date, survey_type
      ORDER BY survey_date DESC
      LIMIT 1
    `, [ccn]);

    // Get cycle 1 deficiency counts (most recent standard survey)
    const cycle1HealthResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM cms_facility_deficiencies
      WHERE federal_provider_number = $1
        AND is_standard_deficiency = true
        AND survey_date = (
          SELECT MAX(survey_date)
          FROM cms_facility_deficiencies
          WHERE federal_provider_number = $1
            AND is_standard_deficiency = true
        )
    `, [ccn]);

    const cycle1FireResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM fire_safety_citations
      WHERE ccn = $1
        AND inspection_cycle = 1
    `, [ccn]);

    // Check for alerts
    const alerts = [];

    if (facility.abuse_icon === 'Y') {
      alerts.push({ type: 'abuse', message: 'Abuse icon present', severity: 'critical' });
    }
    if (facility.sff_status === 'Y' || facility.sff_status === 'SFF') {
      alerts.push({ type: 'sff', message: 'Special Focus Facility', severity: 'critical' });
    }
    if (facility.sff_status === 'Candidate') {
      alerts.push({ type: 'sff_candidate', message: 'SFF Candidate', severity: 'warning' });
    }

    // Check if survey is old (> 15 months)
    const lastSurveyDate = lastHealthSurveyResult.rows[0]?.survey_date;
    if (lastSurveyDate) {
      const monthsSinceSurvey = Math.floor(
        (new Date() - new Date(lastSurveyDate)) / (1000 * 60 * 60 * 24 * 30)
      );
      if (monthsSinceSurvey > 15) {
        alerts.push({
          type: 'old_survey',
          message: `Last survey was ${monthsSinceSurvey} months ago`,
          severity: 'warning'
        });
      }
    }

    if (facility.has_sprinkler_system === false || facility.has_sprinkler_system === 'No') {
      alerts.push({ type: 'sprinkler', message: 'No sprinkler system', severity: 'warning' });
    }

    res.json({
      success: true,
      summary: {
        ratings: {
          overall: facility.overall_rating,
          health: facility.health_inspection_rating,
          qm: facility.qm_rating,
          staffing: facility.staffing_rating
        },
        lastHealthSurvey: lastHealthSurveyResult.rows[0] ? {
          date: lastHealthSurveyResult.rows[0].survey_date,
          type: lastHealthSurveyResult.rows[0].survey_type,
          deficiencyCount: parseInt(lastHealthSurveyResult.rows[0].deficiency_count),
          maxSeverity: lastHealthSurveyResult.rows[0].max_severity
        } : null,
        lastFireSafetySurvey: lastFireSurveyResult.rows[0] ? {
          date: lastFireSurveyResult.rows[0].survey_date,
          type: lastFireSurveyResult.rows[0].survey_type,
          deficiencyCount: parseInt(lastFireSurveyResult.rows[0].deficiency_count),
          maxSeverity: lastFireSurveyResult.rows[0].max_severity
        } : null,
        cycle1Deficiencies: {
          health: parseInt(cycle1HealthResult.rows[0]?.count || facility.cycle1_health_deficiencies || 0),
          fireSafety: parseInt(cycle1FireResult.rows[0]?.count || facility.cycle1_fire_deficiencies || 0)
        },
        penalties: {
          totalFines: parseFloat(facility.total_fines_amount) || 0,
          penaltyCount: parseInt(facility.penalty_count) || 0
        },
        alerts
      }
    });

  } catch (error) {
    console.error('[CMS API] Error fetching survey summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/cms/snf/:ccn/quality-measures
 * Get quality measure scores with state/national comparisons
 */
router.get('/snf/:ccn/quality-measures', async (req, res) => {
  try {
    const { ccn } = req.params;
    const pool = getMarketPool();

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Market database not available'
      });
    }

    // Get facility QM data from snf_facilities
    const facilityResult = await pool.query(`
      SELECT
        federal_provider_number as ccn,
        facility_name,
        state,
        quality_measure_rating,
        long_stay_qm_rating,
        short_stay_qm_rating
      FROM snf_facilities
      WHERE federal_provider_number = $1
      LIMIT 1
    `, [ccn]);

    if (facilityResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    const facility = facilityResult.rows[0];

    // Get state averages for comparison
    const stateAvgResult = await pool.query(`
      SELECT
        AVG(quality_measure_rating) as avg_qm_rating,
        AVG(long_stay_qm_rating) as avg_long_stay_qm,
        AVG(short_stay_qm_rating) as avg_short_stay_qm,
        COUNT(*) as facility_count
      FROM snf_facilities
      WHERE state = $1
    `, [facility.state]);

    // Get national averages
    const nationalAvgResult = await pool.query(`
      SELECT
        AVG(quality_measure_rating) as avg_qm_rating,
        AVG(long_stay_qm_rating) as avg_long_stay_qm,
        AVG(short_stay_qm_rating) as avg_short_stay_qm,
        COUNT(*) as facility_count
      FROM snf_facilities
    `);

    const stateAvg = stateAvgResult.rows[0];
    const nationalAvg = nationalAvgResult.rows[0];

    res.json({
      success: true,
      facility: {
        ccn: facility.ccn,
        name: facility.facility_name,
        state: facility.state,
        qmRating: facility.quality_measure_rating,
        longStayQmRating: facility.long_stay_qm_rating,
        shortStayQmRating: facility.short_stay_qm_rating
      },
      benchmarks: {
        state: {
          name: facility.state,
          facilityCount: parseInt(stateAvg.facility_count),
          avgQmRating: parseFloat(stateAvg.avg_qm_rating) || null,
          avgLongStayQm: parseFloat(stateAvg.avg_long_stay_qm) || null,
          avgShortStayQm: parseFloat(stateAvg.avg_short_stay_qm) || null
        },
        national: {
          facilityCount: parseInt(nationalAvg.facility_count),
          avgQmRating: parseFloat(nationalAvg.avg_qm_rating) || null,
          avgLongStayQm: parseFloat(nationalAvg.avg_long_stay_qm) || null,
          avgShortStayQm: parseFloat(nationalAvg.avg_short_stay_qm) || null
        }
      }
    });

  } catch (error) {
    console.error('[CMS API] Error fetching quality measures:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
