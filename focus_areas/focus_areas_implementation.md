# Focus Areas Analysis Implementation Guide

## Overview

The Focus Areas Analysis system identifies **WHAT** clinical systems a facility should prioritize to reduce survey risk. It complements the Risk Score model (which predicts **WHICH** facilities are high risk) by providing actionable, system-specific guidance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────┤
│  CMS Deficiencies  │  Facility Info  │  VBP Performance  │      │
│  (417K+ records)   │  (14.7K SNFs)   │  (Readmit/HAI)   │      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MAPPINGS                                    │
├─────────────────────────────────────────────────────────────────┤
│  F-Tag → System (110 tags)  │  QM → System (24 measures)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   METRIC CALCULATIONS                            │
├─────────────────────────────────────────────────────────────────┤
│  Citation Metrics  │  System Scores  │  Peer Comparison  │      │
│  • Velocity        │  • Citation 40% │  • State averages │      │
│  • Repeat F-tags   │  • QM 25%       │  • Bed size match │      │
│  • Severity trend  │  • Trend 15%    │  • YoY change     │      │
│                    │  • Peer 10%     │                   │      │
│                    │  • State 10%    │                   │      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        OUTPUT                                    │
├─────────────────────────────────────────────────────────────────┤
│  Focus Areas JSON  │  System Scores  │  Recommendations  │      │
│  (7 systems ranked)│  (0-100 scale)  │  (prioritized)    │      │
└─────────────────────────────────────────────────────────────────┘
```

## The 7 Clinical Systems

| ID | System Name | Primary Focus | Key F-Tags |
|----|-------------|---------------|------------|
| 1 | Change of Condition | Notification, monitoring, care planning | F580, F684, F656 |
| 2 | Accidents/Falls | Fall prevention, supervision, safety | F689, F688, F677 |
| 3 | Skin | Pressure injuries, wound care | F686, F690 |
| 4 | Med Management/Weight Loss | Pharmacy, nutrition, weight | F755-F761, F692 |
| 5 | Infection Control | IC program, COVID, vaccinations | F880-F888 |
| 6 | Transfer/Discharge | Discharge planning, transitions | F622-F627, F660 |
| 7 | Abuse/Grievances | Abuse prevention, rights | F600-F610 |

## Files Included

| File | Purpose |
|------|---------|
| `ftag_system_mapping.csv` | Maps 110 F-tags to clinical systems |
| `qm_system_mapping.csv` | Maps 24 QMs to clinical systems |
| `focus_areas_schema.sql` | Database tables for storing results |
| `focus_areas_calculations.sql` | SQL CTEs for metric calculations |
| `focus_areas_api.js` | Express API route handler |
| `focus_areas_batch.js` | Nightly batch processing job |
| `FocusAreasCard.jsx` | React component for display |

## System Risk Score Calculation

Each clinical system receives a risk score (0-100) based on:

```
System Risk Score =
    (Citation Factor × 0.40) +
    (QM Factor × 0.25) +
    (QM Trend Factor × 0.15) +
    (Peer Factor × 0.10) +
    (State Factor × 0.10)
```

### Citation Factor (40% weight)

Based on deficiency history in the past 3 years:

```javascript
// Severity weights
const weights = {
  'J': 10, 'K': 10, 'L': 10,  // IJ
  'G': 5, 'H': 5, 'I': 5,     // Actual Harm
  'D': 2, 'E': 2, 'F': 2,     // Potential Harm
  'A': 1, 'B': 1, 'C': 1      // No Harm
};

// Calculate weighted count
severity_weighted_count = SUM(weight per deficiency)

// Normalize to 0-100
citation_factor = (facility_weighted / max_weighted) * 100

// Add bonuses
if (repeat_ftags > 0) citation_factor += repeat_count * 5
if (had_ij) citation_factor += 20
if (had_harm) citation_factor += 10
```

### QM Factor (25% weight)

Based on related quality measures (when available):

```javascript
// For each QM mapped to this system
qm_percentile = facility_value percentile vs state

// Average percentiles
qm_factor = AVG(qm_percentiles for this system)
```

### QM Trend Factor (15% weight)

Based on whether QMs are improving or worsening:

```javascript
// Compare current quarter to 4 quarters ago
qm_change = (current - previous) / previous

// Score based on direction
if (qm_change > 0.10) qm_trend_score = 80  // Worsening
if (qm_change < -0.10) qm_trend_score = 20 // Improving
else qm_trend_score = 50                    // Stable
```

### Peer Factor (10% weight)

Compares facility to similar peers:

```javascript
// Peer group = same state + similar bed count (±25%)
peer_avg = AVG(citations in system for peer group)

// Score based on comparison
peer_factor = 50 + ((facility_citations - peer_avg) / peer_avg) * 50
```

### State Factor (10% weight)

Accounts for state-level enforcement trends:

```javascript
// Year-over-year change in state citations
yoy_change = (current_year - prev_year) / prev_year

