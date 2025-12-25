# SystemsCheck - Project Log

## 2025-12-25

### Session: Audit Criteria Review & Data Model Updates

#### Audit Criteria Corrections

**System 1: Change of Condition**
- Added `pageDescription`: "Residents within the month (3 charts)"
- Item 1: Added full text about "review of 24 hour report, orders etc."
- Item 2a/2b: Added "a)" and "b)" prefixes
- Item 3: Changed from "reviewed daily during IDT" to "noted/charted each shift for 72 hours..."
- Item 5: Added "Interview 3 CNAs" and "for their assigned residents"
- Item 6: Changed to "documentation of appropriate follow up"

**System 2: Accidents, Falls, Incidents**
- Added `pageDescription`: Sample selection guidance
- Added `environmentalFocuses` array: 7 focus areas (handrails, equipment, chemicals, etc.)
- Updated `sections` format
- Fixed all 15 items to match Excel exactly
- Item 14: Fixed sample size bug (was Sample 3, should be Sample 1)

**System 7: Abuse/Self-Report/Grievances** (by other chat)
- Updated name to "Abuse/Self Report/Grievance Review"
- Added sections array
- Updated all 8 items with full Excel text including F-tags and detailed criteria

**System 8: Observations & Interview**
- Added item numbers (1-14) to all observation items
- Updated all 14 items to match Excel exactly
- Key fixes: Sample sizes, F-tags, detailed criteria text
- Cleared `interviewTopics` (Excel has empty Staff Interviews column)

#### Data Model Changes

**ScorecardSystem Model** (`backend/src/models/ScorecardSystem.js`)
- Added `completedById` field (INTEGER, references users)
- Added `completedAt` field (DATE)
- Purpose: Track which auditor completed each system tab

**Model Associations** (`backend/src/models/index.js`)
- Added User → ScorecardSystem relationship for completedBy

**API Update** (`backend/src/routes/scorecards.js`)
- Added completedBy include (then commented out pending DB migration)
- TODO comment added with ALTER TABLE SQL

**AuditTemplate Models** (by other chat)
- Added `AuditTemplate.js` - Reusable audit template definitions
- Added `AuditTemplateSystem.js` - Systems within a template
- Added `AuditTemplateItem.js` - Items within a template system
- Added associations in index.js with cascading deletes
- Tracks createdBy/updatedBy for audit trail

#### Frontend Changes

**SystemTab.jsx** (`frontend/src/pages/scorecards/components/SystemTab.jsx`)
- Added `systemSections` configuration for Systems 2 and 4
- Added `getSectionForItem()` helper function
- Section headers now render as blue rows before section start items
- Uses React Fragment with proper keys

**SummaryTab.jsx** (`frontend/src/pages/scorecards/components/SummaryTab.jsx`)
- Fixed max score from 800 to 700 (7 scored systems × 100)
- Updated progress bar scale labels

#### Issues Encountered

**500 Error on Scorecard Load**
- Cause: Added `completedBy` include but DB column didn't exist
- Solution: Commented out include, added TODO for post-migration

**Port Conflict on Backend Restart**
- Cause: Previous process still holding port 3002
- Solution: `lsof -ti :3002 | xargs kill -9` before restart

---

## Initial Commit (Prior to this session)

### Project Setup
- Created full-stack application with React 19 frontend and Express/PostgreSQL backend
- Implemented authentication with JWT
- Built organizational hierarchy: Company → Team → Facility
- Created scorecard system with 7 scored clinical systems
- Added role-based access control with 6 user roles
- Implemented scoring calculations and reporting
- Added PDF export functionality
- Seeded with Cascadia Healthcare facilities data
