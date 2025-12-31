# 6. Transfer.Discharge Tab - Context Document

## Purpose
This is an **assessment checklist** for evaluating the facility's transfer and discharge processes. Covers documentation, notification requirements, AMA (Against Medical Advice) procedures, discharge planning, and bed hold notifications. Maximum score: **100 points**.

## Sheet Structure

### Header Section (Rows 1-4)
| Cell | Content | Notes |
|------|---------|-------|
| C2 | "Month:" | Label |
| D2 | Dropdown | Data validation: Lists!$D$3:$D$14 |

### Column Headers (Row 4)
Standard assessment header format:
- B4: "Category"
- C4: "Max\nPoints"
- D4: "# Met"
- E4: "Sample\nSize"
- F4: "Points"
- G4: "NOTES"

All with fill #CCCC00 (yellow), bold, centered

### Column Widths
| Column | Width |
|--------|-------|
| A | 3.5 |
| B | 47.0 |
| C | 8.75 |
| D | 13.0 |
| E | 8.88 |
| F | 8.75 |
| G | 53.0 |

### Section Header (Row 5)
**B5:G5** (merged): "TRANSFER/DISCHARGES"

### Assessment Items (Rows 6-15)

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 6 | 1. Licensed Nurses progress note includes condition of resident and where resident transferred/discharged to (home, hospital, SNF, etc.) Discharge summary complete. (Sample 3) | 10 | 3 | 3.33 | =D6*3.33 |
| 7 | 2. Order to transfer/discharge resident completed timely including reasoning for transfer/discharge and location. (Sample 3) | 10 | 3 | 3.33 | =D7*3.33 |
| 8 | 3. LN documentation containing notification of resident/resident representative of the transfer/discharge.(Sample 3) | 10 | 3 | 3.33 | =D8*3.33 |
| 9 | 4. For AMA - Risk mitigation steps taken (i.e., if line present was it pulled?, if unsafe or dangerous were notifications to resident representative, APS and PD made if needed?(Sample 1) | 10 | 1 | 10 | =D9*10 |
| 10 | 5. LN documentation containing notification of medical provider of transfer/discharge/AMA (Sample 1) | 10 | 1 | 10 | =D10*10 |
| 11 | 6. AMA form signed by resident/resident representative and facility staff or Nurse documented on the form refused to sign.(Sample 1) | 10 | 1 | 10 | =D10*10 |
| 12 | 7. Written notice of proposed Transfer/Discharge appropriately completed and given to resident/responsible party, if applicable signed by the attending physician (Sample 3) | 10 | 3 | 3.34 | =D12*3.34 |
| 13 | 8. CSCD emergent transfer eval/E-Interact completed appropriately with current VS and BS if applicable and name of person at hospital that received report (Sample 3) | 10 | 3 | 3.34 | =D13*3.34 |
| 14 | 9. Resident has appropriate resident specific discharge plan, including addressing risk identified through social determinants information assessed upon admission (Sample 3) | 10 | 3 | 3.34 | =D14*3.34 |
| 15 | 10. Written notification of Bed Hold form completed (at time of transfer and 24-hour notification) and given to resident/responsible party. Ombudsman notified of discharges (Sample 3) | 10 | 3 | 3.34 | =D15*3.34 |

### Calculation Rows (Rows 16, 18)
| Cell | Content | Formula |
|------|---------|---------|
| C16 | (intermediate sum) | =SUM(C6:C15) |
| F16 | (intermediate sum) | =SUM(F6:F15) |
| B18 | "Total Possible Score = 100 TOTAL SCORE:" | - |
| C18 | 100.0 | Hardcoded |
| F18 | **Final Score** | =SUM(F6:F15) |

Note: There appears to be redundancy in the total rows

### Documentation Section (Rows 20-37)
| Row | Content |
|-----|---------|
| 20 | "Residents reviewed:" |
| 25 | "Comments:" |
| 37 | "Completed by:" and "Date:" |

## Data Validations
| Cell | Type | Formula/Values |
|------|------|----------------|
| D2 | List | Lists!$D$3:$D$14 (months) |

Note: No Y/N binary validations - all items use numeric samples

## Merged Cells
- B5:G5 (Section header)

## Formula Note - Known Error
**Row 11**: Formula references D10 instead of D11 (=D10*10)
- This is an error in the original template
- Should be =D11*10 for correct calculation

## Formula Multipliers Reference
| Max Points | Sample Size | Multiplier |
|------------|-------------|------------|
| 10 | 1 | 10 |
| 10 | 3 | 3.33-3.34 |

## Assessment Focus Areas

### Transfer Documentation (Items 1-3, 5)
- Licensed Nurse progress notes
- Resident condition documentation
- Transfer destination (home, hospital, SNF, etc.)
- Discharge summary complete
- Physician orders with reasoning and location
- Notification documentation

### AMA Procedures (Items 4, 6)
- Risk mitigation steps
- Line removal if applicable
- Unsafe/dangerous situation notifications
- Resident representative notification
- APS (Adult Protective Services) notification if needed
- PD (Police Department) notification if needed
- Signed AMA form
- Refusal documentation if resident won't sign

### Formal Notices (Items 7, 10)
- Written Transfer/Discharge notice
- Proper completion and delivery
- Attending physician signature if applicable
- Bed Hold notification at time of transfer
- 24-hour follow-up notification
- Given to resident/responsible party
- Ombudsman notification for discharges

### Discharge Planning (Items 8, 9)
- CSCD (Change in Status/Condition Documentation)
- E-Interact tool completion
- Current VS (vital signs) documentation
- BS (blood sugar) if applicable
- Name of person at hospital who received report
- Resident-specific discharge plan
- Social determinants information
- Risk identification from admission assessment

## Key Regulatory Requirements
- Proper notification timelines
- Required documentation elements
- Resident/representative communication
- Medical provider notification
- Bed hold policy compliance
- Ombudsman notification for discharges

## Abbreviations Used
- **LN**: Licensed Nurse
- **AMA**: Against Medical Advice
- **CSCD**: Change in Status/Condition Documentation
- **E-Interact**: INTERACT (Interventions to Reduce Acute Care Transfers) Emergency transfer tool
- **VS**: Vital Signs
- **BS**: Blood Sugar
- **APS**: Adult Protective Services
- **PD**: Police Department
- **SNF**: Skilled Nursing Facility

## Sample Selection Guidelines
- Review transfers/discharges from the review month
- Include at least one AMA if applicable
- Include both planned discharges and emergent transfers
- Mix of hospital transfers and home discharges if available

## User Instructions
1. Select month from dropdown
2. Review 3 resident charts with transfers/discharges during the month
3. For AMA-specific items (rows 9, 10, 11): Review 1 AMA case if applicable, enter 1 if met, 0 if not
4. For sample items: Enter number meeting criteria (0-3)
5. Document resident names reviewed
6. Add comments regarding deficiencies or concerns
7. Sign and date upon completion

## Important Considerations
- Emergency transfers require E-Interact completion with VS/BS and receiving person's name
- AMA procedures have specific documentation requirements including risk mitigation
- Bed hold notifications have timing requirements (at transfer and 24-hour)
- Discharge planning should address social determinants of health
- Ombudsman must be notified of all discharges
