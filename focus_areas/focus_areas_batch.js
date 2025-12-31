/**
 * Focus Areas Batch Processing
 * ============================
 * Nightly job to recalculate focus areas for all facilities
 * and store results in the database.
 *
 * Usage:
 *   node focus_areas_batch.js                    # Process all facilities
 *   node focus_areas_batch.js --state CA         # Process single state
 *   node focus_areas_batch.js --facility 105001  # Process single facility
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.MARKET_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Import calculations from API (or duplicate here for standalone use)
const FTAG_SYSTEM_MAP = {
  '0580': 1, '0684': 1, '0685': 1, '0656': 1, '0657': 1, '0636': 1, '0637': 1,
  '0641': 1, '0655': 1, '0638': 1, '0658': 1, '0552': 1, '0698': 1, '0697': 1,
  '0699': 1, '0725': 1, '0726': 1, '0727': 1, '0730': 1, '0732': 1, '0835': 1,
  '0838': 1, '0851': 1, '0865': 1, '0867': 1, '0868': 1, '0770': 1, '0947': 1,
  '0689': 2, '0688': 2, '0676': 2, '0677': 2, '0700': 2, '0584': 2, '0919': 2,
  '0921': 2, '0912': 2, '0908': 2, '0925': 2, '0791': 2, '0678': 2, '0694': 2,
  '0686': 3, '0687': 3, '0690': 3, '0695': 3,
  '0755': 4, '0756': 4, '0757': 4, '0758': 4, '0759': 4, '0760': 4, '0761': 4,
  '0692': 4, '0693': 4, '0740': 4, '0744': 4, '0554': 4, '0812': 4, '0803': 4,
  '0804': 4, '0805': 4, '0806': 4, '0809': 4, '0801': 4, '0802': 4, '0814': 4,
  '0880': 5, '0881': 5, '0882': 5, '0883': 5, '0884': 5, '0885': 5, '0886': 5,
  '0887': 5, '0888': 5,
  '0622': 6, '0623': 6, '0624': 6, '0625': 6, '0626': 6, '0627': 6, '0660': 6,
  '0661': 6, '0849': 6,
  '0600': 7, '0602': 7, '0603': 7, '0604': 7, '0605': 7, '0606': 7, '0607': 7,
  '0608': 7, '0609': 7, '0610': 7, '0585': 7, '0550': 7, '0557': 7, '0558': 7,
  '0561': 7, '0565': 7, '0577': 7, '0578': 7, '0582': 7, '0583': 7, '0842': 7,
  '0644': 7, '0645': 7, '0679': 7, '0745': 7
};

const SEVERITY_WEIGHTS = {
  'J': 10, 'K': 10, 'L': 10,
  'G': 5, 'H': 5, 'I': 5,
  'D': 2, 'E': 2, 'F': 2,
  'A': 1, 'B': 1, 'C': 1
};

const CLINICAL_SYSTEMS = {
  1: 'Change of Condition',
  2: 'Accidents/Falls',
  3: 'Skin',
  4: 'Med Management/Weight Loss',
  5: 'Infection Control',
  6: 'Transfer/Discharge',
  7: 'Abuse/Grievances'
};

/**
 * Main batch processing function
 */
