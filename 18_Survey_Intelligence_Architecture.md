# Survey Intelligence - Architecture & Framework

## Overview

SystemsCheck has two types of survey-related pages that work together to help users understand their regulatory risk and take action.

---

## Core Concepts

### Survey Analytics = Raw Data
**Question answered**: "What exactly happened?"

- Complete historical survey data
- Tables, filters, exports
- Every citation with full text
- Quality measures and benchmarks
- Backward-looking
- For documentation and deep dives

### Survey Intelligence = Actionable Insights
**Question answered**: "What should I do about it?"

- Risk scores and recommendations
- Trend analysis (worsening/improving)
- Pattern detection
- Market context for relevance
- Forward-looking
- For decision-making

### Views = Benchmarks & Comparison
**Question answered**: "How do I compare?"

- Position relative to peers
- Rankings and distributions
- Internal benchmarks (team, company)
- External benchmarks (state, region, national)
- For context and prioritization

---

## The Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         MARKET DATA                             │
│         (State/regional/national CMS survey data)               │
│              ↓ provides benchmarks to ↓                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │Market View  │    │Company View │    │ Team View   │        │
│   │             │    │             │    │             │        │
│   │"State/region│    │"All teams   │    │"All         │        │
│   │ trends +    │    │ compared +  │    │ facilities  │        │
│   │ your spot"  │    │ rankings"   │    │ compared"   │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             ▼                                   │
│                  ┌───────────────────┐                         │
│                  │   Facility View   │                         │
│                  │(Survey Intelligence)                        │
│                  │                   │                         │
│                  │ Risk + Insights   │                         │
│                  │ + Market Context  │                         │
│                  └─────────┬─────────┘                         │
│                            │                                    │
│                            ▼                                    │
│                  ┌───────────────────┐                         │
│                  │ Survey Analytics  │                         │
│                  │                   │                         │
│                  │ Raw Data + Tables │                         │
│                  │ + Exports         │                         │
│                  └───────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## View Definitions

### Market View
**URL**: `/market` or `/market/:state`
**Selection**: None required (optional facility for comparison)
**Primary Users**: Corporate, Regional Leaders
**Primary Question**: "What's happening in my market?"

**Shows**:
- State-wide hot tags and trends
- Regional comparisons (WA vs OR vs ID)
- National trends
- YOUR position if facility/company selected
- "You are in the Xth percentile"

**Key Insight**: Market-first, your position as context

---

### Company View
**URL**: `/company/:companyId`
**Selection**: Company
**Primary Users**: Corporate, Executives
**Primary Question**: "How is our entire organization performing?"

**Shows**:
- Company-wide aggregate risk score
- Risk distribution (X high, Y moderate, Z low)
- Team comparison table with rankings
- Facility rankings (worst to best)
- Company vs Market comparison
- Common issues across organization

**Key Insight**: Which teams/facilities need attention?

---

### Team View
**URL**: `/team/:teamId`
**Selection**: Team
**Primary Users**: Team Leaders, Regional Managers
**Primary Question**: "How is my region doing?"

**Shows**:
- Team aggregate risk score
- Facility comparison (6-8 facilities)
- Individual facility risk rankings
- Common issues across team ("F880 at 4 of 6 facilities")
- Team vs State comparison
- Team vs Company comparison

**Key Insight**: Which facilities need help?

---

### Facility View (Survey Intelligence)
**URL**: `/survey-intelligence` with facility selected
**Selection**: Facility
**Primary Users**: DONs, Clinical Leaders, Facility Administrators
**Primary Question**: "What should THIS facility focus on?"

**Shows**:
- Risk score with percentile
- AI-generated recommendations
- Clinical systems breakdown
- Deficiency trends (worsening/persistent/improving)
- Tags heatmap
- Market context (your tags vs state trends)
- Survey timeline with patterns
- Dynamic takeaways

**Key Insight**: Actionable priorities informed by market context

---

### Survey Analytics
**URL**: `/survey-analytics` with facility selected
**Selection**: Facility
**Primary Users**: Compliance Officers, QA Directors, preparing for audits
**Primary Question**: "Show me everything that happened"

**Shows**:
- Complete survey history (tables)
- All deficiencies with full citation text
- Fire safety details (K-tags, E-tags)
- Quality measures with benchmarks
- State/national comparisons
- Export functionality

**Key Insight**: Documentation and deep dive data

---

## How They Connect

### Navigation Patterns

**Drilling Down (broad → specific)**:
```
Market View → Company View → Team View → Facility View → Survey Analytics
```

**Drilling Up (specific → broad)**:
```
Facility: "How do I compare to my team?" → Team View
Facility: "How do I compare to market?" → Market View
Team: "How do other teams compare?" → Company View
```

**Sideways (same level, different focus)**:
```
Survey Intelligence ↔ Survey Analytics (same facility, different purpose)
```

### Linking Guidelines

From Survey Intelligence:
- "View Team Comparison →" → Team View
- "View Market Context →" → Market View
- "View Full History →" → Survey Analytics
- "Export Data →" → Survey Analytics

From Survey Analytics:
- "View Risk Analysis →" → Survey Intelligence
- "View Team →" → Team View

