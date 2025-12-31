# SystemsCheck - Development Handoff Document

> **Purpose**: Context document for continuing development in a new chat session
> **Last Updated**: December 23, 2025
> **Current Status**: Prompts 1-8 COMPLETE, Ready for Prompt 9

---

## Project Overview

**SystemsCheck** is a clinical audit scorecard web application for Cascadia Healthcare, replacing Excel-based monthly quality reviews for 60+ skilled nursing facilities (SNFs) across 6 companies and 15 teams.

### Core Concept
- 8-tab scorecard system covering different clinical areas
- Each tab (system) scores 0-100 points, 800 total possible
- Monthly audits per facility
- Workflow: Draft → Trial Close (facility review, can reopen) → Hard Close (permanent)

### The 8 Clinical Systems
1. Change of Condition (9 items, 100 pts)
2. Accidents, Falls, Incidents (8 items, 100 pts)
3. Skin (8 items, 100 pts)
4. Medication Management & Weight Loss (8 items, 100 pts)
5. Infection Control (7 items, 100 pts)
6. Transfer/Discharge (6 items, 100 pts)
7. Abuse Self-Report Grievances (6 items, 100 pts)
8. Observations & Interviews (7 items, 100 pts)

**Total: 59 audit items, 800 points**

---

## Tech Stack

### Backend
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- JWT authentication (24hr expiration)
- bcrypt password hashing

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router
- Axios (with JWT interceptors)
- Recharts (for charts)
- Lucide React (icons)

### Deployment Target
- Render

---

## File Structure

```
/systemscheck
├── /backend
│   └── /src
│       ├── /config
│       │   └── database.js
│       ├── /data
│       │   └── auditCriteria.js       # All 59 audit items defined here
│       ├── /middleware
│       │   └── auth.js                # authenticateToken, authorizeRoles, canAccessFacility
│       ├── /models
│       │   ├── index.js
│       │   ├── Company.js
│       │   ├── Team.js
│       │   ├── Facility.js
│       │   ├── User.js
│       │   ├── UserFacility.js
│       │   ├── Scorecard.js
│       │   ├── ScorecardSystem.js
│       │   ├── ScorecardItem.js
│       │   ├── ScorecardResident.js
│       │   └── ScorecardActivityLog.js
│       ├── /routes
│       │   ├── auth.js
│       │   ├── users.js
│       │   ├── facilities.js
│       │   └── scorecards.js
│       ├── app.js
│       └── seed.js
│
├── /frontend
│   └── /src
│       ├── /api
│       │   ├── client.js              # Axios with interceptors
│       │   ├── auth.js
│       │   ├── facilities.js
│       │   └── scorecards.js
│       ├── /components
│       │   ├── /layout
│       │   │   ├── Layout.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── Header.jsx
│       │   └── /ui
│       │       ├── Button.jsx
│       │       ├── Input.jsx
│       │       ├── Card.jsx
│       │       ├── Badge.jsx
│       │       ├── Select.jsx
│       │       ├── Modal.jsx
│       │       └── Toast.jsx
│       ├── /context
│       │   └── AuthContext.jsx
│       ├── /pages
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── /facilities
│       │   │   ├── FacilityList.jsx
│       │   │   └── FacilityDetail.jsx
│       │   └── /scorecards
│       │       ├── ScorecardForm.jsx
│       │       └── /components
│       │           ├── ScoreDisplay.jsx
│       │           ├── AuditItemRow.jsx
│       │           ├── ResidentsSection.jsx
│       │           ├── SystemTab.jsx
│       │           ├── SummaryTab.jsx
│       │           └── StatusModals.jsx
│       ├── App.jsx
│       └── main.jsx
```

---

## Database Schema

### Core Tables
- **companies** - 6 healthcare companies
- **teams** - 15 regional teams (belongs to company)
- **facilities** - 60 SNF facilities (belongs to team)
- **users** - User accounts with roles
- **user_facilities** - Junction table for facility assignments

### Scorecard Tables
- **scorecards** - Monthly scorecard per facility (status: draft/trial_close/hard_close)
- **scorecard_systems** - 8 systems per scorecard with scores
- **scorecard_items** - 59 items per scorecard (charts_met, sample_size, points, notes)
- **scorecard_residents** - Residents reviewed (initials, patient_record_number)
- **scorecard_activity_log** - Audit trail of all changes

### User Roles
- `admin` - Full access, manage users/orgs
- `corporate` - View all facilities
- `company_leader` - View company's facilities
- `team_leader` - View team's facilities
- `clinical_resource` - View/edit assigned facilities only

---

## Test Accounts

```
Admin:     admin@cascadia.com / password123
Clinician: clinician@cascadia.com / password123
```

The clinician is assigned to 3 facilities for testing role-based access.

---

## API Endpoints

### Auth
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

