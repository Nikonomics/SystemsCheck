# SystemsCheck - TODO List

## High Priority

### Audit Criteria Alignment
- [x] ✅ **Audit System 3: Skin** - All items match Excel exactly (completed 2025-12-25)
- [x] ✅ **Audit System 4: Med Management & Weight Loss** - All items match Excel exactly (completed 2025-12-25)
- [x] ✅ **Audit System 5: Infection Control** - All items match Excel exactly (completed 2025-12-25)
- [x] ✅ **Audit System 6: Transfer/Discharge** - All items match Excel exactly (completed 2025-12-25)

### Database Migration
- [x] ✅ **Add completedBy columns** - completed_by_id and completed_at exist in scorecard_systems table
- [x] ✅ **Enable completedBy in API** - Associations enabled in scorecards.js

## Medium Priority

### Frontend Enhancements
- [x] ✅ **Build Scorecards list page** - Full list view at /scorecards (completed 2025-12-25)
  - Show all scorecards user has access to
  - Filter by facility, month/year, status
  - Display score and completion status
- [x] ✅ **Add section headers for remaining systems** - All systems with sections now configured (completed 2025-12-25)
  - Systems 3, 5, 6, 7 added to SystemTab.jsx systemSections (System 1 has no sections defined)

### Data Model
- [x] ✅ **Add completedBy UI** - Show who completed each system tab in the UI (completed 2025-12-25)
- [x] ✅ **Add system-level comments UI** - Notes textarea with auto-save, included in PDF export (completed 2025-12-25)

### Audit Templates
- [x] ✅ **Build AuditTemplate API routes** - Full CRUD at /api/admin/template (completed 2025-12-25)
- [x] ✅ **Build AuditTemplate admin UI** - TemplateEditor.jsx with inline editing (completed 2025-12-25)
- [x] ✅ **Integrate templates with scorecards** - Scorecard creation uses DB template with static fallback (completed 2025-12-25)

## Low Priority

### Reports & Analytics
- [x] ✅ **Add geographic filtering** - State filter on all report pages with URL persistence (completed 2025-12-25)
- [x] ✅ **Add trend charts** - LineChart/AreaChart implemented in all report pages

### Admin Features
- [x] ✅ **Build Organization management page** - Full CRUD for companies, teams, facilities (674 lines)
- [x] ✅ **Build Settings page** - Data export, audit log functionality (312 lines)

## Blocked

*None currently*

## Done

### 2025-12-25 (Session 3)
- [x] **Build Scorecards list page** - ScorecardsList.jsx with table, filters, sorting, pagination
- [x] **Add section headers to remaining systems** - Added Systems 3, 5, 6, 7 to systemSections in SystemTab.jsx
- [x] **Add completedBy UI** - Mark system complete feature with user tracking and visual indicators
- [x] **Add system-level notes UI** - Auditor notes textarea with debounced auto-save, included in PDF export
- [x] **Add geographic filtering to reports** - State filter on TeamComparison, CompanyComparison, SystemAnalysis pages with URL persistence

### 2025-12-25 (Session 2)
- [x] **Audit System 3: Skin** - All 8 items match Excel exactly
- [x] **Audit System 4: Med Management & Weight Loss** - All 16 items match Excel exactly
- [x] **Audit System 5: Infection Control** - All 10 items match Excel exactly
- [x] **Audit System 6: Transfer/Discharge** - All 10 items match Excel exactly
- [x] **Audit System 7: Abuse/Self-Report/Grievances** - All 8 items match Excel exactly
- [x] **Build Master Template Editor** - Full admin UI for editing audit criteria
- [x] **Template cascade to drafts** - Changes propagate to all draft scorecards
- [x] **Seed template from auditCriteria.js** - npm run db:seed:template command added
- [x] **Delete scorecard feature** - Admin can delete draft/trial_close scorecards

### 2025-12-25 (Session 1)
- [x] **Audit System 1: Change of Condition** - All items match Excel exactly
- [x] **Audit System 2: Accidents, Falls, Incidents** - All items match Excel, added metadata
- [x] **Audit System 8: Observations & Interview** - All 14 items match Excel exactly
- [x] **Add section headers to frontend** - SystemTab.jsx now renders section dividers
- [x] **Add per-system auditor model fields** - completedById/completedAt added to ScorecardSystem
- [x] **Fix Summary tab max score** - Changed from 800 to 700
- [x] **Create Claude onboarding docs** - .claudemd, CONTEXT.md, PROJECT_LOG.md, TODO.md

---

## Summary

| Category | Complete | Partial | Not Started |
|----------|----------|---------|-------------|
| Audit Criteria | 7/7 | 0 | 0 |
| Database | 2/2 | 0 | 0 |
| Frontend | 2/2 | 0 | 0 |
| Data Model | 2/2 | 0 | 0 |
| Audit Templates | 3/3 | 0 | 0 |
| Reports | 2/2 | 0 | 0 |
| Admin Features | 2/2 | 0 | 0 |
| **Total** | **20/20** | **0** | **0** |
