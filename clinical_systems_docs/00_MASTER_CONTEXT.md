# Clinical Systems Review Template - Master Context Document

## Overview
This document provides a complete specification for recreating the **2025 Clinical Systems Review Template** - a comprehensive Excel-based assessment tool for evaluating clinical systems in skilled nursing facilities.

## Tool Purpose
Monthly evaluation tool that:
- Assesses 7 core clinical system areas
- Uses standardized scoring (0-100 points per system)
- Tracks performance across months
- Generates trend visualizations
- Supports quality improvement initiatives

## Workbook Structure

### Tab Overview
| Tab # | Tab Name | Type | Purpose |
|-------|----------|------|---------|
| 1 | Clinical Systems Overview | Dashboard | Monthly scores summary, averages, facility selection |
| 2 | Lists | Reference | Dropdown values for facilities, resources, months |
| 3 | Trend Graphs | Visualization | 7 bar charts showing monthly trends |
| 4 | 1. Change of Condition | Assessment | Evaluate condition change management (100 pts) |
| 5 | 2. Accidents, Falls, Incidents | Assessment | Evaluate fall prevention & incident mgmt (100 pts) |
| 6 | 3. Skin | Assessment | Evaluate skin/wound management (100 pts) |
| 7 | 4. Med mgnt.Weight loss | Assessment | Evaluate medication & nutrition mgmt (100 pts) |
| 8 | 5. Infection Control | Assessment | Evaluate infection prevention (100 pts) |
| 9 | 6. Transfer.Discharge | Assessment | Evaluate transfer/discharge processes (100 pts) |
| 10 | 7. Abuse Self-Report Grievances | Assessment | Evaluate abuse prevention & grievances (100 pts) |
| 11 | Observations & Interview | Reference | Consolidated observation/interview checklist |

## Assessment Scoring System

### Scoring Methodology
Each assessment tab uses a weighted point system:
- **Total possible points**: 100 per assessment
- **Scoring types**:
  - **Binary (Y/N)**: Enter 1 for Yes, 0 for No
  - **Sample-based**: Enter number meeting criteria (typically 0-3)

### Formula Pattern
```
Points = (# Met) × (Max Points ÷ Sample Size)
```

Example: Item worth 10 points, sample of 3
- If 2 of 3 charts meet criteria: 2 × (10÷3) = 2 × 3.33 = 6.66 points

### Common Multipliers
| Max Points | Sample Size | Multiplier |
|------------|-------------|------------|
| 20 | 1 (Y/N) | 20 |
| 20 | 3 | 6.66 |
| 10 | 1 (Y/N) | 10 |
| 10 | 3 | 3.33 or 3.34 |
| 5 | 1 (Y/N) | 5 |
| 5 | 3 | 1.66 or 1.667 |

## Standard Assessment Tab Structure

### Layout Template
```
Row 1-3: Header area (Month dropdown in D2)
Row 4: Column headers (Category, Max Points, # Met, Sample Size, Points, Notes)
Row 5: Section header (merged B:G)
Rows 6-N: Assessment items
Row N+1: Total row with SUM formulas
Rows below: Residents reviewed, Comments, Signature/Date sections
```

### Standard Column Widths
| Column | Width | Purpose |
|--------|-------|---------|
| A | 3.25 | Spacer |
| B | 47.0 | Category text |
| C | 8.75 | Max Points |
| D | 13.0 | # Met (data entry) |
| E | 8.88 | Sample Size |
| F | 8.75 | Calculated Points |
| G | 34.88 | Notes |

### Standard Formatting
- **Header row (4)**: Bold, centered, fill #CCCC00 (yellow), thin borders
- **Section headers**: Bold, merged across B:G
- **Data rows**: Left-aligned text in B, centered numbers in C-F
- **Total row**: Bold, fill #CCCC00
- **Borders**: Medium left edge on column B, thin elsewhere

## Data Validation Configuration

### Month Selection (All Assessment Tabs)
- **Cell**: D2
- **Type**: List
- **Source**: Lists!$D$3:$D$14

### Binary Items
- **Type**: List
- **Values**: "1,0"
- **Used for**: Yes/No questions

### Facility/Resource Selection (Overview)
- **Facility (B3)**: Lists!$B$3:$B$13
- **Clinical Resource (F3)**: Lists!$C$3:$C$7

