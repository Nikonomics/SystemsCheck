# 1. Change of Condition Tab - Context Document

## Purpose
This is an **assessment checklist** for evaluating the facility's processes related to identifying, reporting, and managing changes in resident condition. Maximum score: **100 points**.

## Sheet Structure

### Header Section (Rows 1-4)
| Cell | Content | Notes |
|------|---------|-------|
| C2 | "Month:" | Label |
| D2 | Dropdown | Data validation: Lists!$D$3:$D$14 |

### Column Headers (Row 4)
| Column | Header | Width | Formatting |
|--------|--------|-------|------------|
| B | "Category" | 47.0 | Bold, centered, fill #CCCC00, medium left border |
| C | "Max\nPoints" | 8.75 | Bold, centered, fill #CCCC00, wrap text |
| D | "# Met" | 13.0 | Bold, centered, fill #CCCC00 |
| E | "Sample\nSize" | 8.88 | Bold, centered, fill #CCCC00, wrap text |
| F | "Points" | 8.75 | Bold, centered, fill #CCCC00 |
| G | "NOTES" | 34.88 | Bold, centered, fill #CCCC00 |

### Section Header (Row 5)
- **B5:G5** (merged): " Residents within the month  (3 charts) "
- Bold, centered

### Assessment Items (Rows 6-13)

| Row | Category Text | Max Points | Sample Size | Points Formula |
|-----|---------------|------------|-------------|----------------|
| 6 | 1. The facility has a system in place that verifies timely identification of change of condition. The facility has a system to review COCs daily (review of 24 hour report, orders etc. for proper follow-up and interventions). (Sample 1) | 20 | Y=1 N=0 | =D6*20 |
| 7 | 2. Notify of changes F580 (Sample 3) | 20 | 3 | =D7*6.66 |
| 8 | a) Physician notified. | 10 | 3 | =D8*3.34 |
| 9 | b) Resident representative notification | 10 | 3 | =D9*3.34 |
| 10 | 3. Every change in a resident's condition or significant resident care issues are noted/charted each shift for at least 72 hours or until the resident's condition is stabilized or the situation is otherwise resolved. (Sample 3) | 10 | 3 | =D10*3.34 |
| 11 | 4. Change of condition care planned (Sample 3) | 10 | 3 | =D11*3.34 |
| 12 | 5. Facility has an effective communication system to ensure front line staff (C.N.A's) are aware of change of conditions for their assigned residents. Interview 3 CNAs. (Sample 3) | 10 | 3 | =D12*3.34 |
| 13 | 6. Facility utilizes/monitors Vital Sign Alerts in PCC: Best Practice. For residents with alerts/changes in vital sign, the facility has documentation of appropriate follow up. (Sample 3) | 10 | 3 | =D13*3.34 |

### Total Row (Row 14)
| Cell | Content | Formula |
|------|---------|---------|
| B14 | "Total Possible Score = 100            TOTAL SCORE:" | - |
| C14 | (calculated) | =SUM(C6:C13) |
| F14 | **Final Score** | =SUM(F6:F13) |

**Formatting**: Bold, fill #CCCC00

### Documentation Section (Rows 16-32)
| Row | Content |
|-----|---------|
| 16 | "Residents reviewed:" |
| 17-20 | (blank lines for entering resident names) |
| 21 | "Comments:" |
| 22-31 | (blank lines for comments) |
| 32 | "Completed by:" and "Date:" labels |

## Data Validations
| Cell | Type | Formula/Values |
|------|------|----------------|
| D2 | List | Lists!$D$3:$D$14 (months) |
| D6 | List | "1,0" (Yes/No binary) |

## Scoring Logic

### Binary Items (Y=1, N=0)
- Row 6: If Yes (1), multiply by 20 = 20 points; If No (0), = 0 points

### Sample-Based Items (Sample of 3)
For items where 3 charts are reviewed:
- Max points ÷ 3 = points per chart met
- Example: Row 7 has 20 max points, formula =D7*6.66 (20÷3≈6.66)
- If 2 out of 3 met: 2 * 6.66 = 13.32 points

### Sub-Items
- Rows 8-9 are sub-items of row 7 (indented with spaces)
- Each worth 10 points, calculated separately

## Formula Multipliers Reference
| Max Points | Sample Size | Multiplier |
|------------|-------------|------------|
| 20 | Y/N (1) | 20 |
| 20 | 3 | 6.66 |
| 10 | 3 | 3.34 |

## Column Widths
| Column | Width |
|--------|-------|
| A | 3.25 (narrow spacer) |
| B | 47.0 |
| C | 8.75 |
| D | 13.0 |
| E | 8.88 |
| F | 8.75 |
| G | 34.88 |
| H | 26.88 |

## Formatting Details
- **Header row (4)**: Fill #CCCC00 (yellow), bold, thin borders
- **Section header (5)**: Bold, merged across columns
- **Data rows (6-13)**: Left-aligned text, centered numbers, wrap text enabled on column B
- **Total row (14)**: Fill #CCCC00, bold
- **Borders**: Medium on left edge (column B), thin elsewhere

## Key Assessment Focus Areas

### Daily COC Review System (Item 1)
- 24-hour report review
- Order review for proper follow-up
- Intervention tracking

### Notification Requirements F580 (Items 2, 8, 9)
- Physician notification
- Resident representative notification
- Documentation of notifications

### Documentation Standards (Item 3)
- Charting each shift for 72 hours minimum
- Continue until condition stabilized
- Continue until situation resolved

### Care Planning (Item 4)
- Timely care plan updates for COC
- Appropriate interventions documented

### Staff Communication (Item 5)
- CNA awareness of condition changes
- Interview 3 CNAs to verify

### Vital Sign Monitoring (Item 6)
- PCC Vital Sign Alerts utilized
- Documentation of follow-up for alerts
- Best Practice compliance

## User Instructions
1. Select the month from dropdown (D2)
2. Review 3 resident charts for the month
3. For each assessment item:
   - Enter number of charts that met the criteria (0-3) in column D
   - Or enter 1/0 for Yes/No items
4. Points calculate automatically in column F
5. Use column G for notes
6. Record resident names reviewed in rows 17-20
7. Add any additional comments
8. Sign and date at bottom
