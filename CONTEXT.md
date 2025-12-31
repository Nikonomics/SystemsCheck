# SystemsCheck - Project Context

## Project Overview

**SystemsCheck** is a clinical audit scorecard system for Skilled Nursing Facilities (SNFs), Assisted Living Facilities (ALFs), and Independent Living Facilities (ILFs). It enables monthly clinical audits based on 8 clinical systems with standardized scoring, multi-level organizational hierarchy, role-based access control, and comprehensive reporting.

## Current Status

**Phase**: Production - Active Development
- Core application fully functional (authentication, scorecards, facilities, reports)
- Historical import system operational
- Survey Intelligence with CMS data integration
- Deployed on Render with auto-deploy from GitHub

## Architecture Overview

### Multi-Database Design

SystemsCheck uses two PostgreSQL databases:

1. **SystemsCheck Database** (local/Render)
   - Companies, Teams, Facilities, Users
   - Scorecards, Systems, Items, Residents
   - Import batches, Audit templates
   - Connection: `DATABASE_URL`

2. **Market Database** (shared, read-only)
   - CMS facility data (`snf_facilities`)
   - Historical snapshots (`facility_snapshots`, `cms_extracts`)
   - Deficiencies, citations, quality measures
   - Connection: `MARKET_DATABASE_URL`

```
┌─────────────────────┐     ┌─────────────────────┐
│  SystemsCheck DB    │     │  Market DB          │
│  (Render/Local)     │     │  (snf_market_data)  │
├─────────────────────┤     ├─────────────────────┤
│ companies           │     │ snf_facilities      │
│ teams               │     │ facility_snapshots  │
│ facilities ─────────┼──→  │ cms_extracts        │
│ users               │ CCN │ cms_facility_defic. │
│ scorecards          │     │ fire_safety_citat.  │
│ import_batches      │     │ quality_measures    │
└─────────────────────┘     └─────────────────────┘
```

### Tech Stack

**Backend**
- Node.js with Express.js
- Sequelize ORM with PostgreSQL
- JWT authentication with bcryptjs
- Runs on port 3001

**Frontend**
- React 19 with Vite
- React Router v7
- Tailwind CSS
- Recharts for visualizations
- @react-pdf/renderer for exports
- Runs on port 5173

## File Structure

```
systemscheck/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # Local Sequelize config
│   │   │   └── marketDatabase.js   # Market DB connection pool
│   │   ├── data/
│   │   │   └── auditCriteria.js    # 8 clinical systems definition
│   │   ├── database/
│   │   │   └── survey_intelligence_schema.sql
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT & role authorization
│   │   ├── migrations/
│   │   │   └── 20241230-add-import-batches.js
│   │   ├── models/                  # 18 Sequelize models
│   │   │   ├── Company.js
│   │   │   ├── Team.js
│   │   │   ├── Facility.js
│   │   │   ├── User.js
│   │   │   ├── UserFacility.js
│   │   │   ├── Scorecard.js
│   │   │   ├── ScorecardSystem.js
│   │   │   ├── ScorecardItem.js
│   │   │   ├── ScorecardResident.js
│   │   │   ├── ScorecardActivityLog.js
│   │   │   ├── AuditTemplate.js
│   │   │   ├── AuditTemplateSystem.js
│   │   │   ├── AuditTemplateItem.js
│   │   │   ├── ImportBatch.js
│   │   │   ├── SurveyIntelligence.js
│   │   │   ├── KevHistorical.js
│   │   │   ├── KevHistoricalCategory.js
│   │   │   └── index.js            # Model associations
│   │   ├── routes/                  # 12 API route modules
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── scorecards.js
│   │   │   ├── facilities.js
│   │   │   ├── reports.js
│   │   │   ├── organization.js
│   │   │   ├── import.js           # Historical import
│   │   │   ├── template.js
│   │   │   ├── cmsData.js          # CMS data + trends
│   │   │   ├── surveyIntel.js      # Facility intelligence
│   │   │   ├── surveyIntelTeam.js  # Team intelligence
│   │   │   └── surveyIntelligence.js
│   │   ├── scripts/
│   │   │   ├── seedProduction.js   # Production seed script
│   │   │   ├── syncSnfFacilities.js
│   │   │   ├── analyzeScoreCards.js
│   │   │   ├── formatsByCompany.js
│   │   │   └── ...                 # Analysis utilities
│   │   ├── seeds/
│   │   │   └── seed.js
│   │   ├── services/
│   │   │   └── surveyIntelligenceCalculator.js
│   │   ├── utils/
│   │   │   ├── excelParser.js      # Excel scorecard parser
│   │   │   ├── kevParser.js        # KEV format parser
│   │   │   └── dateExtractor.js
│   │   └── index.js                # Express entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # API client modules
│   │   │   ├── authService.js
│   │   │   ├── facilityService.js
│   │   │   ├── scorecardService.js
│   │   │   ├── cmsService.js
│   │   │   └── import.js
│   │   ├── components/
│   │   │   ├── CMSTabs/            # CMS data display
│   │   │   │   ├── TrendsTab/      # Rating/staffing trends
│   │   │   │   ├── QualityTab/
│   │   │   │   ├── StaffingTab/
│   │   │   │   └── DeficienciesTab/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── survey-intelligence/
│   │   │   │   ├── ScoreCard.jsx
│   │   │   │   ├── MetricBar.jsx
│   │   │   │   ├── GapAnalysis.jsx
│   │   │   │   ├── OperationalContext.jsx
│   │   │   │   ├── ChainContext.jsx
│   │   │   │   ├── RecommendationsPanel.jsx
│   │   │   │   └── SurveyIntelligenceCard.jsx
│   │   │   └── ui/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   ├── facilities/
│   │   │   │   ├── FacilityList.jsx
│   │   │   │   ├── FacilityDetail.jsx
│   │   │   │   └── FacilitySurveyIntelligence.jsx
│   │   │   ├── scorecards/
│   │   │   │   ├── ScorecardForm.jsx
│   │   │   │   ├── ScorecardView.jsx
│   │   │   │   └── ScorecardPDF.jsx
│   │   │   ├── survey-intelligence/
│   │   │   ├── admin/
│   │   │   │   └── HistoricalImport.jsx
│   │   │   └── reports/
│   │   ├── utils/
│   │   │   ├── scorecardParser.js
│   │   │   ├── excelFullParser.js
│   │   │   └── kevParser.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── clinical_systems_docs/          # Clinical systems reference
├── focus_areas/                    # Focus areas implementation
├── CONTEXT.md                      # This file
├── README.md                       # Setup & API docs
├── render.yaml                     # Render deployment
└── .claudemd                       # Claude project rules
```

