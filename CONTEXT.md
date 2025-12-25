# SystemsCheck - Project Context

## Project Overview
**SystemsCheck** is a clinical audit scorecard system for Skilled Nursing Facilities (SNFs), Assisted Living Facilities (ALFs), and Independent Living Facilities (ILFs). It enables monthly clinical audits based on 8 clinical systems with standardized scoring, multi-level organizational hierarchy, role-based access control, and comprehensive reporting.

## Current Status
**Phase**: Active Development - Audit Criteria Alignment
- Core application functional (authentication, scorecards, facilities, reports)
- Auditing `auditCriteria.js` against source Excel spreadsheet
- Systems 1, 2, 7, and 8 have been audited and corrected
- Systems 3-6 still need to be audited
- Data model enhanced for per-system auditor tracking (pending DB migration)
- Frontend section headers implemented for Systems 2 and 4

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Sequelize ORM** with PostgreSQL 14+
- **JWT** authentication with bcryptjs
- Runs on port 3002

### Frontend
- **React 19** with Vite
- **React Router v7** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **ReCharts** for visualizations
- **@react-pdf/renderer** for PDF export
- Runs on port 5173

### Database
- PostgreSQL with Sequelize ORM
- Uses `sequelize.sync()` (not migrations)
- Seed script at `backend/src/seeds/seed.js`

## File Structure

```
systemscheck/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # Sequelize PostgreSQL config
│   │   ├── models/                    # 14 Sequelize models
│   │   │   ├── Company.js
│   │   │   ├── Team.js
│   │   │   ├── Facility.js
│   │   │   ├── User.js
│   │   │   ├── UserFacility.js        # Many-to-many junction
│   │   │   ├── Scorecard.js
│   │   │   ├── ScorecardSystem.js     # 7 systems per scorecard
│   │   │   ├── ScorecardItem.js       # Individual audit items
│   │   │   ├── ScorecardResident.js   # Resident samples (per-system)
│   │   │   ├── ScorecardActivityLog.js
│   │   │   ├── AuditTemplate.js       # Reusable audit templates
│   │   │   ├── AuditTemplateSystem.js # Systems within a template
│   │   │   ├── AuditTemplateItem.js   # Items within a template system
│   │   │   └── index.js               # Model associations
│   │   ├── routes/                    # 7 API route modules
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── scorecards.js
│   │   │   ├── facilities.js
│   │   │   ├── reports.js
│   │   │   ├── organization.js
│   │   │   └── import.js
│   │   ├── middleware/
│   │   │   └── auth.js                # JWT & role authorization
│   │   ├── data/
│   │   │   └── auditCriteria.js       # 8 clinical systems definition
│   │   ├── utils/
│   │   │   └── scoring.js             # Score calculation logic
│   │   ├── seeds/
│   │   │   └── seed.js                # Database seeding
│   │   └── index.js                   # Express entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                       # API client modules
│   │   ├── components/
│   │   │   ├── layout/                # Header, Sidebar, Layout
│   │   │   └── ui/                    # Reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Global auth state
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   ├── facilities/
│   │   │   ├── scorecards/
│   │   │   │   ├── ScorecardForm.jsx  # Main scorecard entry
│   │   │   │   ├── ScorecardView.jsx
│   │   │   │   ├── ScorecardPDF.jsx
│   │   │   │   └── components/
│   │   │   │       ├── SystemTab.jsx  # System form with sections
│   │   │   │       ├── SummaryTab.jsx # Score overview
│   │   │   │       ├── AuditItemRow.jsx
│   │   │   │       └── ResidentsSection.jsx
│   │   │   ├── reports/
│   │   │   ├── admin/
│   │   │   └── profile/
│   │   ├── App.jsx                    # Main routing
│   │   └── main.jsx
│   └── package.json
│
├── CONTEXT.md                         # This file
├── PROJECT_LOG.md                     # Action log
├── TODO.md                            # Task list
└── .claudemd                          # Claude project rules
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

### 5. Per-System Tracking
Each system tab can have:
- Different auditor (completedById, completedAt) - *model added, DB migration pending*
- Different residents reviewed (ScorecardResident links to ScorecardSystem)
- System-specific notes

### 6. Scoring Calculation
```javascript
Points Earned = (Maximum Points / Sample Size) × Charts Met
```
- Binary items: Full points if yes, 0 if no
- Sample items: Proportional scoring based on charts met

### 7. Audit Templates (New)
```
AuditTemplate → AuditTemplateSystem → AuditTemplateItem
```
- Allows creating reusable/customizable audit templates
- Templates can be versioned and modified without affecting existing scorecards
- Tracks createdBy and updatedBy for audit trail
- Cascading deletes: Deleting a template removes all systems and items

## Important Notes & Gotchas

### 1. Audit Criteria Source of Truth
Excel file: `/Users/nikolashulewsky/Desktop/2025 Clinical Systems Review Template 9-21-25.xlsx`
All `auditCriteria.js` content must match this file exactly.

### 2. Database Sync vs Migrations
Project uses `sequelize.sync()` not migrations. To add columns:
- Option A: Re-run seed script (drops all data)
- Option B: Manual SQL: `ALTER TABLE scorecard_systems ADD COLUMN...`

### 3. Section Headers
Defined in two places that must stay in sync:
- `auditCriteria.js`: `sections` array with names and item ranges
- `SystemTab.jsx`: `systemSections` object for UI rendering

### 4. completedBy Feature (Pending)
Model fields added but:
- Database columns not created yet
- API include commented out to prevent 500 errors
- Uncomment in `scorecards.js` after running ALTER TABLE

### 5. Port Configuration
- Backend: http://localhost:3002
- Frontend: http://localhost:5173

### 6. Summary Tab Bug (Fixed)
Was showing 800 max points, fixed to 700 (7 scored systems × 100)

## Recent Significant Changes

### Session: 2025-12-25
1. **System 1 Audited**: Updated all item text to match Excel exactly
2. **System 2 Audited**: Fixed text, added pageDescription, environmentalFocuses, sections
3. **System 7 Audited**: (by other chat) Updated to match Excel
4. **System 8 Audited**: Updated all 14 observation items to match Excel exactly
5. **Frontend Section Headers**: Added to SystemTab.jsx for Systems 2 and 4
6. **Per-System Auditor Model**: Added completedById/completedAt to ScorecardSystem
7. **Summary Tab Fix**: Changed max score from 800 to 700

## Current Priorities

### In Progress
1. Audit Systems 3-6 against Excel spreadsheet

### Next Steps
1. Run database migration for completedById/completedAt columns
2. Enable completedBy in API after migration
3. Build Scorecards list page (currently placeholder)
4. Add section headers for other systems as needed

## Active Blockers
- **completedBy API**: Commented out until DB columns added

---
*Last Updated: 2025-12-25*
