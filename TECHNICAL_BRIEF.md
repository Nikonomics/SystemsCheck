# SystemsCheck
## Technical Brief for Developers

**Project Type:** Clinical Audit Scorecard System
**Status:** 100% Complete (Production)
**Codebase Size:** ~12,400+ lines
**Last Updated:** January 2025

---

## What This Project Does

SystemsCheck is a clinical audit application for skilled nursing facilities. It replaces Excel-based manual audits with a web application that:

1. **Monthly Scorecards** - 8 clinical systems, 59 audit items, 700 max points
2. **Multi-Facility Support** - 60+ facilities across 6 companies and 15 regional teams
3. **Historical Import** - Imports legacy Excel audits (KEV and Clinical Systems Review formats)
4. **CMS Integration** - Pulls quality ratings, staffing, deficiencies from CMS
5. **Survey Intelligence** - Risk scoring based on lagging and leading indicators

**Users:** Clinical resource coordinators, facility leaders, regional teams, corporate leadership

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 19)                    │
│                    http://localhost:5173                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Scorecards  │ │ Reports &   │ │ Survey Intelligence │   │
│  │ List/Detail │ │ Analytics   │ │ Risk Dashboard      │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ Axios HTTP
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express 4.x)                     │
│                    http://localhost:5000                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ 12 Routes   │ │ 18 Models   │ │ Historical Import   │   │
│  │             │ │ (Sequelize) │ │ (Excel parsing)     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ Sequelize ORM
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASES                              │
│  ┌─────────────────────────┐ ┌─────────────────────────┐   │
│  │ SystemsCheck DB         │ │ Market DB (Read-Only)   │   │
│  │ (scorecards, users,     │ │ (CMS facilities,        │   │
│  │  organizations)         │ │  deficiencies, quality) │   │
│  └─────────────────────────┘ └─────────────────────────┘   │
│                     PostgreSQL (Render)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Styling | Tailwind CSS | 3.4.19 |
| Charts | Recharts | 3.6.0 |
| PDF Export | jsPDF, @react-pdf/renderer | 3.0.4 / 4.3.1 |
| Backend | Express | 4.18.2 |
| ORM | Sequelize | 6.35.2 |
| Database | PostgreSQL | 14+ |
| Excel Import | xlsx | - |
| Auth | JWT + bcrypt | - |
| Analytics | PostHog | 1.310.1 |

---

## The 8 Clinical Systems

| # | System | Items | Points |
|---|--------|-------|--------|
| 1 | Change of Condition | 9 | 100 |
| 2 | Accidents, Falls, Incidents | 8 | 100 |
| 3 | Skin Care Management | 9 | 100 |
| 4 | Medication Management & Weight Loss | 7 | 100 |
| 5 | Infection Control | 7 | 100 |
| 6 | Transfer/Discharge | 8 | 100 |
| 7 | Abuse/Self Report/Grievance | 7 | 100 |
| 8 | Observations & Interviews | 4 | Reference only |
| **Total** | | **59** | **700** |

Each item is scored:
- **Yes** = Full points (varies by item)
- **No** = 0 points
- **N/A** = Not applicable (excluded from calculation)

---

## Key Files to Know

### Backend

| File | Purpose |
|------|---------|
| `src/routes/scorecards.js` | Scorecard CRUD + workflow |
| `src/routes/import.js` | Excel import (55K+ lines) |
| `src/routes/reports.js` | Analytics and comparisons |
| `src/routes/survey-intel.js` | Survey intelligence API |
| `src/routes/cms.js` | CMS data integration |
| `src/models/` | 18 Sequelize models |
| `src/data/auditCriteria.js` | 59 audit items definition |

### Frontend

| File | Purpose |
|------|---------|
| `src/pages/ScorecardsList.jsx` | Main scorecard list with filters |
| `src/pages/ScorecardDetail.jsx` | Edit scorecard items |
| `src/pages/Reports.jsx` | Analytics dashboard |
| `src/components/CMSTabs/` | CMS data visualization |
| `src/components/survey-intelligence/` | Risk dashboards |

---

## Scorecard Workflow

```
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│  DRAFT  │───▶│ TRIAL CLOSE │───▶│ HARD CLOSE  │
│         │    │ (Editable)  │    │ (Locked)    │
└─────────┘    └─────────────┘    └─────────────┘
     │                │                  │
     │                │                  │
   Create        Facility review    Permanent record
   & edit        can still modify   No changes allowed
```

**Key Rules:**
- Only Draft and Trial Close scorecards can be edited
- Hard Close is permanent - creates audit trail
- Each system tracks who completed it and when

---

## API Endpoints (Key Routes)

### Scorecards
```
GET    /api/scorecards                     # List (filterable)
POST   /api/scorecards                     # Create new
GET    /api/scorecards/:id                 # Get details
PUT    /api/scorecards/:id                 # Update items
POST   /api/scorecards/:id/trial-close     # Move to trial close
POST   /api/scorecards/:id/hard-close      # Move to hard close
DELETE /api/scorecards/:id                 # Delete (draft/trial only)
```

