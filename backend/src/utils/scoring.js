/**
 * Scoring calculation utilities for SystemsCheck
 */

/**
 * Calculate points earned for a single item
 * Formula: (maxPoints / sampleSize) * chartsMet
 *
 * @param {number} maxPoints - Maximum points possible for this item
 * @param {number} chartsMet - Number of charts that met criteria
 * @param {number} sampleSize - Total number of charts reviewed
 * @returns {number} Points earned, rounded to 2 decimal places
 */
function calculateItemPoints(maxPoints, chartsMet, sampleSize) {
  // If sample_size is 0, null, or undefined: points_earned = 0
  if (!sampleSize || sampleSize === 0) {
    return 0;
  }

  // If charts_met is null or undefined, treat as 0
  const met = chartsMet || 0;

  // Calculate points: (maxPoints / sampleSize) * chartsMet
  const points = (maxPoints / sampleSize) * met;

  // Round to 2 decimal places
  return Math.round(points * 100) / 100;
}

/**
 * Calculate total points earned for a system
 *
 * @param {Array} items - Array of scorecard items with pointsEarned
 * @returns {number} Total points earned, rounded to 2 decimal places
 */
function calculateSystemTotal(items) {
  if (!items || items.length === 0) {
    return 0;
  }

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.pointsEarned) || 0);
  }, 0);

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Calculate total scorecard score across all systems
 *
 * @param {Array} systems - Array of scorecard systems with totalPointsEarned
 * @returns {number} Total score, rounded to 2 decimal places
 */
function calculateScorecardTotal(systems) {
  if (!systems || systems.length === 0) {
    return 0;
  }

  const total = systems.reduce((sum, system) => {
    return sum + (parseFloat(system.totalPointsEarned) || 0);
  }, 0);

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Calculate percentage score
 *
 * @param {number} earned - Points earned
 * @param {number} possible - Points possible
 * @returns {number} Percentage, rounded to 1 decimal place
 */
function calculatePercentage(earned, possible) {
  if (!possible || possible === 0) {
    return 0;
  }

  const percentage = (earned / possible) * 100;
  return Math.round(percentage * 10) / 10;
}

/**
 * Recalculate all points for a scorecard
 * Updates items, systems, and returns the total
 *
 * @param {Object} scorecard - Scorecard with systems and items
 * @returns {Object} Updated scorecard with calculated points
 */
function recalculateScorecard(scorecard) {
  if (!scorecard.systems) {
    return scorecard;
  }

  let scorecardTotal = 0;

  for (const system of scorecard.systems) {
    if (!system.items) continue;

    // Recalculate each item
    for (const item of system.items) {
      item.pointsEarned = calculateItemPoints(
        parseFloat(item.maxPoints),
        item.chartsMet,
        item.sampleSize
      );
    }

    // Recalculate system total
    system.totalPointsEarned = calculateSystemTotal(system.items);
    scorecardTotal += system.totalPointsEarned;
  }

  return {
    ...scorecard,
    totalScore: Math.round(scorecardTotal * 100) / 100
  };
}

module.exports = {
  calculateItemPoints,
  calculateSystemTotal,
  calculateScorecardTotal,
  calculatePercentage,
  recalculateScorecard
};