// Score based on direction
if (yoy_change > 0.20) state_factor = 80  // State cracking down
if (yoy_change > 0.10) state_factor = 70
if (yoy_change > 0) state_factor = 60
else state_factor = 50                     // Stable/decreasing
```

## Derived Metrics

### Citation Pattern Metrics

| Metric | Calculation |
|--------|-------------|
| `citation_velocity` | Compare deficiency counts across last 3 surveys |
| `severity_trend` | Track average severity code over last 3 surveys |
| `repeat_ftag_rate` | % of current F-tags also cited in previous survey |
| `repeat_ftag_list` | List of F-tags cited in consecutive surveys |
| `days_since_ij` | Days since most recent IJ citation |
| `system_concentration` | % of deficiencies in top system |

### Staffing Metrics

| Metric | Calculation |
|--------|-------------|
| `rn_hours_vs_state` | Facility RN HPRD vs state average |
| `weekend_gap` | (weekday_hours - weekend_hours) / weekday_hours |
| `rn_to_total_ratio` | RN hours / total nursing hours |

## API Usage

### Get Focus Areas for Facility

```http
GET /api/facilities/{federal_provider_number}/focus-areas
```

**Response:**

```json
{
  "facility_id": "105001",
  "federal_provider_number": "105001",
  "overall_risk_score": 73,
  "overall_risk_tier": "High",
  "focus_areas": [
    {
      "rank": 1,
      "system_id": 5,
      "system_name": "Infection Control",
      "system_risk_score": 82,
      "evidence": {
        "citation_history": {
          "count_3yr": 4,
          "repeat_ftags": ["F880"],
          "had_ij": false,
          "narrative": "..."
        },
        "peer_comparison": {
          "peer_group_size": 42,
          "peer_avg_citations": 1.8,
          "narrative": "..."
        }
      },
      "recommendations": [...],
      "ftags_to_review": ["F880", "F881"],
      "scorecard_alignment": {...}
    }
  ],
  "key_metrics": {
    "citation_velocity": "worsening",
    "repeat_ftag_rate": 0.35,
    "days_since_last_survey": 287
  }
}
```

## Database Schema

### Core Tables

```sql
-- Focus areas results (main output)
CREATE TABLE facility_focus_areas (
  federal_provider_number VARCHAR(10),
  calculated_at TIMESTAMP,
  overall_risk_score NUMERIC(5,2),
  overall_risk_tier VARCHAR(20),
  key_metrics JSONB,
  focus_areas JSONB
);

-- Individual system scores
CREATE TABLE facility_system_scores (
  federal_provider_number VARCHAR(10),
  system_id INTEGER,
  citation_factor_score NUMERIC(5,2),
  qm_factor_score NUMERIC(5,2),
  peer_factor_score NUMERIC(5,2),
  system_risk_score NUMERIC(5,2)
);
```

## Batch Processing

Run nightly to recalculate all facilities:

```bash
# Process all facilities
node focus_areas_batch.js

# Process single state
node focus_areas_batch.js --state CA

# Process single facility
node focus_areas_batch.js --facility 105001
```

## React Component Usage

```jsx
import FocusAreasCard from './FocusAreasCard';

// In your component
const [focusAreas, setFocusAreas] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch(`/api/facilities/${facilityId}/focus-areas`)
    .then(res => res.json())
    .then(data => {
      setFocusAreas(data);
      setLoading(false);
    });
}, [facilityId]);

return (
  <FocusAreasCard
    data={focusAreas}
    loading={loading}
    error={error}
  />
);
```

## Integration with Existing Survey Intelligence

The Focus Areas component complements existing Survey Intelligence features:

1. **Risk Score Tab**: Shows overall facility risk (WHICH facilities)
2. **Focus Areas Tab**: Shows system priorities (WHAT to focus on)
3. **Citation History Tab**: Detailed deficiency list
4. **Trends Tab**: Historical star ratings

## Validation Approach

To validate the model:

1. **Retrospective Analysis**: For facilities with high System Risk Score in a system, check if they were cited in that system on their next survey

2. **Correlation Check**: Calculate correlation between System Risk Score and actual citations by system

3. **Example Cases**: Document facilities where Focus Areas correctly predicted problem areas

## Future Enhancements

1. **Quality Measure Integration**: Add individual QM scores when data available
2. **Time-Matched Ratings**: Use historical ratings at survey time
3. **Machine Learning**: Train classifier on next-survey outcomes
4. **Alert System**: Notify when system scores spike
5. **Comparative Analysis**: Compare systems across chain facilities

## Model Version

**Current Version: 1.0**

Changes from baseline:
- Initial implementation
- 7 clinical systems defined
- Citation-based scoring (QM factor placeholder)
- Peer and state comparison included

---

*Generated: 2025-12-27*
*Model: Focus Areas Analysis v1.0*
