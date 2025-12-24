/**
 * Audit Criteria for SystemsCheck Clinical Scorecard
 * Based on Clinical Systems Review Excel Template
 *
 * Each system has 100 total points possible.
 * 8 systems = 800 total points possible per scorecard.
 */

const auditCriteria = {
  1: {
    name: "Change of Condition",
    items: [
      { number: 1, text: "Condition change identification (acute & gradual) is timely", maxPoints: 10 },
      { number: 2, text: "Pertinent data is gathered and documented in the medical record (VS, labs, radiology, accuchecks, urine dips, O2 sats, pain scale, etc.)", maxPoints: 10 },
      { number: 3, text: "Physician/provider is notified timely with pertinent patient data (SBAR) and orders followed up", maxPoints: 15 },
      { number: 4, text: "Responsible party/family is notified timely with pertinent patient data", maxPoints: 10 },
      { number: 5, text: "Documentation reflects physician/provider direction and new orders", maxPoints: 10 },
      { number: 6, text: "Documentation reflects clinical interventions that were initiated", maxPoints: 10 },
      { number: 7, text: "Documentation is reflective of nursing assessment and clinical judgment", maxPoints: 10 },
      { number: 8, text: "Documentation supports hospice appropriate criteria were followed", maxPoints: 10 },
      { number: 9, text: "Discharge documentation reflects clinical status and safe discharge", maxPoints: 15 }
    ]
  },
  2: {
    name: "Accidents, Falls, Incidents",
    items: [
      { number: 1, text: "Timely post-fall assessment documented: VS, neuro check, pain, witnessed/non-witnessed, injuries, etc.", maxPoints: 10 },
      { number: 2, text: "Post Fall Huddle completed", maxPoints: 10 },
      { number: 3, text: "Physician/provider is notified and orders documented", maxPoints: 15 },
      { number: 4, text: "Responsible party/family notified", maxPoints: 10 },
      { number: 5, text: "Accurate, complete IR/24 Hour Report and supportive documentation on the fall/incident", maxPoints: 15 },
      { number: 6, text: "Fall interventions reassessed and new interventions added", maxPoints: 15 },
      { number: 7, text: "System for reviewing and trending is in place with evidence of review (QAPI)", maxPoints: 10 },
      { number: 8, text: "Care Plan addresses fall, accurate fall risk level, date of last fall, current interventions", maxPoints: 15 }
    ]
  },
  3: {
    name: "Skin",
    items: [
      { number: 1, text: "Accurate weekly skin assessments", maxPoints: 10 },
      { number: 2, text: "Accurate Braden Scale documented weekly (done by RN)", maxPoints: 10 },
      { number: 3, text: "Wound assessments documented weekly", maxPoints: 15 },
      { number: 4, text: "Wound treatment orders followed", maxPoints: 15 },
      { number: 5, text: "Wound documentation includes size, appearance, and condition of periwound area", maxPoints: 15 },
      { number: 6, text: "Pictures completed per policy", maxPoints: 10 },
      { number: 7, text: "Wound treatment/Supplies meets standards (supply room)", maxPoints: 10 },
      { number: 8, text: "Care Plan includes interventions to address current skin/wound conditions", maxPoints: 15 }
    ]
  },
  4: {
    name: "Medication Management & Weight Loss",
    items: [
      { number: 1, text: "Medication reconciliation completed accurately on admission/readmission", maxPoints: 10 },
      { number: 2, text: "MARs are accurate, complete, and match orders", maxPoints: 15 },
      { number: 3, text: "Medication pass observation follows five rights; proper technique", maxPoints: 15 },
      { number: 4, text: "Medication storage/narcotic count accurate and follows regulations", maxPoints: 10 },
      { number: 5, text: "Medication administration times are appropriate and followed", maxPoints: 10 },
      { number: 6, text: "Psychotropic medication use follows federal regulations and includes GDR attempts", maxPoints: 10 },
      { number: 7, text: "Weights obtained per facility policy and significant changes addressed", maxPoints: 15 },
      { number: 8, text: "Care Plan addresses weight status and current dietary interventions", maxPoints: 15 }
    ]
  },
  5: {
    name: "Infection Control",
    items: [
      { number: 1, text: "Hand hygiene/PPE compliance observed", maxPoints: 15 },
      { number: 2, text: "Infection control practices followed (isolation, equipment cleaning)", maxPoints: 15 },
      { number: 3, text: "Antibiotic stewardship principles followed", maxPoints: 15 },
      { number: 4, text: "Infections identified, reported, and trended (surveillance)", maxPoints: 15 },
      { number: 5, text: "Lab/diagnostic work-up supports infection diagnosis", maxPoints: 10 },
      { number: 6, text: "Treatment initiated timely and appropriate for diagnosis", maxPoints: 15 },
      { number: 7, text: "Care Plan addresses current infection status and interventions", maxPoints: 15 }
    ]
  },
  6: {
    name: "Transfer/Discharge",
    items: [
      { number: 1, text: "Transfer documentation complete and accurate (face sheet, transfer form, med list, recent notes)", maxPoints: 20 },
      { number: 2, text: "Discharge planning initiated timely", maxPoints: 15 },
      { number: 3, text: "Discharge instructions complete and patient/family educated", maxPoints: 20 },
      { number: 4, text: "Follow-up appointments scheduled and documented", maxPoints: 15 },
      { number: 5, text: "Medication reconciliation completed at discharge", maxPoints: 15 },
      { number: 6, text: "Communication with receiving facility/provider documented", maxPoints: 15 }
    ]
  },
  7: {
    name: "Abuse Self-Report Grievances",
    items: [
      { number: 1, text: "Allegations reported and investigated timely", maxPoints: 20 },
      { number: 2, text: "Five-day follow-up completed and documented", maxPoints: 15 },
      { number: 3, text: "Resident protected during investigation", maxPoints: 15 },
      { number: 4, text: "State reporting requirements followed", maxPoints: 15 },
      { number: 5, text: "Grievances logged and addressed timely", maxPoints: 15 },
      { number: 6, text: "Evidence of abuse prevention training and competency", maxPoints: 20 }
    ]
  },
  8: {
    name: "Observations & Interviews",
    items: [
      { number: 1, text: "Call lights answered timely", maxPoints: 15 },
      { number: 2, text: "Residents appear clean and well-groomed", maxPoints: 15 },
      { number: 3, text: "Resident rooms clean and personal items accessible", maxPoints: 10 },
      { number: 4, text: "Dining observation: assistance provided, appropriate pace", maxPoints: 15 },
      { number: 5, text: "Staff interactions respectful and person-centered", maxPoints: 15 },
      { number: 6, text: "Residents/families report satisfaction with care", maxPoints: 15 },
      { number: 7, text: "Activity engagement observed and appropriate", maxPoints: 15 }
    ]
  }
};

