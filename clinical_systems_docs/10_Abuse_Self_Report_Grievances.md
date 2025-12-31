# 7. Abuse Self-Report Grievances Tab - Context Document

## Purpose
This is an **assessment checklist** for evaluating the facility's abuse prevention, investigation, and grievance handling processes. Covers grievance review, abuse reporting, staff knowledge, investigation procedures, resident protection, and QAPI coordination. Maximum score: **100 points**.

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
| A | 3.25 |
| B | 54.0 |
| C | 8.75 |
| D | 13.0 |
| E | 11.0 |
| F | 8.75 |
| G | 28.0 |

### Section Header (Row 5)
**B5:G5** (merged): "Abuse/ Self Report/ Grievance Review"

### Assessment Items (Rows 6-13)

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 6 | 1. Any grievances that meet criteria for abuse, the facility has followed the abuse protocol (including timeliness of reporting and full investigation). (Sample 3) | 20 | 3 | 6.67 | =D6*6.67 |
| 7 | 2. Any Resident Council minutes that meet criteria for abuse, the facility has followed the abuse protocol (including timeliness of reporting and full investigation). (Sample 1) | 10 | 1 (based on previous month's notes) | 10 | =D7*10 |
| 8 | 3. Staff respond appropriately to potential abuse scenarios in interview. Staff members know what the procedure is for reporting abuse F600 (Ask 3 staff). (Consider utilizing abuse walking rounds, scenarios, past experiences staff have with reporting allegations of abuse, etc.)(Sample 3) | 20 | 3 | 6.67 | =D8*6.67 |
| 9 | 4. Timeliness of reporting allegations: Alleged abuse or results of serious bodily injury: Report immediately but not later than 2 hours to the proper authorities (e.g., Administrator, state agency, adult protective services and to all other required agencies) in accordance with State law. Alleged neglect, exploitation, mistreatment, misappropriation of resident property, and does not result in serious bodily injury: Report to the proper authorities (e.g., Administrator, state agency, adult protective services and to all other required agencies) in accordance with State law within 24 hours. F609(Sample 3) | 10 | 3 | 3.34 | =D9*3.34 |
| 10 | 5. Initiate and complete a thorough investigation of the alleged violation and maintain documentation that the alleged violation was thoroughly investigated. F610(Sample 3) | 10 | 3 | 3.34 | =D10*3.34 |
| 11 | 6. All residents are protected from physical and psychosocial harm during and after the investigation (e.g., alleged perpetrator not allowed to work after allegations of abuse, staff separated the alleged victim and other residents at risk as a result of resident-to-resident altercation, developed plans to monitor and supervise the resident, including protection from resident sexualized behavior, etc.). F607. F609(Sample 3) | 10 | 3 | 3.34 | =D11*3.34 |
| 12 | 7. Define how care provision will be changed and/or improved. Resident's care plan must be revised if the resident's needs change as a result of the abuse incident; facility addresses psychosocial risks associated with alleged violations (including the reasonable person standard).(Sample 3) | 10 | 3 | 3.34 | =D12*3.34 |
| 13 | 8. Coordination with QAPI: The Facility will communicate and coordinate situations of abuse, neglect, misappropriation of resident property, and exploitation with the QAPI program, Resident Council, grievances and self reports to QAPI. The Quality Assessment & Assurance committee should monitor the reporting and investigation of the alleged violations, including assurances that residents are protected from further occurrences and that corrective actions are implemented as necessary.(Sample 1) | 10 | Y=1 N=0 | 10 | =D13*10 |

### Total Row (Row 14)
| Cell | Content | Formula |
|------|---------|---------|
| B14 | "Total Possible Score = 100            TOTAL SCORE:" | - |
| C14 | (calculated) | =SUM(C6:C13) |
| F14 | **Final Score** | =SUM(F6:F13) |

### Documentation Section (Rows 17-39)
| Row | Content |
|-----|---------|
| 17 | "Residents Reviewed:" |
| 23 | "Comments:" |
| 39 | "Completed by:" and "Date:" |

## Data Validations
| Cell | Type | Formula/Values |
|------|------|----------------|
| D2 | List | Lists!$D$3:$D$14 (months) |
| D13 | List | "1,0" (Yes/No binary) |

## Merged Cells
- B5:G5 (Section header)

## Formula Multipliers Reference
| Max Points | Sample Size | Multiplier |
|------------|-------------|------------|
| 20 | 3 | 6.67 |
| 10 | Y/N (1) | 10 |
| 10 | 3 | 3.34 |
| 10 | 1 | 10 |

## Assessment Focus Areas

### Grievance Handling (Item 1)
- Review of grievances filed during the month
- Identification of grievances meeting abuse criteria
- Abuse protocol followed
- Timeliness of reporting
- Full investigation completion

### Resident Council Review (Item 2)
- Review previous month's Resident Council minutes
- Identification of abuse-related concerns
- Abuse protocol followed
- Timeliness of reporting
- Full investigation completion
- Note: Uses previous month's notes as reference

### Staff Knowledge (Item 3)
- Interview 3 staff members (F600 compliance)
- Test knowledge of abuse scenarios
- Reporting procedures knowledge
- Consider utilizing:
  - Abuse walking rounds
  - Scenarios
  - Past experiences with reporting abuse
- Types of abuse identification:
  - Physical
  - Sexual
  - Verbal/psychological
  - Neglect
  - Financial/exploitation

### Timely Reporting (Item 4)
- **Serious bodily injury**: Report immediately, not later than 2 hours
- **Other allegations**: Report within 24 hours
- Report to:
  - Administrator
  - State agency
  - Adult Protective Services
  - All other required agencies per State law
- F609 compliance

### Investigation Process (Items 5-6)
- Thorough investigation initiation and completion (F610)
- Maintain documentation of thorough investigation
- Resident protection during investigation (F607, F609):
  - Alleged perpetrator removed from work
  - Separation of alleged victim and at-risk residents
  - Resident-to-resident altercation management
  - Plans for monitoring and supervision
  - Protection from resident sexualized behavior

### Care Improvement (Item 7)
- Care plan updates post-investigation
- Address needs changes resulting from abuse incident
- Address psychosocial risks
- Apply reasonable person standard

### QAPI Integration (Item 8)
- Communicate situations to QAPI program:
  - Abuse
  - Neglect
  - Misappropriation of resident property
  - Exploitation
- Coordinate with Resident Council
- Grievances and self-reports to QAPI
- Quality Assessment & Assurance committee monitoring:
  - Reporting monitoring
  - Investigation monitoring
  - Assurance of resident protection
  - Corrective action implementation

## Key Regulatory Requirements

### F-Tags Referenced
- **F600**: Abuse and neglect
- **F607**: Protection during investigation
- **F609**: Reporting allegations
- **F610**: Investigation requirements

### Federal Requirements
- 2-hour reporting of serious bodily injury
- 24-hour reporting of other allegations
- Investigation initiation within required timeframe
- Investigation completion within required timeframe
- State agency reporting
- Documentation maintenance

### Types of Reportable Incidents
1. **Physical Abuse**: Hitting, pushing, restraint misuse
2. **Sexual Abuse**: Non-consensual sexual contact
3. **Verbal/Psychological Abuse**: Threats, humiliation, intimidation
4. **Neglect**: Failure to provide necessary care
5. **Misappropriation**: Theft, financial exploitation
6. **Exploitation**: Taking advantage of resident

## Abbreviations Used
- **QAPI**: Quality Assurance and Performance Improvement
- **APS**: Adult Protective Services

## Staff Interview Questions (Sample)
1. "What would you do if you suspected a resident was being abused?"
2. "Can you name the different types of abuse?"
3. "What is the reporting timeline for suspected abuse?"
4. "Who do you report suspected abuse to?"
5. "What protections are in place for residents during investigations?"
6. "Have you participated in abuse walking rounds or scenarios?"

## User Instructions
1. Select month from dropdown
2. Review all grievances from the month for abuse criteria
3. Review previous month's Resident Council minutes
4. Interview 3 staff members using abuse scenario questions (consider walking rounds, scenarios)
5. Review any abuse investigations from the month
6. Verify QAPI coordination documentation
7. For binary items (Y/N): Enter 1 for Yes, 0 for No
8. For sample items: Enter number meeting criteria (0-3)
9. Document residents reviewed and add comments
10. Sign and date upon completion

## Important Notes
- High-weight items (20 points) indicate critical areas: grievance handling and staff knowledge
- Staff knowledge is heavily weighted (20 points) - use multiple interview approaches
- QAPI coordination demonstrates systematic improvement
- Previous month's Resident Council review ensures timely follow-up
- Reasonable person standard applies to psychosocial risk assessment