### Reports
```
GET /api/reports/team-comparison           # Compare facilities in team
GET /api/reports/company-comparison        # Company-level analytics
GET /api/reports/facility-comparison       # Multi-facility benchmark
GET /api/reports/system-analysis           # Performance by system
```

### CMS Data
```
GET /api/cms/snf/:ccn                      # Facility CMS data + trends
GET /api/cms/snf/:ccn/percentiles          # Peer percentiles
GET /api/cms/snf/search                    # Facility search
```

### Survey Intelligence
```
GET /api/survey-intel/facility/:id         # Facility risk score
GET /api/survey-intel/facility/:id/trends  # 3-year risk trend
GET /api/survey-intel/team/:teamId         # Team-level risk
```

### Historical Import
```
POST /api/import/validate                  # Validate Excel files
POST /api/import/execute                   # Execute import
GET  /api/import/history                   # Import batch history
POST /api/import/rollback/:batchId         # Rollback failed import
```

---

## Database Schema (Key Tables)

### Organizational Hierarchy
```
Company
  └── Team
        └── Facility (has CCN for CMS lookup)
              └── Scorecard (monthly audits)
```

### Key Models

**Scorecard Structure:**
```
Scorecard
  ├── ScorecardSystem (8 per scorecard)
  │     ├── ScorecardItem (varies by system)
  │     └── ScorecardResident (sample audited)
  └── ScorecardActivityLog (audit trail)
```

**Templates:**
```
AuditTemplate
  └── AuditTemplateSystem
        └── AuditTemplateItem
```

**Other:**
- `User` with `UserFacility` (many-to-many)
- `ImportBatch` for tracking historical imports
- `SurveyIntelligence` for cached risk data

---

## User Roles (6 Levels)

| Role | Access |
|------|--------|
| `admin` | Full system access, user/org management |
| `corporate` | Company-wide read access |
| `company_leader` | Company-level oversight |
| `team_leader` | Team management and visibility |
| `facility_leader` | Facility oversight and review |
| `clinical_resource` | Data entry only for assigned facilities |

---

## Running Locally

```bash
# Terminal 1: Backend
cd systemscheck/backend
npm install
npm run seed          # Creates DB with test data
npm start             # Runs on http://localhost:5000

# Terminal 2: Frontend
cd systemscheck/frontend
npm install
npm run dev           # Runs on http://localhost:5173
```

**Test Login:** admin@cascadia.com / password123

---

## Historical Import Feature

The system imports legacy Excel audits in multiple formats:

### Supported Formats

1. **Clinical Systems Review** - Full 8-system format with item-level detail
2. **KEV Hybrid** - Condensed format with category-level scoring
3. **KEV Mini** - Minimal format

### Import Flow

```
1. Upload Excel file(s)
         │
         ▼
2. Auto-detect format (by column headers)
         │
         ▼
3. Fuzzy match facility names to database
         │
         ▼
4. Validate data and show preview
         │
         ▼
5. Execute import (creates scorecards)
         │
         ▼
6. Track batch for rollback if needed
```

---

## Survey Intelligence

Four-layer risk assessment:

### 1. Survey Risk Score
Composite of:
- **Lagging indicators** - Past deficiencies, citations, penalties
- **Leading indicators** - Staffing turnover, occupancy trends
- **Quality measures** - Health inspection results
- **Peer comparison** - Percentile ranking in state

### 2. Operational Context
- Capacity strain (beds vs occupancy)
- Resource adequacy (staffing levels)
- Quadrant classification (high/low capacity × high/low resources)

### 3. Alert Flags
Critical issues requiring immediate attention

### 4. Recommendations
Actionable next steps based on risk profile

---

## Current Status

### Fully Complete
- All 8 clinical systems with 59 items
- Draft → Trial Close → Hard Close workflow
- Historical Excel import with rollback
- CMS data integration
- Survey intelligence risk scoring
- Team/Company/Facility comparison reports
- User roles and access control
- PDF export of scorecards
- Admin template management

### No Known Blockers
TODO.md shows 0 outstanding items

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/systemscheck
MARKET_DATABASE_URL=postgresql://user:pass@host:5432/market
JWT_SECRET=your-secret-key
NODE_ENV=production

# Optional
CORS_ORIGIN=https://your-frontend.com
```

---

## Key Concepts

### CCN (CMS Certification Number)
Every Medicare facility has a 6-character CCN. SystemsCheck uses this to pull CMS quality data.

### System Completion Tracking
Each of the 8 systems tracks:
- `completedBy` - User who finished the system
- `completedAt` - Timestamp of completion

### Activity Logging
Every scorecard change is logged:
- Who made the change
- What changed
- When it happened

---

## Related Projects

- **pac-advocate** - Uses same CMS/Market database
- **snfalyze** - May inform acquisition targets for auditing
- Shares market database for CMS facility data

---

*For complete architecture details, see CONTEXT.md*
