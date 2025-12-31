/**
 * SystemsCheck Audit Criteria
 * 
 * CORRECTED VERSION - Matches original Excel spreadsheet exactly
 * 
 * Structure:
 * - 7 Scored Systems (100 points each = 700 total)
 * - 1 Unscored Reference System (Observations & Interview - field guide only)
 * 
 * Each item includes:
 * - number: Display number (e.g., "1", "2a", "2b")
 * - text: Full item description
 * - maxPoints: Maximum points for this item
 * - sampleSize: 1 for Y/N items, 3 for chart reviews, or specific number
 * - multiplier: Points per unit met (maxPoints / sampleSize)
 * - inputType: "binary" (Y/N) or "sample" (0-3 scale)
 */

const auditCriteria = [
  // ============================================================================
  // SYSTEM 1: CHANGE OF CONDITION (100 points, 8 items)
  // ============================================================================
  {
    systemNumber: 1,
    name: "Change of Condition",
    maxPoints: 100,
    items: [
      {
        number: "1",
        text: "The facility has a system in place that verifies timely identification of changes",
        maxPoints: 20,
        sampleSize: 1,
        multiplier: 20,
        inputType: "binary"
      },
      {
        number: "2",
        text: "Notify of changes F580 (Sample 3)",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.66,
        inputType: "sample"
      },
      {
        number: "2a",
        text: "Physician notified",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "2b",
        text: "Resident representative notification",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "3",
        text: "Every change in a resident's condition or significant resident care issues are reviewed daily during IDT",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "4",
        text: "Change of condition care planned (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Facility has an effective communication system to ensure front line staff (C.N.A.) are aware of condition changes and interventions",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Facility utilizes/monitors Vital Sign Alerts in PCC: Best Practice. For residents at risk, alerts set timely and appropriately",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      }
    ]
  },

  // ============================================================================
  // SYSTEM 2: ACCIDENTS, FALLS, INCIDENTS (100 points, 15 items)
  // ============================================================================
  {
    systemNumber: 2,
    name: "Accidents, Falls, Incidents",
    maxPoints: 100,
    sections: [
      { name: "ACCIDENTS (Falls, Incident Reports)", startItem: 1, endItem: 10 },
      { name: "Wandering and Elopement F689", startItem: 11, endItem: 15 }
    ],
    items: [
      // Section: ACCIDENTS (Falls, Incident Reports)
      {
        number: "1",
        text: "All Incidents reviewed daily at IDT Meeting. Fall investigation completed post-incident",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Fall risk assessment completed accurately on admission and per policy (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "3",
        text: "Review high risk chart related to fall (i.e. fall with fx. or injury). Incident investigation completed (focus on falls with serious injury)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "4",
        text: "Physician was notified in a timely manner and documented in the medical record (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Family/responsible party notified in a timely manner and documented (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Nursing documentation is evident 72 hours (q shift) post each occurrence (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Neuro checks were completed per facility policy (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Care plans are updated/revised timely after each incident. Interim Care Plan initiated",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "9",
        text: "Verify fall interventions are in place (per order and/or care plan) (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "10",
        text: "Staff are knowledgeable about fall interventions as per care plan",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      // Section: Wandering and Elopement F689
      {
        number: "11",
        text: "Facility implements procedures for assessing, identifying, monitoring and addressing elopement",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "12",
        text: "Residents at risk for eloping have interventions in their care plan (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33333,
        inputType: "sample"
      },
      {
        number: "13",
        text: "For residents who have eloped: 1) Facility implemented new interventions, 2) Root cause analysis completed, 3) Lessons learned shared",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "14",
        text: "Safe Environment / free from Environmental Hazards on observation: F689 (Sample 3)",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "15",
        text: "Observe one resident being transferred. Preferably a mechanical lift transfer",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      }
    ]
  },

  // ============================================================================
  // SYSTEM 3: SKIN (100 points, 8 items)
  // ============================================================================
  {
    systemNumber: 3,
    name: "Skin",
    maxPoints: 100,
    items: [
      {
        number: "1",
        text: "Assessment includes risk factors and skin assessment done on all residents upon admission and as per policy (Braden Scale) (Sample 3)",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.66,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Weekly skin checks by Nurse and documented in the weekly skin UDA; wound measured weekly per wound care orders (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "3",
        text: "Observe one wound treatment completed by Nurse. Observe TX completed per MD order with sterile technique as indicated (Sample 1)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "4",
        text: "Interim care plan on new admits with wounds or Skin Assessment Score showing risk (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Risk factors addressed in comprehensive care plan with evaluation and revision as needed. Residents with wounds have appropriate wound care plan (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Does weekly oversight committee show evidence of wound documentation review to ensure accuracy of documentation (Sample 3)",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.66,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Nutritional status assessed and interventions implemented timely for residents at risk for skin breakdown (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Pressure relief devices are in place and working correctly (e.g., heel protectors, specialty mattresses) (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      }
    ]
  },

  // ============================================================================
  // SYSTEM 4: MED MANAGEMENT & WEIGHT LOSS (100 points, 16 items)
  // ============================================================================
  {
    systemNumber: 4,
    name: "Med Management & Weight Loss",
    maxPoints: 100,
    sections: [
      { name: "MEDICATION MGMT", startItem: 1, endItem: 3 },
      { name: "PSYCH. MGMT", startItem: 4, endItem: 12 },
      { name: "Weight Loss", startItem: 13, endItem: 16 }
    ],
    items: [
      // Section: MEDICATION MGMT
      {
        number: "1",
        text: "PRN ordered medications are provided to the resident per the physician's orders",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Parameters are in place for evaluating the resident's response to the medication (PRN effectiveness documented)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "3",
        text: "Medication Administration Records (eMAR) are accurate, complete, and followed as ordered",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.66,
        inputType: "sample"
      },
      // Section: PSYCH. MGMT
      {
        number: "4",
        text: "Psychotropic medications are appropriately care planned and target behavior is addressed",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.66,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Appropriate consents (Psychotropics) obtained and completed per the facility policy",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Diagnoses are coded in the medical record. Diagnosis and behavior are appropriately matched with the medication",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.66,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Non-pharm approaches used BEFORE prescribing med or increasing dose & for fam/resident education",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.66,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Schizo, schizophreniform, & schizoaffective disorder have documentation to support the diagnosis",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "9",
        text: "Diabetics: Insulin/CBG results documented, hyper/hypoglycemic events managed per policy",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "10",
        text: "Residents diagnosed with PTSD, SUD, have appropriate care planned interventions",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "11",
        text: "Level 2 PSSAR's are completed on residents accordingly. MDS coded correctly",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "12",
        text: "Facility must develop and implement a baseline care plan with necessary components within 48 hours of admission",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      // Section: Weight Loss
      {
        number: "13",
        text: "Observation: HOB elevated for enteral fed residents, IV Pole and pump are clean, enteral bag dated",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "14",
        text: "Appropriate interventions related to significant weight change are implemented",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "15",
        text: "Care plans are revised/updated with acute and/or significant weight change within required timeframe",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "16",
        text: "Evidence of Weekly NAR Meeting with corresponding IDT note on Residents with nutrition risk",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      }
    ]
  },

  // ============================================================================
  // SYSTEM 5: INFECTION CONTROL (100 points, 10 items)
  // ============================================================================
  {
    systemNumber: 5,
    name: "Infection Control",
    maxPoints: 100,
    items: [
      {
        number: "1",
        text: "Current infections are Tracked and Trended including mapping of infections as per IP surveillance",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "2",
        text: "CNO and ICP have implemented Antibiotic Stewardship Program with documentation",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "3",
        text: "Immunization records for Flu/Pneumo/Covid-19 are current in PCC (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "4",
        text: "Observation of cleaning process of glucometers in between resident use with evidence of cleaning documentation",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Observation of cleaning process of vital sign equipment in between resident use with evidence of cleaning documentation",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Staff Sample: Appropriate PPE Use: Interview/Observe staff re: Adherence to isolation precautions",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Resident Sample: Transmission Based Precautions: Facility follows CDC guidelines for appropriate isolation",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Facility implements hand washing/hygiene procedures to be followed by staff in accordance with accepted practices",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "9",
        text: "Observation: Facility and equipment are clean. Yes/No (hoyers/med carts, doors, tub rooms, equipment storage areas)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "10",
        text: "Observation: Random shower room checks - shower room clean and free from dirty linen",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      }
    ]
  },

  // ============================================================================
  // SYSTEM 6: TRANSFER/DISCHARGE (100 points, 10 items)
  // ============================================================================
  {
    systemNumber: 6,
    name: "Transfer/Discharge",
    maxPoints: 100,
    items: [
      {
        number: "1",
        text: "Licensed Nurses progress note includes condition of resident and where resident was transferred",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Order to transfer/discharge resident completed timely including reasoning for transfer",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "3",
        text: "LN documentation containing notification of resident/resident representative of transfer/discharge",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "4",
        text: "For AMA - Risk mitigation steps taken (i.e., if line present was it pulled?, valuables returned, etc.)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "5",
        text: "LN documentation containing notification of medical provider of transfer/discharge",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "6",
        text: "AMA form signed by resident/resident representative and facility staff or Nurse documenting resident refusal to sign",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "7",
        text: "Written notice of proposed Transfer/Discharge appropriately completed and given to resident/representative",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "8",
        text: "CSCD emergent transfer eval/E-Interact completed appropriately with current documentation of intervention prior to transfer",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "9",
        text: "Resident has appropriate resident specific discharge plan, including addressing needs post-discharge",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "10",
        text: "Written notification of Bed Hold form completed (at time of transfer and 24-hour follow-up)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      }
    ]
  },

  // ============================================================================
  // SYSTEM 7: ABUSE / SELF-REPORT / GRIEVANCES (100 points, 8 items)
  // ============================================================================
  {
    systemNumber: 7,
    name: "Abuse / Self-Report / Grievances",
    maxPoints: 100,
    items: [
      {
        number: "1",
        text: "Any grievances that meet criteria for abuse, the facility has followed the abuse investigation and reporting protocol",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.67,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Any Resident Council minutes that meet criteria for abuse, the facility has followed the abuse investigation and reporting protocol",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary",
        note: "Based on previous month's notes"
      },
      {
        number: "3",
        text: "Staff respond appropriately to potential abuse scenarios in interview. Staff can identify types of abuse and reporting requirements",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.67,
        inputType: "sample"
      },
      {
        number: "4",
        text: "Timeliness of reporting allegations: Alleged abuse or results of serious bodily injury reported per regulation",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Initiate and complete a thorough investigation of the alleged violation and make appropriate reports",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "6",
        text: "All residents are protected from physical and psychosocial harm during and after investigation",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Define how care provision will be changed and/or improved. Resident's care plan updated to reflect changes",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Coordination with QAPI: The Facility will communicate and coordinate situations through QAPI for trending and process improvement",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      }
    ]
  },

  // ============================================================================
  // SYSTEM 8: OBSERVATIONS & INTERVIEW (0 points - REFERENCE CHECKLIST ONLY)
  // ============================================================================
  {
    systemNumber: 8,
    name: "Observations & Interview",
    maxPoints: 0,
    isScored: false,
    description: "Quick reference/checklist sheet consolidating observation and interview items from other tabs. Used as a field guide during facility walkthrough - does NOT contribute to scoring.",
    observationItems: [
      {
        text: "Verify fall interventions are in place (per order and/or care plan) (Sample 3)",
        sourceSystem: 2,
        sourceItem: "9"
      },
      {
        text: "Safe Environment / free from Environmental Hazards on observation: F689 (Sample 3)",
        sourceSystem: 2,
        sourceItem: "14"
      },
      {
        text: "Observe one resident being transferred. Preferably a mechanical lift transfer, but any transfer will suffice",
        sourceSystem: 2,
        sourceItem: "15"
      },
      {
        text: "Observe one wound treatment completed by Nurse or Treatment Nurse. Observe treat completed per MD order with sterile technique",
        sourceSystem: 3,
        sourceItem: "3"
      },
      {
        text: "Pressure relief devices are in place and working correctly (e.g., heel protectors, specialty mattresses)",
        sourceSystem: 3,
        sourceItem: "8"
      },
      {
        text: "Restorative: Interventions from the care plan are implemented (RNA, splint application)",
        sourceSystem: null,
        sourceItem: null,
        note: "Additional observation item"
      },
      {
        text: "Observation: HOB elevated if applicable, IV Pole and pump are clean, enteral bag dated",
        sourceSystem: 4,
        sourceItem: "13"
      },
      {
        text: "Review: Current infections are Tracked and Trended including mapping of infections at minimum",
        sourceSystem: 5,
        sourceItem: "1"
      },
      {
        text: "Observation of cleaning process of glucometers in between Resident use with evidence of cleaning documentation",
        sourceSystem: 5,
        sourceItem: "4"
      },
      {
        text: "Observation of cleaning process of vital sign equipment in between Resident use with evidence of cleaning documentation",
        sourceSystem: 5,
        sourceItem: "5"
      },
      {
        text: "Staff Sample: Appropriate PPE Use: Interview/Observe staff re: appropriate use of PPE",
        sourceSystem: 5,
        sourceItem: "6"
      },
      {
        text: "Review: Facility implements hand washing/hygiene procedures to be followed by staff",
        sourceSystem: 5,
        sourceItem: "8"
      },
      {
        text: "Observation: Facility and equipment are clean. Yes/No (hoyers/med carts, doors, tub rooms, equipment storage)",
        sourceSystem: 5,
        sourceItem: "9"
      },
      {
        text: "Observation: Random shower room checks - shower room clean and free from dirty linen",
        sourceSystem: 5,
        sourceItem: "10"
      }
    ],
    interviewTopics: [
      "Abuse recognition and reporting procedures",
      "Fall intervention knowledge",
      "PPE use requirements",
      "Hand hygiene protocols",
      "Isolation precautions"
    ],
    items: [] // Empty - no scored items
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all scored systems (excludes System 8)
 */
const getScoredSystems = () => {
  return auditCriteria.filter(system => system.isScored !== false);
};

/**
 * Get total maximum points across all scored systems
 */
const getTotalMaxPoints = () => {
  return getScoredSystems().reduce((sum, system) => sum + system.maxPoints, 0);
};

/**
 * Get total item count across all scored systems
 */
const getTotalItemCount = () => {
  return getScoredSystems().reduce((sum, system) => sum + system.items.length, 0);
};

/**
 * Calculate score for a single item based on input value
 * @param {object} item - The audit item
 * @param {number} value - The input value (0-1 for binary, 0-3 for sample)
 * @returns {number} - Calculated points
 */
const calculateItemScore = (item, value) => {
  if (item.inputType === 'binary') {
    return value === 1 ? item.maxPoints : 0;
  }
  // Sample-based: value * multiplier, capped at maxPoints
  return Math.min(value * item.multiplier, item.maxPoints);
};

/**
 * Calculate total score for a system based on item responses
 * @param {number} systemNumber - The system number (1-7)
 * @param {object} responses - Object mapping item numbers to values
 * @returns {number} - Total points for the system
 */
const calculateSystemScore = (systemNumber, responses) => {
  const system = auditCriteria.find(s => s.systemNumber === systemNumber);
  if (!system || system.isScored === false) return 0;
  
  return system.items.reduce((total, item) => {
    const value = responses[item.number] || 0;
    return total + calculateItemScore(item, value);
  }, 0);
};

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================
const summary = {
  totalScoredSystems: 7,
  totalUnscoredSystems: 1,
  totalMaxPoints: 700,
  systemBreakdown: [
    { system: 1, name: "Change of Condition", items: 8, maxPoints: 100 },
    { system: 2, name: "Accidents, Falls, Incidents", items: 15, maxPoints: 100 },
    { system: 3, name: "Skin", items: 8, maxPoints: 100 },
    { system: 4, name: "Med Management & Weight Loss", items: 16, maxPoints: 100 },
    { system: 5, name: "Infection Control", items: 10, maxPoints: 100 },
    { system: 6, name: "Transfer/Discharge", items: 10, maxPoints: 100 },
    { system: 7, name: "Abuse / Self-Report / Grievances", items: 8, maxPoints: 100 },
    { system: 8, name: "Observations & Interview", items: 0, maxPoints: 0, note: "Reference only - not scored" }
  ],
  totalScoredItems: 75
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  auditCriteria,
  getScoredSystems,
  getTotalMaxPoints,
  getTotalItemCount,
  calculateItemScore,
  calculateSystemScore,
  summary
};
