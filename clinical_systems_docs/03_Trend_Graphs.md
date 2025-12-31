# Trend Graphs Tab - Context Document

## Purpose
This sheet contains **7 bar charts** that visualize the monthly scores for each of the 7 clinical assessment categories. The charts pull data directly from the Clinical Systems Overview sheet.

## Sheet Structure
- The sheet itself has minimal cell content (essentially empty)
- All content is in the form of embedded charts
- Charts are arranged in a 2-row grid layout

## Chart Configuration

### Chart Layout (Grid Arrangement)
```
+----------------+----------------+----------------+
|   Chart 1      |   Chart 2      |   Chart 3      |
| Change of      | Accidents/     |   Skin         |
| Condition      | Falls          |                |
+----------------+----------------+----------------+
|   Chart 4      |   Chart 7      |   Chart 5      |   Chart 6
| Meds &         | Infection      | Transfer/      | Abuse/
| Nutrition      | Prevention     | Discharges     | Grievances
+----------------+----------------+----------------+
```

### Chart Details

| Chart # | Data Source | Corresponds To |
|---------|-------------|----------------|
| 1 | Clinical Systems Overview!$B$8:$M$8 | 1. Change of Condition |
| 2 | Clinical Systems Overview!$B$9:$M$9 | 2. Accidents, Falls, Incidents |
| 3 | Clinical Systems Overview!$B$10:$M$10 | 3. Skin |
| 4 | Clinical Systems Overview!$B$11:$M$11 | 4. Meds & Nutrition |
| 5 | Clinical Systems Overview!$B$13:$M$13 | 6. Transfer/Discharges |
| 6 | Clinical Systems Overview!$B$14:$M$14 | 7. Abuse/Grievances |
| 7 | Clinical Systems Overview!$B$12:$M$12 | 5. Infection Prevention |

### Individual Chart Specifications
All 7 charts share these properties:
- **Type**: Bar Chart (vertical bars)
- **Size**: Width 15 units (~4.9 million EMUs), Height 7.5 units (~2.5 million EMUs)
- **Title**: None (untitled)
- **Series Count**: 1 (single data series)
- **Categories**: Implicit (Jan through Dec from the column positions)

### Chart Positions

**Top Row (Row 0-16):**
- Chart 1: Column 0 (A), Row 0
- Chart 2: Column 7 (H), Row 0  
- Chart 3: Column 15 (P), Row 0

**Bottom Row (Row 16-33):**
- Chart 4: Column 0 (A), Row 16
- Chart 7: Column 7 (H), Row 16
- Chart 5: Column 15 (P), Row 17
- Chart 6: Column 22 (W), Row 17

## Implementation Notes

### Creating the Charts Programmatically
When recreating this sheet:

```python
from openpyxl.chart import BarChart, Reference

# Example for Chart 1 (Change of Condition)
chart = BarChart()
chart.type = "col"  # Vertical bars
chart.width = 15
chart.height = 7.5

# Data reference from Overview sheet
data = Reference(
    worksheet=overview_sheet,
    min_col=2,  # Column B
    max_col=13, # Column M
    min_row=8,  # Row 8
    max_row=8
)
chart.add_data(data)

# Position the chart
trend_sheet.add_chart(chart, "A1")
```

### Category Labels
The charts should use the month abbreviations (Jan-Dec) from row 7 of Clinical Systems Overview as category labels. This can be added via:
```python
categories = Reference(overview_sheet, min_col=2, max_col=13, min_row=7)
chart.set_categories(categories)
```

### Chart Titles (Recommended Enhancement)
Although the original has no titles, consider adding titles for clarity:
- Chart 1: "1. Change of Condition"
- Chart 2: "2. Accidents, Falls, Incidents"
- Chart 3: "3. Skin"
- Chart 4: "4. Meds & Nutrition"
- Chart 5: "6. Transfer/Discharges"
- Chart 6: "7. Abuse/Grievances"
- Chart 7: "5. Infection Prevention"

## Data Dependencies
- All charts depend on data in **Clinical Systems Overview** sheet (rows 8-14, columns B-M)
- If no scores are entered, charts will appear empty or show zeros
- Charts update automatically when source data changes

## Recommended Y-Axis Scale
Since scores range from 0-100, consider setting:
- Minimum: 0
- Maximum: 100
- This provides consistent visual comparison across all charts

## Visual Styling Options
The original charts use default Excel styling. Consider customizing:
- Bar color (perhaps match the assessment category theme)
- Gridlines
- Data labels showing the actual score values
- Legend (if multiple series are added later)