### Users (admin only)
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

### Facilities
- GET /api/facilities (with filters: search, company_id, team_id, facility_type)
- GET /api/facilities/filters
- GET /api/facilities/:id
- GET /api/facilities/:id/scorecards
- GET /api/facilities/:id/trend

### Scorecards
- POST /api/facilities/:facilityId/scorecards (create)
- GET /api/scorecards/:id
- PUT /api/scorecards/:id (partial update with items, addResidents, removeResidents)
- PATCH /api/scorecards/:id/status
- GET /api/scorecards/:id/activity

---

## Build Progress

### ✅ Prompt 1: Project Setup & Database - COMPLETE
- Full-stack structure created
- PostgreSQL schema with all models
- Seed script with test data
- Health check endpoint

### ✅ Prompt 2: Authentication & Authorization - COMPLETE
- JWT auth with 24hr expiration
- Role-based middleware
- Facility access control
- User CRUD endpoints

### ✅ Prompt 3: Scorecard API - COMPLETE
- All CRUD endpoints
- Auto-populate systems/items from auditCriteria.js
- Scoring calculation
- Status workflow enforcement
- Activity logging

### ✅ Prompt 4: Complete Audit Criteria - COMPLETE
- All 59 items across 8 systems defined in auditCriteria.js
- Matches original Excel template

### ✅ Prompt 5: Frontend Setup & Auth UI - COMPLETE
- React + Vite + Tailwind
- AuthContext with token persistence
- Login page
- Layout with sidebar/header
- Base UI components

### ✅ Prompt 6: Facility List & Detail Pages - COMPLETE
- Facility list with search/filters
- Facility cards with scorecard status
- Facility detail with history table
- Score trend chart (Recharts)

### ✅ Prompt 7: Scorecard Form - Systems 1-8 - COMPLETE
- 8-tab interface with auto-save
- All audit item inputs with validation
- Residents section
- Keyboard navigation
- (Built more than expected - included all 8 systems)

### ✅ Prompt 8: Workflow & Polish - COMPLETE
- Status confirmation modals (Trial Close, Reopen, Hard Close)
- Read-only mode for closed scorecards
- Summary tab (9th tab) with stats and completion checklist
- Toast notifications
- Error handling
- Last editor display

---

## Remaining Prompts

### 🔲 Prompt 9: Scorecard View & PDF Export - READY TO BUILD

```
Build the scorecard view page for presenting completed scorecards and PDF export functionality.

## Scorecard View Page

Create /pages/scorecards/ScorecardView.jsx at route /scorecards/:id

This is a presentation-focused view (different from the edit form) for reviewing and sharing completed scorecards.

### Header Section
- Facility name, month/year
- Status badge (Draft/Trial Close/Hard Close)
- Total score prominently displayed: "687 / 800" with percentage
- Color-coded background based on score (green ≥720 (90%), yellow 560-719 (70-89%), red <560)
- Action buttons:
  - "Edit" (if draft status and user has permission)
  - "Export PDF" 
  - "Print" (triggers browser print)
  - "Back to Facility" link

### Score Summary Cards
Row of 8 cards (one per system):
- System name
- Score: "92/100"
- Small progress bar
- Color coding: green (≥90%), yellow (70-89%), red (<70%)
- Clickable to scroll to that system's details

### Radar Chart
Using Recharts RadarChart:
- 8 axes (one per system)
- Show actual scores as percentage (0-100 scale)
- Fill color based on overall score
- Tooltip showing exact values

### System Details (Expandable Sections)
For each of the 8 systems, an expandable accordion:
- Header: System name + score + expand/collapse icon
- Default: First 3 systems expanded, rest collapsed
- Expanded content:
  - Table of audit items:
    | Audit Item | # Met | Sample | Points | Notes |
  - Subtotal row
  - Residents reviewed section (if any residents logged)

### Activity Timeline
Section at bottom showing scorecard history:
- GET /api/scorecards/:id/activity
- Show timeline of events:
  - "Created by [name] on [date]"
  - "Edited by [name] on [date]" 
  - "Trial closed by [name] on [date]"
  - "Reopened by [name] on [date]"
  - "Hard closed by [name] on [date]"
- Most recent at top
- Show relative time (e.g., "2 days ago") with full date on hover

## PDF Export

Install @react-pdf/renderer:
cd frontend && npm install @react-pdf/renderer

Create /pages/scorecards/ScorecardPDF.jsx:

### Page 1: Summary
- Header: "Clinical Audit Scorecard"
- Facility name, month/year, date generated
- Large total score with percentage
- Table of 8 systems with scores
- Status and completion info

### Pages 2+: System Details
One page per system (or combine if they fit):
- System name and score header
- Table of all audit items with columns:
  - Item description
  - # Met
  - Sample Size
  - Points Earned
  - Notes (if any)
- Subtotal
- Residents reviewed for that system

### PDF Styling
- Professional layout with Cascadia branding colors
- Clear typography (use built-in fonts)
- Color-coded scores (green/yellow/red)
- Page numbers in footer
- "Generated on [date]" in footer

### Export Button Handler
- Show loading spinner on button while generating
- Generate PDF blob using @react-pdf/renderer
- Trigger download with filename: "[FacilityName]-Scorecard-[Month]-[Year].pdf"

## Print Styles

Add print-specific CSS:
- Hide navigation, sidebar, action buttons
- Show all accordion sections expanded
- Clean black/white friendly styling
- Page breaks between systems
- Header with facility info on each page

## Update Routes

In App.jsx, the /scorecards/:id route should go to ScorecardView (view mode).
The /scorecards/:id/edit route goes to ScorecardForm (edit mode).

## API - Add endpoint if needed

The existing GET /api/scorecards/:id should return all needed data.
Verify it includes: facility info, all systems with items, residents, activity log.
```