async function runBatchProcess(options = {}) {
  console.log('='.repeat(70));
  console.log('FOCUS AREAS BATCH PROCESSING');
  console.log('='.repeat(70));
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // 1. Get list of facilities to process
    let whereClause = 'WHERE f.active = true';
    const params = [];

    if (options.state) {
      params.push(options.state);
      whereClause += ` AND f.state = $${params.length}`;
    }

    if (options.facility) {
      params.push(options.facility);
      whereClause += ` AND f.federal_provider_number = $${params.length}`;
    }

    const facilitiesResult = await pool.query(`
      SELECT federal_provider_number, facility_name, state, certified_beds
      FROM snf_facilities f
      ${whereClause}
      ORDER BY state, federal_provider_number
    `, params);

    const facilities = facilitiesResult.rows;
    console.log(`\nProcessing ${facilities.length} facilities...`);

    // 2. Get all deficiencies (batch load for efficiency)
    console.log('Loading deficiency data...');
    const deficienciesResult = await pool.query(`
      SELECT
        federal_provider_number,
        survey_date,
        deficiency_tag,
        scope_severity,
        is_standard_deficiency,
        is_complaint_deficiency
      FROM cms_facility_deficiencies
      WHERE survey_date >= CURRENT_DATE - INTERVAL '3 years'
      ORDER BY federal_provider_number, survey_date DESC
    `);

    // Group deficiencies by facility
    const deficienciesByFacility = new Map();
    deficienciesResult.rows.forEach(d => {
      if (!deficienciesByFacility.has(d.federal_provider_number)) {
        deficienciesByFacility.set(d.federal_provider_number, []);
      }
      deficienciesByFacility.get(d.federal_provider_number).push(d);
    });

    console.log(`Loaded ${deficienciesResult.rows.length} deficiencies for ${deficienciesByFacility.size} facilities`);

    // 3. Calculate state-level statistics for peer comparison
    console.log('Calculating state statistics...');
    const stateStats = await calculateStateStats();

    // 4. Process each facility
    let processed = 0;
    let errors = 0;
    const batchSize = 100;
    const results = [];

    for (const facility of facilities) {
      try {
        const deficiencies = deficienciesByFacility.get(facility.federal_provider_number) || [];
        const focusAreas = calculateFocusAreas(facility, deficiencies, stateStats);

        results.push({
          federal_provider_number: facility.federal_provider_number,
          ...focusAreas
        });

        processed++;

        if (processed % batchSize === 0) {
          // Batch insert
          await saveFocusAreas(results);
          results.length = 0; // Clear array
          console.log(`Processed ${processed}/${facilities.length} facilities...`);
        }
      } catch (error) {
        console.error(`Error processing ${facility.federal_provider_number}:`, error.message);
        errors++;
      }
    }

    // Save remaining results
    if (results.length > 0) {
      await saveFocusAreas(results);
    }

    console.log('\n' + '='.repeat(70));
    console.log('BATCH PROCESSING COMPLETE');
    console.log('='.repeat(70));
    console.log(`Processed: ${processed}`);
    console.log(`Errors: ${errors}`);
    console.log(`Completed at: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('Batch processing failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Calculate state-level statistics for comparison
 */
async function calculateStateStats() {
  const result = await pool.query(`
    WITH facility_system_citations AS (
      SELECT
        f.state,
        f.federal_provider_number,
        -- Map F-tag to system in SQL (simplified)
        CASE
          WHEN d.deficiency_tag IN ('0880','0881','0882','0883','0884','0885','0886','0887','0888') THEN 5
          WHEN d.deficiency_tag IN ('0689','0688','0676','0677','0700') THEN 2
          WHEN d.deficiency_tag IN ('0686','0687','0690','0695') THEN 3
          WHEN d.deficiency_tag IN ('0755','0756','0757','0758','0759','0760','0761','0692','0693') THEN 4
          WHEN d.deficiency_tag IN ('0600','0602','0603','0604','0605','0606','0607','0608','0609','0610') THEN 7
          WHEN d.deficiency_tag IN ('0622','0623','0624','0625','0626','0627','0660','0661') THEN 6
          ELSE 1
        END as system_id,
        COUNT(*) as citation_count
      FROM cms_facility_deficiencies d
      JOIN snf_facilities f ON d.federal_provider_number = f.federal_provider_number
      WHERE d.survey_date >= CURRENT_DATE - INTERVAL '3 years'
        AND d.is_standard_deficiency = true
      GROUP BY f.state, f.federal_provider_number,
        CASE
          WHEN d.deficiency_tag IN ('0880','0881','0882','0883','0884','0885','0886','0887','0888') THEN 5
          WHEN d.deficiency_tag IN ('0689','0688','0676','0677','0700') THEN 2
          WHEN d.deficiency_tag IN ('0686','0687','0690','0695') THEN 3
          WHEN d.deficiency_tag IN ('0755','0756','0757','0758','0759','0760','0761','0692','0693') THEN 4
          WHEN d.deficiency_tag IN ('0600','0602','0603','0604','0605','0606','0607','0608','0609','0610') THEN 7
          WHEN d.deficiency_tag IN ('0622','0623','0624','0625','0626','0627','0660','0661') THEN 6
          ELSE 1
        END
    )
    SELECT
      state,
      system_id,
      AVG(citation_count) as avg_citations,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY citation_count) as median_citations,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY citation_count) as p75_citations,
      COUNT(*) as facility_count
    FROM facility_system_citations
    GROUP BY state, system_id
  `);

  // Build lookup map
  const stats = new Map();
  result.rows.forEach(row => {
    const key = `${row.state}_${row.system_id}`;
    stats.set(key, {
      avgCitations: parseFloat(row.avg_citations),
      medianCitations: parseFloat(row.median_citations),
      p75Citations: parseFloat(row.p75_citations),
      facilityCount: parseInt(row.facility_count)
    });
  });

  return stats;
}

/**
 * Calculate focus areas for a single facility
 */
function calculateFocusAreas(facility, deficiencies, stateStats) {
  // Initialize system stats
  const systemStats = {};
  for (let i = 1; i <= 7; i++) {
    systemStats[i] = {
      systemId: i,
      systemName: CLINICAL_SYSTEMS[i],
      citationCount: 0,
      severityWeightedCount: 0,
      ftagsCited: new Set(),
      repeatFtags: [],
      hadIj: false,
      hadHarm: false
    };
  }

  // Group by survey for repeat detection
  const surveyFtags = new Map();

  // Process deficiencies
  deficiencies.forEach(d => {
    if (!d.is_standard_deficiency) return;

    const systemId = FTAG_SYSTEM_MAP[d.deficiency_tag];
    if (!systemId) return;

    const stats = systemStats[systemId];
    stats.citationCount++;
    stats.severityWeightedCount += SEVERITY_WEIGHTS[d.scope_severity] || 1;
    stats.ftagsCited.add(d.deficiency_tag);

    if (['J', 'K', 'L'].includes(d.scope_severity)) stats.hadIj = true;
    if (['G', 'H', 'I'].includes(d.scope_severity)) stats.hadHarm = true;

    const dateKey = d.survey_date.toISOString().split('T')[0];
    if (!surveyFtags.has(dateKey)) surveyFtags.set(dateKey, new Map());
    if (!surveyFtags.get(dateKey).has(systemId)) surveyFtags.get(dateKey).set(systemId, new Set());
    surveyFtags.get(dateKey).get(systemId).add(d.deficiency_tag);
  });

  // Find repeat F-tags
  const surveyDates = Array.from(surveyFtags.keys()).sort().reverse();
  if (surveyDates.length >= 2) {
    const currentDate = surveyDates[0];
    const prevDate = surveyDates[1];

    for (let systemId = 1; systemId <= 7; systemId++) {
      const currentFtags = surveyFtags.get(currentDate)?.get(systemId) || new Set();
      const prevFtags = surveyFtags.get(prevDate)?.get(systemId) || new Set();
      systemStats[systemId].repeatFtags = [...currentFtags].filter(t => prevFtags.has(t));
    }
  }

  // Calculate citation metrics
  const standardDefs = deficiencies.filter(d => d.is_standard_deficiency);
  const surveyMap = new Map();
  standardDefs.forEach(d => {
    const dateKey = d.survey_date.toISOString().split('T')[0];
    if (!surveyMap.has(dateKey)) surveyMap.set(dateKey, []);
    surveyMap.get(dateKey).push(d);
  });
  const surveys = Array.from(surveyMap.entries()).sort((a, b) => new Date(b[0]) - new Date(a[0]));

  const currentCount = surveys[0]?.[1]?.length || 0;
  const prevCount = surveys[1]?.[1]?.length || 0;

  let citationVelocity = 'stable';
  if (prevCount > 0) {
    if (currentCount < prevCount * 0.8) citationVelocity = 'improving';
    else if (currentCount > prevCount * 1.2) citationVelocity = 'worsening';
  }

  // Calculate repeat F-tag rate
  const currentFtags = new Set(surveys[0]?.[1]?.map(d => d.deficiency_tag) || []);
  const prevFtags = new Set(surveys[1]?.[1]?.map(d => d.deficiency_tag) || []);
  const repeatFtags = [...currentFtags].filter(t => prevFtags.has(t));
  const repeatFtagRate = currentFtags.size > 0 ? repeatFtags.length / currentFtags.size : 0;

  // Days since last survey
  const lastSurveyDate = surveys[0]?.[0] ? new Date(surveys[0][0]) : null;
  const daysSinceLastSurvey = lastSurveyDate
    ? Math.floor((Date.now() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate system risk scores
  const maxSeverityWeighted = Math.max(...Object.values(systemStats).map(s => s.severityWeightedCount), 1);

  const systemScores = Object.values(systemStats).map(stats => {
    const citationFactor = Math.min(100, (stats.severityWeightedCount / maxSeverityWeighted) * 100);
    const repeatBonus = stats.repeatFtags.length * 5;
    const severityBonus = (stats.hadIj ? 20 : 0) + (stats.hadHarm ? 10 : 0);

    // Get state comparison
    const stateKey = `${facility.state}_${stats.systemId}`;
    const stateData = stateStats.get(stateKey) || { avgCitations: 1 };

    const peerFactor = Math.min(100, Math.max(0,
      50 + (stats.citationCount - stateData.avgCitations) / Math.max(stateData.avgCitations, 1) * 50
    ));

    const citationFactorScore = Math.min(100, citationFactor + repeatBonus + severityBonus);

    return {
      ...stats,
      ftagsCited: [...stats.ftagsCited],
      citationFactorScore,
      peerFactorScore: peerFactor,
      systemRiskScore: Math.round(
        (citationFactorScore * 0.50) +
        (peerFactor * 0.30) +
        (50 * 0.20) // State factor placeholder
      )
    };
  }).sort((a, b) => b.systemRiskScore - a.systemRiskScore);

  // Overall risk score
  const topSystemsAvg = systemScores.slice(0, 3)
    .reduce((sum, s) => sum + s.systemRiskScore, 0) / 3;

  let adjustment = 0;
  if (citationVelocity === 'worsening') adjustment += 10;
  if (citationVelocity === 'improving') adjustment -= 10;
  if (repeatFtagRate > 0.3) adjustment += 10;
  if (daysSinceLastSurvey > 456) adjustment += 5;

  const overallRiskScore = Math.max(0, Math.min(100, Math.round(topSystemsAvg + adjustment)));

  const overallRiskTier = overallRiskScore >= 75 ? 'Very High' :
    overallRiskScore >= 50 ? 'High' :
    overallRiskScore >= 25 ? 'Medium' : 'Low';

  return {
    overall_risk_score: overallRiskScore,
    overall_risk_tier: overallRiskTier,
    key_metrics: {
      citation_velocity: citationVelocity,
      repeat_ftag_rate: Math.round(repeatFtagRate * 1000) / 1000,
      days_since_last_survey: daysSinceLastSurvey,
      survey_overdue: daysSinceLastSurvey > 456
    },
    focus_areas: systemScores.map((s, index) => ({
      rank: index + 1,
      system_id: s.systemId,
      system_name: s.systemName,
      system_risk_score: s.systemRiskScore,
      citation_count_3yr: s.citationCount,
      severity_weighted_count: s.severityWeightedCount,
      repeat_ftags: s.repeatFtags,
      had_ij: s.hadIj,
      had_harm: s.hadHarm,
      ftags_cited: s.ftagsCited.slice(0, 10)
    }))
  };
}

/**
 * Save focus areas to database
 */
async function saveFocusAreas(results) {
  if (results.length === 0) return;

  const calculatedAt = new Date();

  for (const result of results) {
    try {
      // Upsert into facility_focus_areas
      await pool.query(`
        INSERT INTO facility_focus_areas (
          federal_provider_number,
          calculated_at,
          model_version,
          overall_risk_score,
          overall_risk_tier,
          key_metrics,
          focus_areas,
          data_as_of_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
        ON CONFLICT (federal_provider_number, calculated_at)
        DO UPDATE SET
          overall_risk_score = EXCLUDED.overall_risk_score,
          overall_risk_tier = EXCLUDED.overall_risk_tier,
          key_metrics = EXCLUDED.key_metrics,
          focus_areas = EXCLUDED.focus_areas,
          updated_at = CURRENT_TIMESTAMP
      `, [
        result.federal_provider_number,
        calculatedAt,
        '1.0',
        result.overall_risk_score,
        result.overall_risk_tier,
        JSON.stringify(result.key_metrics),
        JSON.stringify(result.focus_areas)
      ]);

      // Also save individual system scores
      for (const system of result.focus_areas) {
        await pool.query(`
          INSERT INTO facility_system_scores (
            federal_provider_number,
            system_id,
            calculated_at,
            citation_factor_score,
            peer_factor_score,
            system_risk_score,
            citation_count_3yr,
            severity_weighted_count,
            repeat_ftag_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (federal_provider_number, system_id, calculated_at)
          DO UPDATE SET
            citation_factor_score = EXCLUDED.citation_factor_score,
            peer_factor_score = EXCLUDED.peer_factor_score,
            system_risk_score = EXCLUDED.system_risk_score,
            citation_count_3yr = EXCLUDED.citation_count_3yr,
            severity_weighted_count = EXCLUDED.severity_weighted_count,
            repeat_ftag_count = EXCLUDED.repeat_ftag_count
        `, [
          result.federal_provider_number,
          system.system_id,
          calculatedAt,
          system.system_risk_score, // Using as citation factor for now
          50, // Peer factor placeholder
          system.system_risk_score,
          system.citation_count_3yr,
          system.severity_weighted_count,
          system.repeat_ftags?.length || 0
        ]);
      }
    } catch (error) {
      console.error(`Error saving ${result.federal_provider_number}:`, error.message);
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--state' && args[i + 1]) {
      options.state = args[i + 1];
      i++;
    } else if (args[i] === '--facility' && args[i + 1]) {
      options.facility = args[i + 1];
      i++;
    }
  }

  return options;
}

// Run the batch process
const options = parseArgs();
runBatchProcess(options)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
