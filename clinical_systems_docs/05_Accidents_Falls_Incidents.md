# 2. Accidents, Falls, Incidents Tab - Context Document

## Purpose
This is an **assessment checklist** for evaluating the facility's processes related to fall prevention, incident management, wandering/elopement prevention, and safe environment. Maximum score: **100 points**.

## Sheet Structure

### Header Section (Rows 1-4)
| Cell | Content | Notes |
|------|---------|-------|
| C2 | "Month:" | Label |
| D2 | Dropdown | Data validation: Lists!$D$3:$D$14 |

### Column Headers (Row 4)
Same structure as other assessment sheets:
- B4: "Category"
- C4: "Max\nPoints"
- D4: "# Met"
- E4: "Sample\nSize"
- F4: "Points"
- G4: "NOTES"

All with fill #CCCC00 (yellow), bold, centered

### Section 1: ACCIDENTS (Falls, Incident Reports) - Row 5 Header
**B5:G5** (merged): "ACCIDENTS (Falls, Incident Reports)"

### Assessment Items - Falls & Incidents (Rows 6-15)

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 6 | 1. All Incidents reviewed daily at IDT Meeting. Fall investigation completed post each fall with proof of IDT recommendation and CP updates. (sample 3) | 10 | 3 | 3.33 | =D6*3.33 |
| 7 | 2. Fall risk assessment completed accurately on admission and per policy (Sample 3) | 5 | 3 | 1.667 | =D7*1.667 |
| 8 | 3. Review high risk chart related to fall (i.e. fall with fx. or injury). Incidents and investigations completed within 5 days after the incident. Reported to state agency if meets criteria (Sample 1) | 10 | Y=1 N=0 | 10 | =D8*10 |
| 9 | 4. Physician was notified in a timely manner and documented in the medical record; (Sample 3) | 5 | 3 | 1.667 | =D9*1.667 |
| 10 | 5. Family/responsible party notified in a timely manner and documented in the medical record; (Sample 3) | 5 | 3 | 1.667 | =D10*1.667 |
| 11 | 6. Nursing documentation is evident 72 hours (q shift) post each occurrence. (Sample 3) | 5 | 3 | 1.667 | =D11*1.667 |
| 12 | 7. Neuro checks were completed per facility policy. (Sample 3) | 5 | 3 | 1.667 | =D12*1.667 |
| 13 | 8. Care plans are updated/revised timely after each incident. Interim Care Plan and Interventions in place within 24 hours of admission (for those at risk) and/or care plans are updated/revised post each occurrence. New intervention is consistent with the root cause analysis to prevent further incidents. (sample 3) | 10 | 3 | 3.33 | =D13*3.33 |
| 14 | 9. Verify fall interventions are in place (per order and/or care plan).(Sample 3) | 5 | 3 | 1.667 | =D14*1.667 |
| 15 | 10. Staff are knowledgeable about fall interventions as per care plan know to communicate ineffective interventions (Interview 3 staff). (Sample 3) | 5 | 3 | 1.667 | =D15*1.667 |

### Section 2: Wandering and Elopement F689 - Row 16 Header
**B16:G16** (merged): "Wandering and Elopement F689"

### Assessment Items - Wandering/Elopement (Rows 17-21)

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 17 | 11. Facility implements procedures for assessing or identifying, monitoring and managing residents at risk for elopement. Wanderguard orders are in place: checked for placement, and function (Sample 1) | 5 | Y=1 N=0 | 5 | =D17*5 |
| 18 | 12. Residents at risk for eloping have interventions in their care plan; (Sample 3) | 10 | 3 | 3.33333 | =D18*3.33333 |
| 19 | 13. For residents who have eloped; 1) The facility implemented new interventions to prevent further elopement. 2) The elopement was reported to the State Agency per the regulation. 3) Determine if the elopement was avoidable; did the facility appropriately assess the resident and have precautions/interventions in place to prevent the elopement; Evidence of elopement drills? (Sample 1) | 5 | Y=1 N=0 | 5 | =D19*5 |
| 20 | 14. Safe Environment / free from Environmental Hazards on observation:F689 (Sample 1) | 5 | Y=1 N=0 | 5 | =D20*5 |
| 21 | 15. Observe one resident being transferred. Preferably a mechanical lift transfer, but may observe any transfer appropriate slings/condition are in use. (F689) Verify accuracy of transfers as reflected in the Care plan. (Sample 1) | 10 | Y=1 N=0 | 10 | =D21*10 |