## Key Architecture Decisions

### 1. 8 Clinical Systems (7 Scored + 1 Reference)
- **Systems 1-7**: 100 points each = 700 total
- **System 8**: Observations & Interview (reference checklist, not scored)
- Each system has items with maxPoints, sampleSize, and inputType (binary/sample)

### 2. Organizational Hierarchy
```
Company → Team → Facility → Scorecard
```
- Multi-tenant structure
- Role-based visibility (clinical_resource sees assigned facilities only)

### 3. 6 User Roles
1. `clinical_resource` - Facility-level data entry
2. `facility_leader` - Facility oversight
3. `team_leader` - Team management
4. `company_leader` - Company oversight
5. `corporate` - Corporate-wide analytics
6. `admin` - System administration

### 4. Scorecard Workflow
```
draft → trial_close → hard_close
```
- Draft: Editable
- Trial Close: Review period (can reopen)
- Hard Close: Permanent record (cannot edit/delete)

### 5. CMS Data Integration
- Facilities linked to CMS via CCN (federal_provider_number)
- Historical snapshots from 2020-present (62+ months)
- Trends data: ratings, staffing, turnover, occupancy, deficiencies
- Read-only access to shared market database

### 6. Historical Import System
- Supports multiple Excel formats:
  - **Clinical Systems Review**: Full 8-system scorecard
  - **KEV Hybrid**: Condensed format with categories
  - **KEV Mini**: Minimal format
- Automatic format detection
- Fuzzy facility name matching
- Batch tracking with rollback capability

### 7. Survey Intelligence
- **Survey Risk Score**: Composite of lagging + leading indicators
- **Operational Context**: Capacity strain, resource scores, quadrant classification
- **Alert Flags**: Critical issues requiring attention
- **Recommendations**: Actionable next steps
- **Chain Context**: Comparison to chain averages

## Important Notes

### External Database Queries
Before writing SQL against the market database:
1. Check the Data Dictionary: `/Users/nikolashulewsky/Desktop/17_Data_Dictionary.md`
2. Use `getMarketPool()` from `config/marketDatabase.js`
3. Never guess column names - query `information_schema` if unsure

### Known Column Name Mappings
| Expected | Actual Column | Table |
|----------|---------------|-------|
| `ccn` | `federal_provider_number` | snf_facilities |
| `state` | Must JOIN from snf_facilities | cms_facility_deficiencies |

### Critical Tables for Survey Intelligence
- **snf_facilities**: Facility demographics, ratings, staffing, penalties
- **facility_snapshots**: Monthly historical data (ratings, staffing, turnover)
- **cms_extracts**: Extract dates for snapshots
- **cms_facility_deficiencies**: Health survey deficiencies
- **fire_safety_citations**: Life safety code deficiencies

## Deployment

### Render Services
- **systemscheck-api**: Node.js backend
- **systemscheck-web**: Static frontend
- **systemscheck-db**: PostgreSQL database

### Environment Variables on Render
- `DATABASE_URL`: SystemsCheck database (auto-set by Render)
- `MARKET_DATABASE_URL`: Shared CMS data (manual config)
- `JWT_SECRET`: Authentication secret
- `CORS_ORIGIN`: Frontend URL

### Build Commands
- Backend: `npm install && npm run db:seed-prod`
- Frontend: `npm install && npm run build`

---
*Last Updated: 2025-12-31*
