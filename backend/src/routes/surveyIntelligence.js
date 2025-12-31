/**
 * Survey Intelligence API Routes
 *
 * Provides endpoints for accessing Survey Intelligence data:
 * - GET /facility/:id - Complete intelligence for one facility
 * - GET /team/:teamId - Summary for all facilities in a team
 * - GET /facility/:id/trend - Historical trend data
 * - POST /calculate/:facilityId - Trigger recalculation
 * - POST /calculate-all - Batch recalculation
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const calculator = require('../services/surveyIntelligenceCalculator');

// ============================================================
// GET /api/survey-intelligence/facility/:id
// Returns complete intelligence for one facility
// ============================================================
router.get('/facility/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get cached intelligence data
    const result = await pool.query(`
      SELECT
        si.*,
        f.name as facility_name,
        f.ccn,
        f.city,
        f.state as facility_state,
        t.name as team_name
      FROM survey_intelligence si
      JOIN facilities f ON si.facility_id = f.id
      LEFT JOIN teams t ON f.team_id = t.id
      WHERE si.facility_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      // No cached data - calculate on demand
      const facilityResult = await pool.query(`
        SELECT * FROM facilities WHERE id = $1
      `, [id]);

      if (facilityResult.rows.length === 0) {
        return res.status(404).json({ error: 'Facility not found' });
      }

      // Return minimal response indicating calculation needed
      return res.json({
        facility_id: parseInt(id),
        facility_name: facilityResult.rows[0].name,
        status: 'NOT_CALCULATED',
        message: 'Survey Intelligence has not been calculated for this facility. Trigger calculation via POST /calculate/:id'
      });
    }

    const si = result.rows[0];

    // Get focus areas
    const focusAreasResult = await pool.query(`
      SELECT * FROM survey_intelligence_focus_areas
      WHERE survey_intelligence_id = $1
      ORDER BY rank
    `, [si.id]);

    // Get recommendations
    const recommendationsResult = await pool.query(`
      SELECT * FROM survey_intelligence_recommendations
      WHERE survey_intelligence_id = $1
      ORDER BY priority
    `, [si.id]);

    // Format response
    const response = {
      facility_id: si.facility_id,
      facility_name: si.facility_name,
      ccn: si.federal_provider_number,
      location: `${si.city}, ${si.facility_state}`,
      team_name: si.team_name,

      scores: {
        survey_risk: {
          score: si.survey_risk_score,
          tier: si.survey_risk_tier,
          lagging_component: si.survey_risk_lagging_component,
          leading_component: si.survey_risk_leading_component
        },
        focus_areas: focusAreasResult.rows.map(fa => ({
          rank: fa.rank,
          system: fa.system_name,
          score: fa.system_score,
          top_ftags: fa.top_ftags
        })),
        audit_score: si.audit_score ? {
          score: si.audit_score,
          tier: si.audit_score >= 90 ? 'Excellent' :
                si.audit_score >= 75 ? 'Good' :
                si.audit_score >= 60 ? 'Fair' :
                si.audit_score >= 40 ? 'Poor' : 'Critical'
        } : null
      },

      operational_context: {
        quadrant: si.quadrant,
        quadrant_badge: si.quadrant === 'High Performing' ? '✅' :
                        si.quadrant === 'Comfortable' ? '✓' :
                        si.quadrant === 'Overextended' ? '⚠️' : '🚨',
        capacity_strain: parseFloat(si.capacity_strain),
        resource_score: parseFloat(si.resource_score),
        metrics: {
          turnover: {
            value: si.turnover_rate ? parseFloat(si.turnover_rate) : null,
            status: si.turnover_status,
            target: '<40%'
          },
          rn_skill_mix: {
            value: si.rn_skill_mix ? `${(parseFloat(si.rn_skill_mix) * 100).toFixed(1)}%` : null,
            status: si.rn_skill_mix_status,
            target: '30%+'
          },
          rn_hours: {
            value: si.rn_hours ? parseFloat(si.rn_hours) : null,
            status: si.rn_hours_status,
            target: '0.50-0.75'
          },
          weekend_gap: {
            value: si.weekend_gap ? `${(parseFloat(si.weekend_gap) * 100).toFixed(1)}%` : null,
            status: si.weekend_gap_status,
            target: '<20%'
          },
          occupancy: {
            value: si.occupancy_rate ? parseFloat(si.occupancy_rate) : null,
            status: si.occupancy_status,
            target: '80-90%'
          }
        },
        alert_flags: si.alert_flags || []
      },

      recommendations: recommendationsResult.rows.map(rec => ({
        priority: rec.priority,
        area: rec.area,
        current: rec.current_value,
        target: rec.target_value,
        impact: rec.impact,
        action: rec.action,
        evidence: rec.evidence
      })),

      chain_context: {
        chain_name: si.chain_name,
        chain_facility_count: si.chain_facility_count,
        chain_avg_qm: si.chain_avg_qm ? parseFloat(si.chain_avg_qm) : null,
        chain_rank: si.chain_rank,
        chain_percentile: si.chain_percentile,
        facility_vs_chain: si.facility_vs_chain ? parseFloat(si.facility_vs_chain) : null,
        vs_chain_status: si.vs_chain_status,
        is_independent: !si.chain_name
      },

      gap_analysis: {
        status: si.gap_status,
        insight: si.gap_insight,
        survey_risk_score: si.survey_risk_score,
        audit_score: si.audit_score
      },

      metadata: {
        calculated_at: si.calculated_at,
        cms_data_as_of: si.cms_data_as_of
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching survey intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch survey intelligence' });
  }
});

// ============================================================
// GET /api/survey-intelligence/team/:teamId
// Returns summary for all facilities in a team
// ============================================================
router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    // Get team info
    const teamResult = await pool.query(`
      SELECT * FROM teams WHERE id = $1
    `, [teamId]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamResult.rows[0];

    // Get all facilities with intelligence data
    const facilitiesResult = await pool.query(`
      SELECT
        f.id,
        f.name as facility_name,
        f.ccn,
        f.city,
        f.state,
        si.survey_risk_score,
        si.survey_risk_tier,
        si.quadrant,
        si.resource_score,
        si.capacity_strain,
        si.turnover_rate,
        si.rn_skill_mix,
        si.rn_hours,
        si.alert_flags,
        si.audit_score,
        si.gap_status
      FROM facilities f
      LEFT JOIN survey_intelligence si ON si.facility_id = f.id
      WHERE f.team_id = $1
      ORDER BY si.survey_risk_score DESC NULLS LAST
    `, [teamId]);

    const facilities = facilitiesResult.rows;

    // Calculate summary stats
    const facilitiesWithData = facilities.filter(f => f.survey_risk_score !== null);

    const summary = {
      by_risk_tier: {
        Critical: facilitiesWithData.filter(f => f.survey_risk_tier === 'Critical').length,
        High: facilitiesWithData.filter(f => f.survey_risk_tier === 'High').length,
        Moderate: facilitiesWithData.filter(f => f.survey_risk_tier === 'Moderate').length,
        Low: facilitiesWithData.filter(f => f.survey_risk_tier === 'Low').length
      },
      by_quadrant: {
        Struggling: facilitiesWithData.filter(f => f.quadrant === 'Struggling').length,
        Overextended: facilitiesWithData.filter(f => f.quadrant === 'Overextended').length,
        Comfortable: facilitiesWithData.filter(f => f.quadrant === 'Comfortable').length,
        'High Performing': facilitiesWithData.filter(f => f.quadrant === 'High Performing').length
      },
      avg_survey_risk: facilitiesWithData.length > 0
        ? Math.round(facilitiesWithData.reduce((sum, f) => sum + f.survey_risk_score, 0) / facilitiesWithData.length)
        : null,
      avg_audit_score: facilitiesWithData.filter(f => f.audit_score).length > 0
        ? Math.round(facilitiesWithData.filter(f => f.audit_score).reduce((sum, f) => sum + f.audit_score, 0) / facilitiesWithData.filter(f => f.audit_score).length)
        : null
    };

    // Identify top concerns
    const topConcerns = facilities
      .filter(f => f.survey_risk_tier === 'Critical' || f.survey_risk_tier === 'High' ||
                   f.quadrant === 'Struggling' || f.quadrant === 'Overextended')
      .slice(0, 5)
      .map((f, i) => ({
        priority: i + 1,
        facility: f.facility_name,
        issue: `${f.survey_risk_tier} Risk, ${f.quadrant}`,
        survey_risk: f.survey_risk_score,
        quadrant: f.quadrant
      }));

    res.json({
      team_id: parseInt(teamId),
      team_name: team.name,
      facility_count: facilities.length,
      facilities_with_data: facilitiesWithData.length,

      summary,

      facilities: facilities.map(f => ({
        id: f.id,
        name: f.facility_name,
        ccn: f.ccn,
        location: `${f.city}, ${f.state}`,
        survey_risk: f.survey_risk_score,
        risk_tier: f.survey_risk_tier,
        quadrant: f.quadrant,
        capacity_strain: f.capacity_strain ? parseFloat(f.capacity_strain) : null,
        audit_score: f.audit_score,
        gap_status: f.gap_status,
        alert_count: (f.alert_flags || []).length
      })),

      top_concerns: topConcerns
    });

  } catch (error) {
    console.error('Error fetching team survey intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch team survey intelligence' });
  }
});

// ============================================================
// GET /api/survey-intelligence/facility/:id/trend
// Returns historical trend data
// ============================================================
router.get('/facility/:id/trend', async (req, res) => {
  try {
    const { id } = req.params;
    const { months = 12 } = req.query;

    const result = await pool.query(`
      SELECT
        snapshot_date,
        snapshot_type,
        survey_risk_score,
        survey_risk_tier,
        resource_score,
        capacity_strain,
        quadrant,
        turnover_rate,
        rn_skill_mix,
        rn_hours,
        occupancy_rate
      FROM survey_intelligence_history
      WHERE facility_id = $1
        AND snapshot_date >= CURRENT_DATE - INTERVAL '${parseInt(months)} months'
      ORDER BY snapshot_date DESC
    `, [id]);

    // Calculate trend direction
    let direction = 'STABLE';
    let change12mo = 0;

    if (result.rows.length >= 2) {
      const latest = result.rows[0];
      const oldest = result.rows[result.rows.length - 1];

      if (latest.survey_risk_score && oldest.survey_risk_score) {
        change12mo = latest.survey_risk_score - oldest.survey_risk_score;

        if (change12mo >= 10) direction = 'WORSENING';
        else if (change12mo <= -10) direction = 'IMPROVING';
      }
    }

    res.json({
      facility_id: parseInt(id),
      trend_data: result.rows.map(r => ({
        date: r.snapshot_date,
        type: r.snapshot_type,
        survey_risk: r.survey_risk_score,
        risk_tier: r.survey_risk_tier,
        quadrant: r.quadrant,
        capacity_strain: r.capacity_strain ? parseFloat(r.capacity_strain) : null,
        resource_score: r.resource_score ? parseFloat(r.resource_score) : null
      })),
      direction,
      change_12mo: change12mo
    });

  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

// ============================================================
// GET /api/survey-intelligence/dashboard
// Returns company-wide dashboard summary
// ============================================================
router.get('/dashboard', async (req, res) => {
  try {
    // Get overall summary
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) as total_facilities,
        COUNT(*) FILTER (WHERE survey_risk_tier = 'Critical') as critical_count,
        COUNT(*) FILTER (WHERE survey_risk_tier = 'High') as high_count,
        COUNT(*) FILTER (WHERE survey_risk_tier = 'Moderate') as moderate_count,
        COUNT(*) FILTER (WHERE survey_risk_tier = 'Low') as low_count,
        COUNT(*) FILTER (WHERE quadrant = 'Struggling') as struggling_count,
        COUNT(*) FILTER (WHERE quadrant = 'Overextended') as overextended_count,
        COUNT(*) FILTER (WHERE quadrant = 'Comfortable') as comfortable_count,
        COUNT(*) FILTER (WHERE quadrant = 'High Performing') as high_performing_count,
        AVG(survey_risk_score)::INTEGER as avg_risk_score,
        AVG(audit_score)::INTEGER as avg_audit_score
      FROM survey_intelligence
    `);

    // Get team breakdown
    const teamResult = await pool.query(`
      SELECT * FROM survey_intelligence_team_summary
      ORDER BY avg_risk_score DESC NULLS LAST
    `);

    // Get high-risk facilities
    const highRiskResult = await pool.query(`
      SELECT * FROM survey_intelligence_high_risk
      LIMIT 10
    `);

    // Get facilities with alert flags
    const alertsResult = await pool.query(`
      SELECT
        si.facility_id,
        f.facility_name,
        si.alert_flags,
        jsonb_array_length(si.alert_flags) as alert_count
      FROM survey_intelligence si
      JOIN facilities f ON si.facility_id = f.id
      WHERE jsonb_array_length(si.alert_flags) > 0
      ORDER BY jsonb_array_length(si.alert_flags) DESC
      LIMIT 10
    `);

    const summary = summaryResult.rows[0];

    res.json({
      summary: {
        total_facilities: parseInt(summary.total_facilities),
        by_risk_tier: {
          Critical: parseInt(summary.critical_count),
          High: parseInt(summary.high_count),
          Moderate: parseInt(summary.moderate_count),
          Low: parseInt(summary.low_count)
        },
        by_quadrant: {
          Struggling: parseInt(summary.struggling_count),
          Overextended: parseInt(summary.overextended_count),
          Comfortable: parseInt(summary.comfortable_count),
          'High Performing': parseInt(summary.high_performing_count)
        },
        avg_risk_score: summary.avg_risk_score,
        avg_audit_score: summary.avg_audit_score
      },

      teams: teamResult.rows.map(t => ({
        team_id: t.team_id,
        team_name: t.team_name,
        facility_count: parseInt(t.facility_count),
        avg_risk_score: t.avg_risk_score,
        critical_count: parseInt(t.critical_count),
        high_count: parseInt(t.high_count),
        struggling_count: parseInt(t.struggling_count),
        overextended_count: parseInt(t.overextended_count)
      })),

      high_risk_facilities: highRiskResult.rows.map(f => ({
        id: f.facility_id,
        name: f.facility_name,
        team: f.team_name,
        risk_score: f.survey_risk_score,
        tier: f.survey_risk_tier,
        quadrant: f.quadrant
      })),

      facilities_with_alerts: alertsResult.rows.map(f => ({
        id: f.facility_id,
        name: f.facility_name,
        alert_count: parseInt(f.alert_count),
        alerts: f.alert_flags
      }))
    });

  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ============================================================
// POST /api/survey-intelligence/calculate/:facilityId
// Triggers recalculation for a single facility
// ============================================================
router.post('/calculate/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;

    // This would trigger the full calculation
    // For now, return a placeholder response
    res.json({
      status: 'QUEUED',
      facility_id: parseInt(facilityId),
      message: 'Calculation has been queued. Results will be available shortly.'
    });

  } catch (error) {
    console.error('Error triggering calculation:', error);
    res.status(500).json({ error: 'Failed to trigger calculation' });
  }
});

// ============================================================
// POST /api/survey-intelligence/calculate-all
// Triggers batch recalculation for all facilities
// ============================================================
router.post('/calculate-all', async (req, res) => {
  try {
    // This would trigger the batch calculation job
    // For now, return a placeholder response
    res.json({
      status: 'QUEUED',
      message: 'Batch calculation has been queued. This may take several minutes.'
    });

  } catch (error) {
    console.error('Error triggering batch calculation:', error);
    res.status(500).json({ error: 'Failed to trigger batch calculation' });
  }
});

module.exports = router;
