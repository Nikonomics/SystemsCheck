/**
 * Sync snf_facilities table with latest facility_snapshots data
 *
 * This script updates the snf_facilities table (market database) with
 * the latest values from facility_snapshots (SNFalyze database).
 *
 * Run after each CMS data update to keep snf_facilities current.
 *
 * Usage: node src/scripts/syncSnfFacilities.js
 *    or: npm run sync-facilities
 */

require('dotenv').config();
const { getMarketPool, getSNFalyzePool } = require('../config/marketDatabase');

async function syncFacilities() {
  console.log('='.repeat(60));
  console.log('SNF Facilities Sync Script');
  console.log('='.repeat(60));
  console.log();

  const marketPool = getMarketPool();
  const snfalyzePool = getSNFalyzePool();

  if (!marketPool) {
    console.error('ERROR: Market database connection not available');
    console.error('Make sure MARKET_DATABASE_URL is set in .env');
    process.exit(1);
  }

  if (!snfalyzePool) {
    console.error('ERROR: SNFalyze database connection not available');
    console.error('Make sure SNFALYZE_DATABASE_URL is set in .env');
    process.exit(1);
  }

  try {
    // Get latest extract info
    console.log('Getting latest CMS extract...');
    const extractResult = await snfalyzePool.query(`
      SELECT extract_id, extract_date
      FROM cms_extracts
      ORDER BY extract_date DESC
      LIMIT 1
    `);

    if (extractResult.rows.length === 0) {
      console.error('ERROR: No extracts found in cms_extracts table');
      process.exit(1);
    }

    const latestExtract = extractResult.rows[0];
    console.log(`Latest extract: ID ${latestExtract.extract_id}, Date: ${latestExtract.extract_date}`);
    console.log();

    // Get count of snapshots for this extract
    const countResult = await snfalyzePool.query(`
      SELECT COUNT(*) as count
      FROM facility_snapshots
      WHERE extract_id = $1
    `, [latestExtract.extract_id]);

    const snapshotCount = parseInt(countResult.rows[0].count);
    console.log(`Found ${snapshotCount.toLocaleString()} facility snapshots to sync`);
    console.log();

    // Fetch all snapshots for the latest extract
    console.log('Fetching snapshot data...');
    const snapshotsResult = await snfalyzePool.query(`
      SELECT
        ccn,
        provider_name,
        overall_rating,
        health_inspection_rating,
        qm_rating,
        staffing_rating,
        long_stay_qm_rating,
        short_stay_qm_rating,
        reported_na_hrs,
        reported_lpn_hrs,
        reported_rn_hrs,
        reported_licensed_hrs,
        reported_total_nurse_hrs,
        reported_pt_hrs,
        weekend_total_nurse_hrs,
        weekend_rn_hrs,
        total_nursing_turnover,
        rn_turnover,
        administrator_departures,
        certified_beds,
        average_residents_per_day,
        cycle1_total_health_deficiencies,
        cycle1_standard_deficiencies,
        cycle1_complaint_deficiencies,
        total_weighted_health_score,
        facility_reported_incidents,
        substantiated_complaints,
        infection_control_citations,
        fine_count,
        fine_total_dollars,
        payment_denial_count,
        total_penalty_count,
        chain_name,
        chain_id,
        facilities_in_chain,
        chain_avg_overall_rating,
        chain_avg_health_rating,
        chain_avg_staffing_rating,
        chain_avg_qm_rating,
        ownership_type,
        special_focus_status,
        has_abuse_icon,
        has_recent_ownership_change,
        cms_processing_date
      FROM facility_snapshots
      WHERE extract_id = $1
    `, [latestExtract.extract_id]);

    const snapshots = snapshotsResult.rows;
    console.log(`Fetched ${snapshots.length.toLocaleString()} snapshots`);
    console.log();

    // Update snf_facilities in batches
    console.log('Updating snf_facilities...');
    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < snapshots.length; i++) {
      const s = snapshots[i];

      try {
        const updateResult = await marketPool.query(`
          UPDATE snf_facilities SET
            facility_name = COALESCE($2, facility_name),
            overall_rating = COALESCE($3, overall_rating),
            health_inspection_rating = COALESCE($4, health_inspection_rating),
            quality_measure_rating = COALESCE($5, quality_measure_rating),
            staffing_rating = COALESCE($6, staffing_rating),
            long_stay_qm_rating = COALESCE($7, long_stay_qm_rating),
            short_stay_qm_rating = COALESCE($8, short_stay_qm_rating),
            reported_cna_staffing_hours = COALESCE($9, reported_cna_staffing_hours),
            lpn_staffing_hours = COALESCE($10, lpn_staffing_hours),
            rn_staffing_hours = COALESCE($11, rn_staffing_hours),
            licensed_staffing_hours = COALESCE($12, licensed_staffing_hours),
            total_nurse_staffing_hours = COALESCE($13, total_nurse_staffing_hours),
            pt_staffing_hours = COALESCE($14, pt_staffing_hours),
            weekend_total_nurse_hours = COALESCE($15, weekend_total_nurse_hours),
            weekend_rn_hours = COALESCE($16, weekend_rn_hours),
            total_nursing_turnover = COALESCE($17, total_nursing_turnover),
            rn_turnover = COALESCE($18, rn_turnover),
            admin_departures = COALESCE($19, admin_departures),
            certified_beds = COALESCE($20, certified_beds),
            average_residents_per_day = COALESCE($21, average_residents_per_day),
            occupancy_rate = CASE
              WHEN $20 > 0 AND $21 IS NOT NULL
              THEN ROUND(($21::numeric / $20::numeric) * 100, 2)
              ELSE occupancy_rate
            END,
            health_deficiencies = COALESCE($22, health_deficiencies),
            standard_health_deficiencies = COALESCE($23, standard_health_deficiencies),
            complaint_deficiencies = COALESCE($24, complaint_deficiencies),
            weighted_health_score = COALESCE($25, weighted_health_score),
            facility_reported_incidents = COALESCE($26, facility_reported_incidents),
            substantiated_complaints = COALESCE($27, substantiated_complaints),
            infection_control_citations = COALESCE($28, infection_control_citations),
            fine_count = COALESCE($29, fine_count),
            total_fines_amount = COALESCE($30, total_fines_amount),
            payment_denial_count = COALESCE($31, payment_denial_count),
            penalty_count = COALESCE($32, penalty_count),
            chain_name = COALESCE($33, chain_name),
            chain_id = COALESCE($34, chain_id),
            chain_facility_count = COALESCE($35, chain_facility_count),
            chain_avg_overall_rating = COALESCE($36, chain_avg_overall_rating),
            chain_avg_health_rating = COALESCE($37, chain_avg_health_rating),
            chain_avg_staffing_rating = COALESCE($38, chain_avg_staffing_rating),
            chain_avg_qm_rating = COALESCE($39, chain_avg_qm_rating),
            ownership_type = COALESCE($40, ownership_type),
            special_focus_facility = COALESCE($41 = 'SFF', special_focus_facility),
            abuse_icon = COALESCE($42, abuse_icon),
            ownership_changed_12mo = COALESCE($43, ownership_changed_12mo),
            cms_processing_date = COALESCE($44, cms_processing_date),
            last_cms_update = $45,
            updated_at = NOW()
          WHERE federal_provider_number = $1
        `, [
          s.ccn,                              // $1
          s.provider_name,                   // $2
          s.overall_rating,                  // $3
          s.health_inspection_rating,        // $4
          s.qm_rating,                       // $5
          s.staffing_rating,                 // $6
          s.long_stay_qm_rating,             // $7
          s.short_stay_qm_rating,            // $8
          s.reported_na_hrs,                 // $9
          s.reported_lpn_hrs,                // $10
          s.reported_rn_hrs,                 // $11
          s.reported_licensed_hrs,           // $12
          s.reported_total_nurse_hrs,        // $13
          s.reported_pt_hrs,                 // $14
          s.weekend_total_nurse_hrs,         // $15
          s.weekend_rn_hrs,                  // $16
          s.total_nursing_turnover,          // $17
          s.rn_turnover,                     // $18
          s.administrator_departures,        // $19
          s.certified_beds,                  // $20
          s.average_residents_per_day,       // $21
          s.cycle1_total_health_deficiencies, // $22
          s.cycle1_standard_deficiencies,    // $23
          s.cycle1_complaint_deficiencies,   // $24
          s.total_weighted_health_score,     // $25
          s.facility_reported_incidents,     // $26
          s.substantiated_complaints,        // $27
          s.infection_control_citations,     // $28
          s.fine_count,                      // $29
          s.fine_total_dollars,              // $30
          s.payment_denial_count,            // $31
          s.total_penalty_count,             // $32
          s.chain_name,                      // $33
          s.chain_id,                        // $34
          s.facilities_in_chain,             // $35
          s.chain_avg_overall_rating,        // $36
          s.chain_avg_health_rating,         // $37
          s.chain_avg_staffing_rating,       // $38
          s.chain_avg_qm_rating,             // $39
          s.ownership_type,                  // $40
          s.special_focus_status,            // $41
          s.has_abuse_icon,                  // $42
          s.has_recent_ownership_change,     // $43
          s.cms_processing_date,             // $44
          latestExtract.extract_date         // $45
        ]);

        if (updateResult.rowCount > 0) {
          updated++;
        } else {
          notFound++;
        }
      } catch (err) {
        errors++;
        if (errors <= 5) {
          console.error(`Error updating CCN ${s.ccn}: ${err.message}`);
        }
      }

      // Progress indicator
      if ((i + 1) % 1000 === 0 || i === snapshots.length - 1) {
        const pct = Math.round(((i + 1) / snapshots.length) * 100);
        process.stdout.write(`\r  Progress: ${i + 1}/${snapshots.length} (${pct}%) - Updated: ${updated}, Not found: ${notFound}, Errors: ${errors}`);
      }
    }

    console.log('\n');
    console.log('='.repeat(60));
    console.log('SYNC COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total snapshots processed: ${snapshots.length.toLocaleString()}`);
    console.log(`Facilities updated:        ${updated.toLocaleString()}`);
    console.log(`Not found in snf_facilities: ${notFound.toLocaleString()}`);
    console.log(`Errors:                    ${errors.toLocaleString()}`);
    console.log(`Extract date:              ${latestExtract.extract_date}`);
    console.log();

    if (notFound > 0) {
      console.log('Note: "Not found" means the facility exists in facility_snapshots');
      console.log('but not in snf_facilities. This is expected for new facilities.');
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await marketPool.end();
    await snfalyzePool.end();
  }
}

syncFacilities();
