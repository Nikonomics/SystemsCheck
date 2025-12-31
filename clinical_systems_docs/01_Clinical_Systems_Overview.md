# Clinical Systems Overview Tab - Context Document

## Purpose
This is the **main dashboard** sheet that provides a monthly summary view of all 7 clinical assessment categories. It displays scores for each month of the year, calculates averages, and allows facility/resource selection.

## Sheet Structure

### Header Section (Rows 1-5)
- **Row 1**: Title "MONTHLY CLINICAL SYSTEMS REVIEW CHECKLISTS" (merged A1:M1, bold, 12pt, centered)
- **Row 2**: Spacer row (height: 3.75)
- **Row 3**: 
  - A3: "Facility Name:" label
  - B3: Dropdown for facility selection (data validation from Lists!B3:B13)
  - D3: "Clinical Resource:" label
  - F3: Dropdown for clinical resource (data validation from Lists!C3:C7)
- **Row 4**: Secondary facility dropdown (A4, data validation with inline list of facilities)
- **Row 5**: Spacer

### Column Headers (Rows 6-7)
- **Row 6**:
  - A6: "Systems" (bold, centered, 10pt)
  - B6:M6: "LEVELS" (merged, bold, centered)
- **Row 7** (month headers, all bold, 10pt, centered, **fill color: #F4B083** orange):
  - B7: "Jan", C7: "Feb", D7: "Mar", E7: "Apr", F7: "May", G7: "Jun"
  - H7: "Jul", I7: "Aug", J7: "Sep", K7: "Oct", L7: "Nov", M7: "Dec"
  - N7: "Average" (**fill: #CC9900** gold)
  - O7: "Previous Annual year AVG" (**fill: #CCCC00** yellow-green)

### Data Section (Rows 8-14) - The 7 Clinical Systems
| Row | Column A (System Name) | Column N (Formula) | Column O (Previous Year) |
|-----|------------------------|--------------------|-----------------------------|
| 8 | 1. Change of Condition | =AVERAGE(B8:M8) | 92.81818 |
| 9 | 2. Accidents (Falls, Incident Reports) | =AVERAGE(B9:M9) | 91.72727 |
| 10 | 3. Skin | =AVERAGE(B10:M10) | 92.09091 |
| 11 | 4. Meds & Nutrition | =AVERAGE(B11:M11) | 92.45455 |
| 12 | 5. Infection Prevention | =AVERAGE(B12:M12) | 96.18182 |
| 13 | 6. Transfer/Discharges | =AVERAGE(B13:M13) | 91.81818 |
| 14 | 7. Abuse/Grievances | =AVERAGE(B14:M14) | 99.3 |

### Summary Row (Row 15)
- A15: "Average" (fill: #F4B083)
- B15:M15: Column averages, each with formula =AVERAGE(Bx8:Bx14) where x is the column letter

### Notes Section (Rows 16-22)
- A16: "NOTE:"
- A17: "1. Create an action plan (PIP) for areas that need improvement"
- A18: "2. Action plans (PIP's) should be monitored in the QA&A Committee at least quarterly"
- A22: Revision history text

### Hidden Lookup Data (Column P)
Column P contains a list of facility names used for dropdowns:
- P2: "Alta Mesa Health and Rehabilitation"
- P3: "Chandler Post Acute and Rehabilitation"
- P5: "Desert Blossom Health and Rehabilitation Center"
- P6: "Fountain Hills Post Acute"
- P7: "Heritage Court Post Acute of Scottsdale"
- P8: "Mission Palms Post Acute"
- P9: "Montecito Post Acute Care and Rehabilitation"
- P10: "Osborn Health and Rehabilitation"
- P11: "Phoenix Mountain Post Acute"
- P12: "Shea Post Acute Rehabilitation Center"
- P13: "Tempe Post Acute"
- P14: "Wellsprings of Gilbert"

## Column Widths
| Column | Width |
|--------|-------|
| A | 40.25 |
| B-N | 11-13 (varies) |
| O | 8.88 |

## Formatting Details
- **Header row fill colors**: Orange (#F4B083) for months, Gold (#CC9900) for Average, Yellow-green (#CCCC00) for Previous Year
- **Font**: 10pt for data, 12pt for title
- **Alignment**: Center for headers and data cells, Left for system names
- **Borders**: Thin borders around data cells

## Data Validations
1. **B3** (Facility): List from Lists!$B$3:$B$13
2. **F3** (Clinical Resource): List from Lists!$C$3:$C$7
3. **K3:M3**: Inline list "Gangsta Nation,Goal Diggers,Ludacris Mode,Jungle Goats,Kings & Queens of Chaos"
4. **A4**: Inline facility list

## Key Formulas
- **N8:N14**: =AVERAGE(B[row]:M[row]) - Calculates yearly average for each system
- **B15:M15**: =AVERAGE([col]8:[col]14) - Calculates monthly average across all systems

## Interaction with Other Sheets
- Links to **Lists** sheet for dropdown values
- Scores in rows 8-14 are manually entered from corresponding assessment tabs (1-7)
- Data feeds into **Trend Graphs** sheet for visualization

## User Workflow
1. Select Facility from dropdown (B3)
2. Select Clinical Resource from dropdown (F3)
3. After completing each monthly assessment (tabs 1-7), enter the total score in the corresponding cell
4. Averages calculate automatically
5. Compare to previous year averages in column O
