# Lists Tab - Context Document

## Purpose
This is a **reference/lookup sheet** that stores dropdown list values used throughout the workbook. It serves as a centralized data source for data validation dropdowns on other sheets.

## Sheet Structure

### Layout
- **Column A**: Empty (spacer)
- **Column B**: Facility Names list
- **Column C**: Clinical Resource names
- **Column D**: Months of the year

### Row 2 - Headers
| Cell | Value |
|------|-------|
| B2 | "Facility Names:" |
| C2 | "Clinical Resource:" |
| D2 | "Month:" |

### Column B - Facility Names (B3:B12)
```
B3: Clarkston
B4: Coeur d'Alene
B5: Colfax
B6: Colville
B7: Libby
B8: Mt. Ascension
B9: Mountain View
B10: Mountain Valley
B11: Silverton
B12: Spokane Valley
```

### Column C - Clinical Resources (C3:C6)
```
C3: Roberta Wallace
C4: Christy Zimpel
C5: Kate Hawkins
C6: Joan Berkfield
```

### Column D - Months (D3:D14)
```
D3: JAN
D4: FEB
D5: MAR
D6: APR
D7: MAY
D8: JUN
D9: JUL
D10: AUG
D11: SEP
D12: OCT
D13: NOV
D14: DEC
```

## Column Widths
| Column | Width |
|--------|-------|
| A | 8.63 |
| B | 31.75 |
| C | 16.13 |
| D | 8.63 |

## Formatting
- Simple text formatting
- No special colors or borders
- Headers in row 2 are plain text (no bold)

## Data Validation References
This sheet is referenced by data validations on other sheets:

| Reference Range | Used On | Purpose |
|----------------|---------|---------|
| Lists!$B$3:$B$13 | Clinical Systems Overview (B3) | Facility dropdown |
| Lists!$C$3:$C$7 | Clinical Systems Overview (F3) | Clinical Resource dropdown |
| Lists!$D$3:$D$14 | All assessment sheets (D2) | Month selection dropdown |

## Customization Notes
When recreating this tool for a different organization:
1. **Column B**: Replace with your facility/location names
2. **Column C**: Replace with your clinical resource/reviewer names
3. **Column D**: Keep the months as-is (standard)

## Important Implementation Details
- The range references in data validations use absolute references ($ signs)
- Ensure the list ranges match exactly what the data validations expect
- Leave empty cells at the end of lists if you need room to grow
- The Clinical Resources list has one empty slot (C7) for future additions