## Trend Graphs Configuration

### Chart Specifications
- **Type**: Bar Chart (column)
- **Count**: 7 charts (one per clinical system)
- **Size**: Width 15, Height 7.5
- **Data Source**: Clinical Systems Overview rows 8-14, columns B-M
- **Categories**: Months (Jan-Dec)

### Chart-to-System Mapping
| Chart | Data Range | System |
|-------|------------|--------|
| 1 | B8:M8 | Change of Condition |
| 2 | B9:M9 | Accidents/Falls |
| 3 | B10:M10 | Skin |
| 4 | B11:M11 | Meds & Nutrition |
| 5 | B12:M12 | Infection Prevention |
| 6 | B13:M13 | Transfer/Discharge |
| 7 | B14:M14 | Abuse/Grievances |

## Implementation Checklist

### 1. Create Lists Tab First
- [ ] Add facility names (column B)
- [ ] Add clinical resource names (column C)
- [ ] Add months JAN-DEC (column D)

### 2. Create Clinical Systems Overview
- [ ] Set up header section with dropdowns
- [ ] Create monthly columns with formatting
- [ ] Add AVERAGE formulas for row and column calculations
- [ ] Add Previous Year column with historical data

### 3. Create Each Assessment Tab (1-7)
For each tab:
- [ ] Set up standard column structure
- [ ] Add section headers (merged)
- [ ] Add assessment items with descriptions
- [ ] Set up point values and sample sizes
- [ ] Create formulas in Points column
- [ ] Add total row with SUM formulas
- [ ] Add documentation sections
- [ ] Apply data validations
- [ ] Apply formatting

### 4. Create Trend Graphs Tab
- [ ] Create 7 bar charts
- [ ] Link each to corresponding Overview row
- [ ] Set chart dimensions and positions
- [ ] Configure axis scales (0-100 recommended)

### 5. Create Observations Tab
- [ ] List all observation items
- [ ] List all interview items
- [ ] Add notes columns

### 6. Final Verification
- [ ] Test all dropdowns
- [ ] Verify all formulas calculate correctly
- [ ] Check chart data links
- [ ] Validate totals sum to 100 per assessment
- [ ] Test with sample data

## Customization Guide

### For Different Organizations
1. **Lists tab**: Update facility and staff names
2. **Overview tab**: Update Previous Year values
3. **Assessment tabs**: Modify item text for local policies
4. **Add logo**: Insert organization logo in header areas

### For Different Regulatory Requirements
- Assessment items reference specific F-tags (e.g., F580, F689)
- Update item descriptions to match current regulations
- Adjust point weightings based on priority areas

## File Information
- **Original filename**: 2025_Clinical_Systems_Review_Template_9-21-25.xlsx
- **Revision history**: Listed on Clinical Systems Overview tab (row 22)
- **Last revision**: 1.1.2025

## Technical Notes

### Excel Version Compatibility
- Designed for Excel 2016+
- Compatible with Microsoft 365
- Should work in LibreOffice Calc with minor adjustments

### Formula Considerations
- Uses simple AVERAGE and SUM functions
- No complex nested formulas
- No VBA/macros required
- All calculations are transparent

### Print Settings (Recommended)
- Landscape orientation for assessment tabs
- Fit to 1 page wide
- Include row/column headers for reference

---

## Quick Reference: Points by Assessment

### 1. Change of Condition (8 items)
20+20+10+10+10+10+10+10 = 100

### 2. Accidents/Falls (15 items + sub-items)
10+5+10+5+5+5+5+10+5+5+5+10+5+5+10 = 100

### 3. Skin (8 items)
20+10+10+10+10+20+10+10 = 100

### 4. Med Mgmt/Weight (16 items)
10+10+5+5+10+5+5+5+5+5+5+10+5+5+5+5 = 100

### 5. Infection Control (10 items)
10+10+10+10+10+10+10+10+10+10 = 100

### 6. Transfer/Discharge (10 items)
10+10+10+10+10+10+10+10+10+10 = 100

### 7. Abuse/Grievances (8 items)
20+10+20+10+10+10+10+10 = 100

---

*Use the individual tab context documents for detailed specifications of each sheet.*
