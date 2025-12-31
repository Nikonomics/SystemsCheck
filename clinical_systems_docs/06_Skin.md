# 3. Skin Tab - Context Document

## Purpose
This is an **assessment checklist** for evaluating the facility's skin management and wound care processes. Focus areas include skin assessments, wound documentation, treatment compliance, care planning, and prevention measures. Maximum score: **100 points**.

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

### Section Header (Row 5)
**B5:G5** (merged): "SKIN MANAGMENTS"

Note: The section header contains a typo ("MANAGMENTS" instead of "MANAGEMENTS") - this matches the original Excel file.

### Assessment Items (Rows 6-13)

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 6 | 1. Assessment includes risk factors and skin assessment done on all residents upon admission, per policy/assessment tool. Treatment orders are obtained as appropriate (Sample 3) F686 | 20 | 3 | 6.66 | =D6*6.66 |
| 7 | 2. Weekly skin checks by Nurse and documented in the weekly skin UDA; wound measurements are documented accordingly (Sample 3) | 10 | 3 | 3.34 | =D7*3.34 |
| 8 | 3. Observe one wound treatment completed by Nurse. Observe TX completed per MD order, infection control practices, TX documented on TAR and Dignity. F686 (Sample 1) | 10 | 1 | 10 | =D8*10 |
| 9 | 4. Interim care plan on new admits with wounds or Skin Assessment Score showing high risk and interventions implemented (pressure reduction, turning schedule, etc.) (Sample 3) | 10 | 3 | 3.34 | =D9*3.34 |
| 10 | 5. Risk factors addressed in comprehensive care plan with evaluation and revision. Interventions evident on rounds (Sample 3) | 10 | 3 | 3.34 | =D10*3.34 |
| 11 | 6. Does weekly oversight committee show evidence of wound documentation review to include third-party notes, resident non-compliance, new wounds RCA, change of condition residents newly at risk, follow-up notification to practitioner and resident advocate, evident of IDT involvement? (Sample 3) | 20 | 3 | 6.66 | =D11*6.66 |
| 12 | 7. Nutritional status assessed and interventions implemented timely for residents with new or worsening wounds. (Observation and review RD assessments, RD UDAs and Documentation). Best Practice (Sample 3) | 10 | 3 | 3.34 | =D12*3.34 |
| 13 | 8. Pressure relief devices are in place and working correctly (e.g., heel protectors, special mattresses, gel cushions, etc.). (Care planned or ordered interventions are in place per Observations). F686 (Sample 3) | 10 | 3 | 3.34 | =D13*3.34 |

### Total Row (Row 14)
| Cell | Content | Formula |
|------|---------|---------|
| B14 | "Total Possible Score = 100            TOTAL SCORE:" | - |
| C14 | (calculated) | =SUM(C6:C13) |
| F14 | **Final Score** | =SUM(F6:F13) |

### Documentation Section (Rows 16-32)
| Row | Content |
|-----|---------|
| 16 | "Residents reviewed:" |
| 17-20 | (blank lines for resident names) |
| 21 | "Comments:" |
| 22-31 | (blank lines for comments) |
| 32 | "Completed by:" and "Date:" |

## Column Widths
| Column | Width |
|--------|-------|
| A | 3.13 |
| B | 47.13 |
| C | 8.75 |
| D | 13.0 |
| E | 8.0 |
| F | 8.75 |
| G | 38.0 |

## Data Validations
| Cell | Type | Formula/Values |
|------|------|----------------|
| D2 | List | Lists!$D$3:$D$14 (months) |

Note: This sheet uses sample-based scoring only (no Y/N binary items)

## Merged Cells
- B5:G5 (Section header)

## Formula Multipliers Reference
| Max Points | Sample Size | Multiplier |
|------------|-------------|------------|
| 20 | 3 | 6.66 |
| 10 | 3 | 3.34 |
| 10 | 1 | 10 |

## Assessment Focus Areas

### Risk Assessment (Item 1)
- Risk factor assessment on admission
- Skin assessment per policy/assessment tool
- Treatment orders obtained as appropriate
- F686 compliance

### Documentation (Items 2, 7)
- Weekly skin checks by licensed nurse
- Weekly skin UDA (User Defined Assessment)
- Wound measurements documented accordingly
- RD assessments and UDAs reviewed

### Treatment Observation (Item 3)
- Direct observation of wound treatment
- MD order compliance
- Infection control practices
- TAR and Dignity documentation
- F686 compliance

### Care Planning (Items 4, 5)
- Interim care plans for new admits with wounds
- High risk skin assessment score triggers care plan
- Interventions implemented (pressure reduction, turning schedule)
- Comprehensive care plan with evaluation and revision
- Interventions evident on rounds

### Weekly Oversight Committee (Item 6)
- Wound documentation review evidence
- Third-party notes review
- Resident non-compliance documentation
- New wounds RCA (Root Cause Analysis)
- Change of condition residents newly at risk
- Follow-up notification to practitioner
- Resident advocate notification
- IDT involvement documentation

### Nutrition Support (Item 7)
- Nutritional status assessment
- Timely interventions for new or worsening wounds
- RD assessments and UDAs reviewed
- Best Practice compliance

### Prevention (Item 8)
- Pressure relief devices in place
- Equipment working correctly
- Heel protectors, special mattresses, gel cushions
- Care planned or ordered interventions verified
- F686 compliance

## Key Regulatory References
- **F686**: CMS F-tag for pressure injury prevention and treatment
- Accurate wound staging and documentation
- Timely intervention implementation
- Care plan alignment with wound status

## Abbreviations Used
- **UDA**: User Defined Assessment
- **TX**: Treatment
- **TAR**: Treatment Administration Record
- **RD**: Registered Dietitian
- **RCA**: Root Cause Analysis
- **IDT**: Interdisciplinary Team

## User Instructions
1. Select month from dropdown
2. Review 3 resident charts with skin/wound issues
3. For observation item (row 8), directly observe one wound treatment
4. Score based on documentation and observation findings
5. Enter number meeting criteria (0-3 for sample items, 0-1 for observation)
6. Document resident names reviewed
7. Add comments regarding deficiencies or exemplary practices
8. Sign and date upon completion