### Total Row (Row 22)
| Cell | Content | Formula |
|------|---------|---------|
| B22 | "Total Possible Score = 100            TOTAL SCORE:" | - |
| C22 | (calculated) | =SUM(C6:C21) |
| F22 | **Final Score** | =SUM(F6:F21) |

### Instruction Notes (Rows 23-25)
- **B23:G23** (merged): "Samples of 3 resident falls w/in the month and from both current or discharged and High Risk charts are preferred"
- **B24:G25** (merged): "Environmental focuses will be a) Handrails/bed frame are free from sharp edges/other hazards; b) Resident's room, equipment or building (e.g., transfer equipment, IV pumps, glucometers, thermometers, suction devices, oxygen equipment, nebulizers, furniture) are in good condition; c) Chemicals and toxins secured and not accessible; d) Unsafe hot liquids/water temps; e) Electrical safety (e.g., electrical cords, heat lamps, extension cords, power strips, electric blankets, heating pads, etc.); f) Light; g) Assistive Devices/Equipment Hazards (e.g., canes, walkers, on-powered & powered wheelchairs, etc.). F689"

### Documentation Section (Rows 27-46)
| Row | Content |
|-----|---------|
| 27 | "Residents reviewed:" |
| 32 | "Comments:" |
| 46 | "Completed by:" and "Date:" |

## Column Widths
| Column | Width |
|--------|-------|
| A | 2.75 |
| B | 43.0 |
| C | 8.75 |
| D | 13.0 |
| E | 8.13 |
| F | 8.75 |
| G | 45.25 |

## Data Validations
| Cell/Range | Type | Formula/Values |
|------------|------|----------------|
| D2 | List | Lists!$D$3:$D$14 (months) |
| D8, D17, D20, D21 | List | "1,0" (Yes/No binary) |

## Merged Cells
- B5:G5 (Section header - ACCIDENTS)
- B16:G16 (Section header - Wandering/Elopement)
- B23:G23 (Instruction text)
- B24:G25 (Instruction text - spans 2 rows)
- B34:F34 (Additional notes area)

## Formula Multipliers Reference
| Max Points | Sample Size | Multiplier |
|------------|-------------|------------|
| 10 | Y/N (1) | 10 |
| 10 | 3 | 3.33 |
| 5 | Y/N (1) | 5 |
| 5 | 3 | 1.667 |

## Key Assessment Focus Areas

### Fall Investigation & IDT Review (Item 1)
- Daily IDT meeting review of all incidents
- Fall investigation post each fall
- Proof of IDT recommendations
- Care plan updates documented

### Fall Risk Assessment (Item 2)
- Accurate completion on admission
- Per facility policy

### High Risk Falls (Item 3)
- Focus on falls with fracture or injury
- Investigations completed within 5 days
- State agency reporting if criteria met

### Notification Documentation (Items 4-5)
- Timely physician notification
- Family/responsible party notification
- Medical record documentation

### Post-Fall Documentation (Items 6-7)
- 72-hour q shift documentation
- Neuro checks per policy

### Care Plan Updates (Items 8, 13-14)
- Interim Care Plan within 24 hours
- Root cause analysis
- New interventions consistent with RCA
- Verification of interventions in place

### Staff Knowledge (Item 10)
- Interview 3 staff members
- Knowledge of fall interventions
- Communication of ineffective interventions

### Elopement Prevention (Items 11, 17-19)
- Wanderguard placement and function
- Care plan interventions for at-risk residents
- Post-elopement interventions
- State agency reporting
- Elopement drills evidence

### Safe Environment (Items 14, 20)
- Environmental hazard assessment
- F689 compliance

### Safe Transfers (Item 15)
- Mechanical lift observation
- Appropriate slings/conditions
- Care plan accuracy verification

## Key Regulatory References
- **F689**: CMS F-tag related to free from accident hazards
- Focus on fall investigation, documentation, and prevention
- Wandering/elopement procedures
- Environmental safety

## User Instructions
1. Select month from dropdown
2. Review 3 resident charts with falls/incidents during the month
3. Include at least 1 high-risk fall (with injury) if applicable
4. Score each item based on documentation review
5. For binary (Y/N) items: Enter 1 for Yes, 0 for No
6. For sample items: Enter number meeting criteria (0-3)
7. Document environmental observations
8. Record resident names, comments, signature and date