### 🔲 Prompt 10: Dashboard & Reporting

```
Build role-based dashboards and comparison reporting pages.

## Dashboard Page (/dashboard)

Role-based content:

### Clinical Resource Dashboard
- "My Facilities" section showing assigned facilities
- Current month scorecard status for each (Not Started / In Progress / Complete)
- Quick action buttons to start or continue scorecards
- Recent activity feed (last 10 actions across their facilities)

### Team Leader Dashboard
- Team overview: X facilities, Y scorecards completed this month
- Facilities list with completion status
- Team average score vs previous month
- Facilities needing attention (incomplete or low scores)

### Company Leader Dashboard
- Company overview stats
- Teams comparison table (avg score, completion rate)
- Trend chart showing company average over time
- Low-performing facilities list

### Corporate/Admin Dashboard
- Organization-wide stats
- Companies comparison
- Overall trends
- System-wide analysis (which systems score lowest across all facilities?)

## Comparison Pages

### Team Comparison (/reports/teams)
- Select company (or all)
- Table: Team Name | # Facilities | Avg Score | Completion Rate | Trend
- Bar chart comparing team averages
- Filter by date range

### Company Comparison (/reports/companies)
- Table: Company | # Teams | # Facilities | Avg Score | Completion Rate
- Bar chart
- Trend lines over time

### Facility Comparison (/reports/facilities)
- Select company → team (cascading filters)
- Compare up to 10 facilities side by side
- Radar chart overlay
- System-by-system breakdown table

### System Analysis (/reports/systems)
- Shows performance by system across organization
- Which systems score lowest? (training opportunity identification)
- Filter by company/team
- Trend over time per system

## API Endpoints

Create /routes/reports.js:

- GET /api/reports/dashboard - Role-based dashboard data
- GET /api/reports/teams?company_id=&date_from=&date_to=
- GET /api/reports/companies?date_from=&date_to=
- GET /api/reports/facilities/compare?facility_ids[]=1&facility_ids[]=2
- GET /api/reports/systems?company_id=&team_id=&date_from=&date_to=

## Date Range Filters

Standard filter component with presets:
- This Month
- Last 3 Months
- Last 6 Months
- Last 12 Months
- Custom Range (date pickers)
```

### 🔲 Prompt 11: User Management & Settings

```
Build admin user management and organization settings pages.

## User Management (/admin/users)

Admin-only page.

### User List
- Table: Name | Email | Role | Status | Facilities | Actions
- Search by name/email
- Filter by role, status (active/inactive)
- Pagination

### Create User Modal
- Form: First Name, Last Name, Email, Role (dropdown), Password, Confirm Password
- On submit: POST /api/users
- Success: Add to list, show toast

### Edit User Modal
- Same form, pre-populated
- Cannot change email
- Password fields optional (only if changing)
- PUT /api/users/:id

### Facility Assignment
- When role is clinical_resource or team_leader, show facility assignment
- Searchable multi-select of facilities
- For team_leader: auto-include all team facilities
- For clinical_resource: manual selection

### Deactivate User
- Confirmation modal
- Soft delete (set status to inactive)
- Cannot deactivate yourself

### Reset Password
- Admin can trigger password reset
- Either: set temporary password, or send reset email (if email configured)

## Organization Management (/admin/organization)

Admin-only. Tabs for Companies, Teams, Facilities.

### Companies Tab
- List of companies with # teams, # facilities
- Add/Edit company (name only)
- Cannot delete if has teams

### Teams Tab
- Filter by company
- List with company name, # facilities
- Add/Edit team (name, company)
- Cannot delete if has facilities

### Facilities Tab
- Filter by company → team
- List with full details
- Add/Edit facility:
  - Name, Type (SNF/ALF/ILF), Address, City, State, Zip
  - Team assignment
- Soft delete (mark inactive)

## User Profile (/profile)

Available to all users.

- View/edit own name
- Change password (current password required)
- View assigned facilities (read-only)
- View role (read-only)

## Settings Page (/admin/settings)

Admin-only.

- App settings (placeholder for future)
- Data export: Download all scorecards as CSV
- Audit log viewer: Recent system-wide activity

## API Endpoints

Ensure these exist or create:
- GET/POST/PUT/DELETE /api/users (exists)
- GET/POST/PUT/DELETE /api/companies
- GET/POST/PUT/DELETE /api/teams  
- GET/POST/PUT/DELETE /api/facilities (add create/update/delete)
- PUT /api/users/:id/password (change password)
- GET /api/users/:id/facilities (assigned facilities)
- PUT /api/users/:id/facilities (update assignments)
```