/**
 * Get all systems with their criteria
 */
function getAllSystems() {
  return auditCriteria;
}

/**
 * Get a specific system by number
 */
function getSystem(systemNumber) {
  return auditCriteria[systemNumber];
}

/**
 * Get system names as a map
 */
function getSystemNames() {
  const names = {};
  for (const [num, system] of Object.entries(auditCriteria)) {
    names[num] = system.name;
  }
  return names;
}

/**
 * Get total items across all systems
 */
function getTotalItems() {
  let count = 0;
  for (const system of Object.values(auditCriteria)) {
    count += system.items.length;
  }
  return count;
}

/**
 * Calculate total possible points across all systems
 */
function getTotalPossiblePoints() {
  let total = 0;
  for (const system of Object.values(auditCriteria)) {
    for (const item of system.items) {
      total += item.maxPoints;
    }
  }
  return total; // Should be 800 (8 systems × 100 points)
}

/**
 * Validate that each system totals exactly 100 points
 */
function validateSystemTotals() {
  const results = {};
  for (const [num, system] of Object.entries(auditCriteria)) {
    const total = system.items.reduce((sum, item) => sum + item.maxPoints, 0);
    results[num] = {
      name: system.name,
      itemCount: system.items.length,
      totalPoints: total,
      valid: total === 100
    };
  }
  return results;
}

module.exports = {
  auditCriteria,
  getAllSystems,
  getSystem,
  getSystemNames,
  getTotalItems,
  getTotalPossiblePoints,
  validateSystemTotals
};
