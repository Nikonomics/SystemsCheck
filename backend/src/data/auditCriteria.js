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
  // SYSTEM 1: CHANGE OF CONDITION (100 points, 6 items + 2 sub-items)
  // ============================================================================
  {
    systemNumber: 1,
    name: "Change of Condition",
    maxPoints: 100,
    pageDescription: "Residents within the month (3 charts)",
    items: [
      {
        number: "1",
        text: "The facility has a system in place that verifies timely identification of change of condition. The facility has a system to review COCs daily (review of 24 hour report, orders etc. for proper follow-up and interventions). (Sample 1)",
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
        text: "a) Physician notified.",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "2b",
        text: "b) Resident representative notification",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "3",
        text: "Every change in a resident's condition or significant resident care issues are noted/charted each shift for at least 72 hours or until the resident's condition is stabilized or the situation is otherwise resolved. (Sample 3)",
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
        text: "Facility has an effective communication system to ensure front line staff (C.N.A's) are aware of change of conditions for their assigned residents. Interview 3 CNAs. (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Facility utilizes/monitors Vital Sign Alerts in PCC: Best Practice. For residents with alerts/changes in vital sign, the facility has documentation of appropriate follow up. (Sample 3)",
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
    pageDescription: "Samples of 3 resident falls w/in the month and from both current or discharged and High Risk charts are preferred",
    sections: [
      { name: "ACCIDENTS (Falls, Incident Reports)", items: "1-10" },
      { name: "Wandering and Elopement F689", items: "11-15" }
    ],
    environmentalFocuses: [
      "Handrails/bed frames",
      "Equipment condition",
      "Chemicals/toxins",
      "Hot liquids/water temps",
      "Electrical safety",
      "Lighting",
      "Assistive devices/equipment hazards"
    ],
    items: [
      // Section: ACCIDENTS (Falls, Incident Reports)
      {
        number: "1",
        text: "All Incidents reviewed daily at IDT Meeting. Fall investigation completed post each fall with proof of IDT recommendation and CP updates (Sample 3)",
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
        text: "Review high risk chart related to fall (i.e. fall with fx. or injury). Incidents and investigations completed within 5 days after the incident. Reported to state agency if meets criteria (Sample 1)",
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
        text: "Family/responsible party notified in a timely manner and documented in the medical record (Sample 3)",
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
        text: "Care plans are updated/revised timely after each incident. Interim Care Plan and Interventions in place within 24 hours of admission (for those at risk) and/or care plans are updated/revised post each occurrence. New intervention is consistent with the root cause analysis to prevent further incidents (Sample 3)",
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
        text: "Staff are knowledgeable about fall interventions as per care plan, know to communicate ineffective interventions (Interview 3 staff) (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      // Section: Wandering and Elopement F689
      {
        number: "11",
        text: "Facility implements procedures for assessing or identifying, monitoring and managing residents at risk for elopement. Wanderguard orders are in place: checked for placement, and function (Sample 1)",
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
        text: "For residents who have eloped: 1) The facility implemented new interventions to prevent further elopement. 2) The elopement was reported to the State Agency per the regulation. 3) Determine if the elopement was avoidable; did the facility appropriately assess the resident and have precautions/interventions in place to prevent the elopement; Evidence of elopement drills? (Sample 1)",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "14",
        text: "Safe Environment / free from Environmental Hazards on observation: F689 (Sample 1)",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "15",
        text: "Observe one resident being transferred. Preferably a mechanical lift transfer, but may observe any transfer; appropriate slings/condition are in use (F689). Verify accuracy of transfers as reflected in the Care plan (Sample 1)",
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
    sections: [
      { name: "SKIN MANAGEMENTS", items: "1-8" }
    ],
    items: [
      {
        number: "1",
        text: "Assessment includes risk factors and skin assessment done on all residents upon admission, per policy/assessment tool. Treatment orders are obtained as appropriate (Sample 3) F686",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.66,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Weekly skin checks by Nurse and documented in the weekly skin UDA; wound measurements are documented accordingly (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "3",
        text: "Observe one wound treatment completed by Nurse. Observe TX completed per MD order, infection control practices, TX documented on TAR and Dignity. F686 (Sample 1)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "4",
        text: "Interim care plan on new admits with wounds or Skin Assessment Score showing high risk and interventions implemented (pressure reduction, turning schedule, etc.) (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Risk factors addressed in comprehensive care plan with evaluation and revision. Interventions evident on rounds (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Does weekly oversight committee show evidence of wound documentation review to include third-party notes, resident non-compliance, new wounds RCA, change of condition residents newly at risk, follow-up notification to practitioner and resident advocate, evident of IDT involvement? (Sample 3)",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.66,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Nutritional status assessed and interventions implemented timely for residents with new or worsening wounds. (Observation and review RD assessments, RD UDAs and Documentation). Best Practice (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Pressure relief devices are in place and working correctly (e.g., heel protectors, special mattresses, gel cushions, etc.). (Care planned or ordered interventions are in place per Observations). F686 (Sample 3)",
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
      { name: "MEDICATION MGMT", items: "1-3" },
      { name: "PSYCH. MGMT", items: "4-12" },
      { name: "Weight Loss", items: "13-16" }
    ],
    items: [
      // Section: MEDICATION MGMT
      {
        number: "1",
        text: "PRN ordered medications are provided to the resident per the physician's orders (including but not limited to BP, SSI, and Pain) (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Parameters are in place for evaluating the resident's response to the medication as applicable to standards of practice per state. Physician notification if abnormal (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "3",
        text: "Medication Administration Records (eMAR) are accurate, complete, and followed in accordance with the prescriber's order, manufacturer's specifications, and accepted clinical standards of practice. All medications are available to administer. If not available, progress note is entered and physician notified (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.66,
        inputType: "sample"
      },
      // Section: PSYCH. MGMT
      {
        number: "4",
        text: "Psychotropic medications are appropriately care planned and target behavior is accurately reflected per MD orders (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.66,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Appropriate consents (Psychotropics) obtained and completed per the facility policy/protocol. Reason for use matches diagnosis on order (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Diagnoses are coded in the medical record. Diagnosis and behavior are appropriate for medication and monitoring is in place (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.66,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Non-pharm approaches used BEFORE prescribing med or increasing dose & for fam/resident notification prior to dose increase (unnecessary use of psychotropics) (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.66,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Schizo, schizophreniform, & schizoaffective disorder have documentation to support these dx AND the use of an indication (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "9",
        text: "Diabetics: Insulin/CBG results documented, hyper/hypoglycemic events managed and protocol followed. Provider notified with changes, alert charting and CP updates as needed (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "10",
        text: "Residents diagnosed with PTSD, SUD, have appropriate care planned interventions (Sample 1)",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "11",
        text: "Level 2 PSSAR's are completed on residents accordingly. MDS coded correctly, CP includes level 2 recommendations (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "12",
        text: "Facility must develop and implement a baseline care plan with necessary components within 48 hours of a resident's admission (Include high risk meds, foley, dialysis, hospice) (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      // Section: Weight Loss
      {
        number: "13",
        text: "Observation: HOB elevated for enteral fed residents, IV Pole and pump are clean, enteral bags labeled appropriately, correct amount infusing per order, etc. (Sample 1)",
        maxPoints: 5,
        sampleSize: 1,
        multiplier: 5,
        inputType: "binary"
      },
      {
        number: "14",
        text: "Appropriate interventions related to significant weight change are implemented and documented in the medical record. Best Practice (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "15",
        text: "Care plans are revised/updated with acute and/or significant weight change with appropriate interventions (review orders and/or care plan as indicated) F692 (Sample 3)",
        maxPoints: 5,
        sampleSize: 3,
        multiplier: 1.667,
        inputType: "sample"
      },
      {
        number: "16",
        text: "Evidence of Weekly NAR Meeting with corresponding IDT note on Residents with significant weight change including MD. Responsible Party notification (Sample 3)",
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
    sections: [
      { name: "Infection Control", items: "1-10" }
    ],
    items: [
      {
        number: "1",
        text: "Current infections are Tracked and Trended including mapping of infections and organism",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "2",
        text: "CNO and ICP have implemented Antibiotic Stewardship Program with documentation of QAPI meeting that involves Medical Director",
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
        text: "Observation of cleaning process of glucometers in between resident use with evidence of staff knowledge on dry times. Logs are accurate and maintained (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Observation of cleaning process of vital sign equipment in between resident use with evidence of staff knowledge on dry times (Observe 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "6",
        text: "Staff Sample: Appropriate PPE Use: Interview/Observe staff re: Adherence to precaution signs, appropriate use of PPE (including wearing appropriate PPE and donning/doffing appropriately) per CDC recommendations. F880 (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Resident Sample: Transmission Based Precautions: Facility follows CDC guidelines/policy regarding transmission based precautions (i.e. EBP, TBP indicated for Cdiff, COVID-19, influenza, etc. per CDC guidelines). F880 (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Facility implements hand washing/hygiene procedures to be followed by staff involved in direct resident contact and consistent with acceptable standards of practices. Universal precautions must be used in the care of all residents (observe 3 staff members)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "9",
        text: "Observation: Facility and equipment are clean. Yes/No (hoyers/med carts, doors, floors etc.)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "10",
        text: "Observation: Random shower room checks - shower room clean and free from dirty linens (Observe 3)",
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
    sections: [
      { name: "TRANSFER/DISCHARGES", items: "1-10" }
    ],
    items: [
      {
        number: "1",
        text: "Licensed Nurses progress note includes condition of resident and where resident transferred/discharged to (home, hospital, SNF, etc.) Discharge summary complete (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Order to transfer/discharge resident completed timely including reasoning for transfer/discharge and location (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "3",
        text: "LN documentation containing notification of resident/resident representative of the transfer/discharge (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.33,
        inputType: "sample"
      },
      {
        number: "4",
        text: "For AMA - Risk mitigation steps taken (i.e., if line present was it pulled?, if unsafe or dangerous were notifications to resident representative, APS and PD made if needed? (Sample 1)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "5",
        text: "LN documentation containing notification of medical provider of transfer/discharge/AMA (Sample 1)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "6",
        text: "AMA form signed by resident/resident representative and facility staff or Nurse documented on the form refused to sign (Sample 1)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary"
      },
      {
        number: "7",
        text: "Written notice of proposed Transfer/Discharge appropriately completed and given to resident/responsible party, if applicable signed by the attending physician (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "8",
        text: "CSCD emergent transfer eval/E-Interact completed appropriately with current VS and BS if applicable and name of person at hospital that received report (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "9",
        text: "Resident has appropriate resident specific discharge plan, including addressing risk identified through social determinants information assessed upon admission (Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "10",
        text: "Written notification of Bed Hold form completed (at time of transfer and 24-hour notification) and given to resident/responsible party. Ombudsman notified of discharges (Sample 3)",
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
    name: "Abuse/Self Report/Grievance Review",
    maxPoints: 100,
    sections: [
      { name: "ABUSE/ SELF REPORT/ GRIEVANCE REVIEW", items: "1-8" }
    ],
    items: [
      {
        number: "1",
        text: "Any grievances that meet criteria for abuse, the facility has followed the abuse protocol (including timeliness of reporting and full investigation). (Sample 3)",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.67,
        inputType: "sample"
      },
      {
        number: "2",
        text: "Any Resident Council minutes that meet criteria for abuse, the facility has followed the abuse protocol (including timeliness of reporting and full investigation). (Sample 1)",
        maxPoints: 10,
        sampleSize: 1,
        multiplier: 10,
        inputType: "binary",
        note: "Based on previous month's notes"
      },
      {
        number: "3",
        text: "Staff respond appropriately to potential abuse scenarios in interview. Staff members know what the procedure is for reporting abuse F600 (Ask 3 staff). (Consider utilizing abuse walking rounds, scenarios, past experiences staff have with reporting allegations of abuse, etc.)(Sample 3)",
        maxPoints: 20,
        sampleSize: 3,
        multiplier: 6.67,
        inputType: "sample"
      },
      {
        number: "4",
        text: "Timeliness of reporting allegations: Alleged abuse or results of serious bodily injury: Report immediately but not later than 2 hours to the proper authorities (e.g., Administrator, state agency, adult protective services and to all other required agencies) in accordance with State law. Alleged neglect, exploitation, mistreatment, misappropriation of resident property, and does not result in serious bodily injury: Report to the proper authorities (e.g., Administrator, state agency, adult protective services and to all other required agencies) in accordance with State law within 24 hours. F609(Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "5",
        text: "Initiate and complete a thorough investigation of the alleged violation and maintain documentation that the alleged violation was thoroughly investigated. F610(Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "6",
        text: "All residents are protected from physical and psychosocial harm during and after the investigation (e.g., alleged perpetrator not allowed to work after allegations of abuse, staff separated the alleged victim and other residents at risk as a result of resident-to-resident altercation, developed plans to monitor and supervise the resident, including protection from resident sexualized behavior, etc.). F607. F609(Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "7",
        text: "Define how care provision will be changed and/or improved. Resident's care plan must be revised if the resident's needs change as a result of the abuse incident; facility addresses psychosocial risks associated with alleged violations (including the reasonable person standard).(Sample 3)",
        maxPoints: 10,
        sampleSize: 3,
        multiplier: 3.34,
        inputType: "sample"
      },
      {
        number: "8",
        text: "Coordination with QAPI: The Facility will communicate and coordinate situations of abuse, neglect, misappropriation of resident property, and exploitation with the QAPI program, Resident Council, grievances and self reports to QAPI. The Quality Assessment & Assurance committee should monitor the reporting and investigation of the alleged violations, including assurances that residents are protected from further occurrences and that corrective actions are implemented as necessary.(Sample 1)",
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
        number: "1",
        text: "Verify fall interventions are in place (per order and/or care plan). (Sample 3)",
        sourceSystem: 2,
        sourceItem: "9"
      },
      {
        number: "2",
        text: "Safe Environment / free from Environmental Hazards on observation: F689 (Sample 1)",
        sourceSystem: 2,
        sourceItem: "14"
      },
      {
        number: "3",
        text: "Observe one resident being transferred. Preferably a mechanical lift transfer, but may observe any transfer appropriate slings/condition are in use. (F689) Verify accuracy of transfers as reflected in the Care plan. (Sample 1)",
        sourceSystem: 2,
        sourceItem: "15"
      },
      {
        number: "4",
        text: "Observe one wound treatment completed by Nurse or Treatment Nurse. Observe treatment completed per MD order, infection control practices, pain control, TX documented on MAR and Dignity. F686 (Sample 3)",
        sourceSystem: 3,
        sourceItem: "3"
      },
      {
        number: "5",
        text: "Pressure relief devices are in place and working correctly (e.g., heel protectors, special mattresses, gel cushions, etc.). (Care planned or ordered interventions are in place per Observations). F686 (Sample 3)",
        sourceSystem: 3,
        sourceItem: "8"
      },
      {
        number: "6",
        text: "Restorative: Interventions from the care plan are implemented (RNA, splint application, etc.). Records review & observations. (Sample 3)",
        sourceSystem: null,
        sourceItem: null,
        note: "Additional observation item"
      },
      {
        number: "7",
        text: "Observation: HOB elevated if applicable, IV Pole and pump are clean, enteral bags labeled appropriately, correct amount infusing per order, etc. F692 (Sample 1)",
        sourceSystem: 4,
        sourceItem: "13"
      },
      {
        number: "8",
        text: "Review: Current infections are Tracked and Trended including mapping of infections and organism",
        sourceSystem: 5,
        sourceItem: "1"
      },
      {
        number: "9",
        text: "Observation of cleaning process of glucometers in between Resident use with evidence of staff knowledge on dry times. Logs are accurate and maintained",
        sourceSystem: 5,
        sourceItem: "4"
      },
      {
        number: "10",
        text: "Observation of cleaning process of vital sign equipment in between Resident use with evidence of staff knowledge on dry times. (Observe 3)",
        sourceSystem: 5,
        sourceItem: "5"
      },
      {
        number: "11",
        text: "Staff Sample: Appropriate PPE Use: Interview/Observe staff re: appropriate use of PPE (including wearing appropriate PPE and donning/doffing appropriately) per CDC recommendations. F880 (Sample 3)",
        sourceSystem: 5,
        sourceItem: "6"
      },
      {
        number: "12",
        text: "Review: Facility implements hand washing/hygiene procedures to be followed by staff involved in direct resident contact and consistent with acceptable standards of practices. Universal precautions must be used in the care of all residents. Evidence of current training? (observe 3 staff members).",
        sourceSystem: 5,
        sourceItem: "8"
      },
      {
        number: "13",
        text: "Observation: Facility and equipment are clean. Yes/No (hoyers/med carts, doors, floors etc)",
        sourceSystem: 5,
        sourceItem: "9"
      },
      {
        number: "14",
        text: "Observation: Random shower room checks - shower room clean and free from dirty linens (Observe 3)",
        sourceSystem: 5,
        sourceItem: "10"
      }
    ],
    // Staff Interviews column exists in Excel but has no items listed
    interviewTopics: [],
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
    { system: 8, name: "Observations & Interview", observationItems: 14, maxPoints: 0, note: "Reference checklist - not scored" }
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
