# 4. Med mgnt.Weight loss Tab - Context Document

## Purpose
This is an **assessment checklist** for evaluating medication management, psychotropic medication oversight, and weight loss/nutrition management. It covers three distinct sections. Maximum score: **100 points**.

## Sheet Structure

### Header Section (Rows 1-4)
| Cell | Content | Notes |
|------|---------|-------|
| C2 | "Month:" | Label |
| D2 | Dropdown | Data validation: Lists!$D$3:$D$14 |

### Column Headers (Row 4)
Standard assessment header format with fill #CCCC00 (yellow), bold, centered

### Column Widths
| Column | Width |
|--------|-------|
| A | 3.25 |
| B | 45.88 |
| C | 8.75 |
| D | 13.0 |
| E | 9.75 |
| F | 8.75 |
| G | 38.0 |
| H | 16.5 |

---

## Section 1: MEDICATION MGMT (Rows 5-8)
**B5:G5** (merged): "MEDICATION MGMT"

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 6 | 1. PRN ordered medications are provided to the resident per the physician's orders.(including but not limited to BP, SSI, and Pain)(Sample 3) | 10 | 3 | 3.33 | =D6*3.33 |
| 7 | 2. Parameters are in place for evaluating the resident's response to the medication as applicable to standards of practice per state. Physician notification if abnormal. (Sample 3) | 10 | 3 | 3.33 | =D7*3.33 |
| 8 | 3. Medication Administration Records (eMAR) are accurate, complete, and followed in accordance with the prescriber's order, manufacturer's specifications, and accepted clinical standards of practice. All medications are available to administer. If not available, progress note is entered and physician notified.(Sample 3) | 5 | 3 | 1.66 | =D8*1.66 |

---

## Section 2: PSYCH. MGMT (Rows 9-18)
**B9:G9** (merged): "PSYCH. MGMT"

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 10 | 4. Psychotropic medications are appropriately care planned and target behavior is accurately reflected per MD orders.(Sample 3) | 5 | 3 | 1.66 | =D10*1.66 |
| 11 | 5. Appropriate consents (Psychotropics) obtained and completed per the facility policy/protocol. Reason for use matches diagnosis on order (Sample 3) | 10 | 3 | 3.33 | =D11*3.33 |
| 12 | 6. Diagnoses are coded in the medical record. Diagnosis and behavior are appropriate for medication and monitoring is in place.(Sample 3) | 5 | 3 | 1.66 | =D12*1.66 |
| 13 | 7. Non pharm approaches used BEFORE prescribing med or increasing dose & for fam/resident notification prior to dose increase. (unnecessary use of psychotropics)(Sample 3) | 5 | 3 | 1.66 | =D13*1.66 |
| 14 | 8. Schizo, schizophreniform, & schizoaffective disorder have documentation to support these dx AND the use of an indication.(Sample 3) | 5 | 3 | 1.667 | =D14*1.667 |
| 15 | 9. Diabetics: Insulin/CBG results documented, hyper/hypoglycemic events managed and protocol followed. Provider notified with changes, alert charting and CP updates as needed. (Sample 3) | 5 | 3 | 1.667 | =D15*1.667 |
| 16 | 10. Residents diagnosed with PTSD, SUD, have appropriate care planned interventions. (sample 1) | 5 | 1 | 5 | =D16*5 |
| 17 | 11. Level 2 PSSAR's are completed on residents accordingly. MDS coded correctly, CP includes level 2 recommendations (Sample 3) | 5 | 3 | 1.667 | =D17*1.667 |
| 18 | 12. Facility must develop and implement a baseline care plan with necessary components within 48 hours of a resident's admission (Include high risk meds, foley, dialysis, hospice). (Sample 3) | 10 | 3 | 3.33 | =D18*3.33 |

---