From Team View:
- "View Facility →" → Survey Intelligence for that facility
- "View Company →" → Company View
- "Compare to Market →" → Market View

From Company View:
- "View Team →" → Team View
- "View Facility →" → Survey Intelligence
- "Compare to Market →" → Market View

From Market View:
- "View Company Dashboard →" → Company View
- "View Facility →" → Survey Intelligence

---

## Data Flow

```
External CMS Data (snf_market_data)
       │
       ├──► Market View (state/regional/national aggregates)
       │
       ├──► Company View (filtered to company CCNs, aggregated)
       │
       ├──► Team View (filtered to team CCNs, aggregated)
       │
       └──► Facility Views (filtered to one CCN)
               │
               ├──► Survey Intelligence (insights layer)
               │
               └──► Survey Analytics (raw data layer)
```

---

## Aggregation Rules

### Risk Score Aggregation
- **Facility**: Calculated risk score (0-100)
- **Team**: Average of facility risk scores (weighted by bed count optional)
- **Company**: Average of team risk scores
- **Market**: Not a risk score - shows percentile distribution

### Deficiency Aggregation
- **Facility**: Count of deficiencies at that facility
- **Team**: Sum or average across facilities
- **Company**: Sum or average across teams
- **Market**: State/regional totals and averages

### "Needs Attention" Flags
- **Facility**: Risk score > 70 OR worsening trend
- **Team**: Any facility needs attention OR team avg > 60
- **Company**: Any team needs attention OR multiple high-risk facilities

---

## Survey Intelligence at Each Level

Survey Intelligence principles apply at every level:

| Level | Risk Score | Recommendations | Market Context |
|-------|------------|-----------------|----------------|
| Facility | Facility risk | "Focus on F880" | "F880 trending in your state" |
| Team | Team avg risk | "3 facilities need attention" | "Your team vs state avg" |
| Company | Company avg risk | "Montana team is struggling" | "Your company vs industry" |

The pattern repeats:
1. **Risk Score**: Aggregate number telling the story
2. **Recommendations**: What to do about it
3. **Breakdown**: Where the risk comes from
4. **Trends**: Getting better or worse?
5. **Context**: How does this compare to peers/market?

---

## User Journeys

### Clinical Leader (Daily Check)
```
Login → Survey Intelligence (their facility)
     → See risk score + top recommendation
     → Done in 2 minutes
```

### Regional Manager (Weekly Review)
```
Login → Team View
     → See which facilities need attention
     → Click into worst facility → Survey Intelligence
     → Review recommendations
     → Done in 10 minutes
```

### Corporate QA (Monthly Report)
```
Login → Company View
     → See team rankings and risk distribution
     → Export data for board
     → Drill into problem areas
     → Done in 30 minutes
```

### Compliance Officer (Survey Prep)
```
Login → Survey Intelligence (priorities)
     → "Need F880 details" → Survey Analytics
     → Export deficiency history
     → Print for survey binder
```

---

## Implementation Status

| View | Status | Notes |
|------|--------|-------|
| Survey Analytics | ✅ Built | 6 tabs, full history |
| Survey Intelligence (Facility) | ✅ Built | Risk, recommendations, trends, heatmap |
| Team View | ⬜ Not started | |
| Company View | ⬜ Not started | |
| Market View | ⬜ Not started | |

---

## Design Principles

1. **One Number Tells the Story**: Every view has a headline metric (risk score, ranking, percentile)

2. **Context is King**: Raw numbers mean nothing without comparison (vs last survey, vs team, vs market)

3. **Actionable > Informative**: Always answer "so what should I do?"

4. **Progressive Disclosure**: Summary first, click for details

5. **Consistent Patterns**: Same visual language at every level (risk badges, trend arrows, severity colors)

6. **Connected, Not Siloed**: Every view links to related views

---

## File Locations

```
frontend/src/pages/
├── survey-analytics/           # Raw data views
│   ├── SurveyAnalytics.jsx
│   └── components/
│       ├── HealthSurveysTab.jsx
│       ├── FireSafetyTab.jsx
│       ├── DeficienciesTab.jsx
│       ├── QualityMeasuresTab.jsx
│       └── BenchmarksTab.jsx
│
├── survey-intelligence/        # Facility-level insights
│   ├── FacilityIntelligence.jsx
│   └── components/
│       ├── RiskScoreCard.jsx
│       ├── Recommendations.jsx
│       ├── TrendsSummary.jsx
│       ├── ClinicalSystemsBreakdown.jsx
│       ├── TagsHeatmap.jsx
│       ├── MarketContext.jsx
│       ├── SurveyTypeBreakdown.jsx
│       ├── SurveyTimeline.jsx
│       └── TagDetailModal.jsx
│
├── team-view/                  # Team-level (TO BUILD)
│   └── TeamIntelligence.jsx
│
├── company-view/               # Company-level (TO BUILD)
│   └── CompanyIntelligence.jsx
│
└── market-view/                # Market-level (TO BUILD)
    └── MarketIntelligence.jsx
```

---

*Last Updated: December 26, 2025*