### 🔲 Prompt 12: Historical Import & Polish

```
Build Excel import for historical data and final application polish.

## Historical Data Import (/admin/import)

Admin-only page for importing past scorecard data from Excel.

### Upload Section
- Drag-and-drop or file picker for .xlsx/.xls
- Download template button (generate sample Excel)
- Instructions text explaining format

### Template Format
Excel with columns:
- Facility Name (must match exactly)
- Month (1-12)
- Year (2020-2025)
- System 1 Score (0-100)
- System 2 Score (0-100)
- ... (all 8 systems)
- Total Score (optional, calculated if missing)

### Import Flow

Step 1: Upload & Parse
- Read Excel file (use xlsx library - already in backend or add to frontend)
- Show preview table of parsed data
- Highlight any parsing errors in red

Step 2: Validation
- Check facility names match database
- Validate scores are 0-100
- Check for duplicates (same facility + month + year)
- Show validation summary: X valid, Y errors

Step 3: Review & Confirm
- Show what will be imported
- Option to skip errored rows
- Confirm button

Step 4: Import
- Create scorecards with status: hard_close
- Set systems scores (items will be empty - just total per system)
- Show progress bar
- Final summary: X imported successfully

### API Endpoint
POST /api/import/historical
- Accepts array of scorecard data
- Creates scorecard + systems (no individual items)
- Returns success/error counts

## Final Polish

### Loading States
- Skeleton loaders for lists and cards
- Spinner for form submissions
- Disabled buttons while loading

### Empty States
- No facilities found → helpful message + clear filters button
- No scorecards yet → "Start your first audit" CTA
- No activity → "No activity to show"

### Error Handling
- Global error boundary
- API error toasts with retry options
- Form validation messages
- 404 page for bad routes

### Keyboard Shortcuts
- Ctrl/Cmd + S → Save (on scorecard form)
- Escape → Close modals
- ? → Show keyboard shortcuts modal (optional)

### Accessibility
- Focus management in modals
- ARIA labels on interactive elements
- Skip to main content link
- Sufficient color contrast

### Performance
- Lazy load routes (React.lazy + Suspense)
- Debounce search inputs
- Pagination on all lists
- Memoize expensive calculations

## Deployment Prep

### Environment Variables
Document required env vars:

Backend (.env):
- DATABASE_URL
- JWT_SECRET
- PORT

Frontend (.env):
- VITE_API_URL

### Database Setup
- Ensure migrations/seed can run on fresh database
- Document Render PostgreSQL setup

### Build Scripts
- Backend: npm start (or node src/app.js)
- Frontend: npm run build → outputs to dist/

### Render Deployment
- Create web service for backend
- Create static site for frontend
- Set environment variables
- Connect PostgreSQL database
```

---

## Key Implementation Notes

### Scoring Calculation
```javascript
// Item points calculation
item.points = (item.max_points / item.sample_size) * item.charts_met

// System score = sum of all item points in that system
// Total score = sum of all 8 system scores
```

### Status Workflow
- `draft` → Can edit, can Trial Close
- `trial_close` → Read-only, can Reopen or Hard Close
- `hard_close` → Permanently locked

### Role-Based Access
- Admins see everything
- Users only see facilities they're assigned to (via user_facilities table)
- Team leaders see their team's facilities
- Company leaders see their company's facilities

### Auto-Save
- 500ms debounce on scorecard form changes
- Saves items, residents in single PUT request
- Shows "Saving..." / "All changes saved" indicator

---

## How to Continue

1. Start a new Claude.ai chat
2. Share this document as context
3. Ask to "Continue with Prompt 9" (or wherever you left off)
4. Claude Code will have all the context needed to continue building

---

## Commands Reference

```bash
# Backend
cd systemscheck/backend
npm install
npm run seed    # Seed database with test data
npm run dev     # Start dev server (nodemon)

# Frontend  
cd systemscheck/frontend
npm install
npm run dev     # Start Vite dev server
```

---

*Document generated for handoff continuity. Project path: /systemscheck*