## Section 3: Weight Loss (Rows 19-23)
**B19:G19** (merged): "Weight Loss"

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 20 | 13. Observation: HOB elevated for enteral fed residents, IV Pole and pump are clean, enteral bags labeled appropriately, correct amount infusing per order, etc. (Sample 1) | 5 | Y=1 N=0 | 5 | =D20*5 |
| 21 | 14. Appropriate interventions related to significant weight change are implemented and documented in the medical record. Best Practice (Sample 3) | 5 | 3 | 1.667 | =D21*1.667 |
| 22 | 15. Care plans are revised/updated with acute and/or significant weight change with appropriate interventions (review orders and/or care plan as indicated) F692 (Sample 3) | 5 | 3 | 1.667 | =D22*1.667 |
| 23 | 16. Evidence of Weekly NAR Meeting with corresponding IDT note on Residents with significant weight change including MD. Responsible Party notification (Sample 3) | 5 | 3 | 1.667 | =D23*1.667 |

---

### Total Row (Row 24)
| Cell | Content | Formula |
|------|---------|---------|
| B24 | "Total Possible Score = 100            TOTAL SCORE:" | - |
| C24 | 100.0 (hardcoded) | - |
| F24 | **Final Score** | =SUM(F20:F23)+SUM(F10:F18)+SUM(F6:F8) |

Note: The total formula sums all three sections separately

### Documentation Section (Rows 26-44)
| Row | Content |
|-----|---------|
| 26 | "Residents reviewed:" |
| 31 | "Comments:" |
| 44 | "Completed by:" and "Date:" |

## Data Validations
| Cell | Type | Formula/Values |
|------|------|----------------|
| D2 | List | Lists!$D$3:$D$14 (months) |
| D20 | List | "1,0" (Yes/No binary) |

## Merged Cells
- B5:G5 (MEDICATION MGMT header)
- B9:G9 (PSYCH. MGMT header)
- B19:G19 (Weight Loss header)

## Formula Multipliers Reference
| Max Points | Sample Size | Multiplier |
|------------|-------------|------------|
| 10 | 3 | 3.33 |
| 5 | 3 | 1.66-1.667 |
| 5 | Y/N (1) | 5 |
| 5 | 1 | 5 |

## Assessment Focus Areas

### Medication Management (Items 1-3)
- PRN medication administration (BP, SSI, Pain)
- Effectiveness documentation
- State standards of practice compliance
- Physician notification for abnormal responses
- eMAR accuracy and completeness
- Medication availability tracking
- Progress notes for unavailable medications

### Psychotropic Management (Items 4-12)
- Care plan alignment with target behaviors
- MD order accuracy
- Proper consent documentation
- Reason for use matches diagnosis
- Diagnosis-medication matching
- Monitoring in place
- Non-pharmacological approaches first
- Family/resident notification prior to dose increase
- Schizophrenia spectrum documentation
- PTSD/SUD care planning
- PSSAR (Level 2) completion with MDS coding
- Care plan includes level 2 recommendations
- 48-hour baseline care plan (high risk meds, foley, dialysis, hospice)

### Diabetic Management (Item 9)
- Insulin/CBG documentation
- Hyper/hypoglycemic event management
- Protocol compliance
- Provider notification with changes
- Alert charting
- Care plan updates

### Weight Loss/Nutrition (Items 13-16)
- Enteral feeding observations (HOB, equipment, labels)
- Weight change interventions (Best Practice)
- Care plan updates for significant weight change (F692)
- Weekly NAR meetings with IDT note
- MD involvement
- Responsible Party notification

## Key Regulatory References
- **F692**: CMS F-tag for nutrition/weight management
- Psychotropic medication reduction programs
- Informed consent requirements
- PRN documentation requirements
- MDS coding accuracy

## Abbreviations Used
- **PRN**: Pro re nata (as needed)
- **BP**: Blood Pressure
- **SSI**: Sliding Scale Insulin
- **eMAR**: Electronic Medication Administration Record
- **HOB**: Head of Bed
- **PSSAR**: Psychoactive Drug Surveillance Assessment & Review
- **MDS**: Minimum Data Set
- **PTSD**: Post-Traumatic Stress Disorder
- **SUD**: Substance Use Disorder
- **NAR**: Nutrition At Risk
- **IDT**: Interdisciplinary Team
- **CBG**: Capillary Blood Glucose
- **CP**: Care Plan

## User Instructions
1. Select month from dropdown
2. Review charts across all three focus areas
3. Include residents on psychotropics, diabetics, and those with nutrition issues
4. For observation items, directly observe during rounds
5. Score each section based on documentation review
6. Total calculates from all three sections
7. Document residents reviewed and add comments
8. Sign and date upon completion
