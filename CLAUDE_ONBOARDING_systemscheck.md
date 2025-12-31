# systemscheck - Claude Code Onboarding Bundle

> **Auto-generated** - Do not edit manually
> Last updated: 2025-12-31 09:42:36
> Project: /Users/nikolashulewsky/Projects/systemscheck

This bundle contains all essential project context for onboarding new Claude Code sessions.

---

## README.md

```markdown
# SystemsCheck

Clinical Audit Scorecard System for Skilled Nursing Facilities

## Tech Stack

- **Backend**: Node.js, Express, Sequelize ORM, PostgreSQL
- **Frontend**: React 19, Tailwind CSS, React Router, Axios, Recharts
- **Authentication**: JWT + bcrypt
- **External Data**: CMS facility data via shared market database

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Project Structure

```
systemscheck/
├── backend/
│   ├── src/
│   │   ├── config/           # Database configuration (local + market DB)
│   │   ├── data/             # Audit criteria definitions
│   │   ├── database/         # SQL schemas
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── migrations/       # Database migrations
│   │   ├── models/           # 18 Sequelize models
│   │   ├── routes/           # 12 API route modules
│   │   ├── scripts/          # Data analysis & sync scripts
│   │   ├── seeds/            # Database seed scripts
│   │   ├── services/         # Business logic (Survey Intelligence)
│   │   └── utils/            # Excel/KEV parsers
│   ├── .env                  # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # API client modules
│   │   ├── components/       # Reusable UI components
│   │   │   ├── CMSTabs/      # CMS data tabs (Trends, Quality, etc.)
│   │   │   ├── layout/       # Header, Sidebar, Layout
│   │   │   ├── survey-intelligence/  # Survey Intel components
│   │   │   └── ui/           # Base UI components
│   │   ├── context/          # Auth context
│   │   ├── pages/            # Page components
│   │   └── utils/            # Parsers and helpers
│   └── package.json
├── clinical_systems_docs/    # Clinical systems documentation
├── focus_areas/              # Focus areas implementation
├── render.yaml               # Render deployment config
└── README.md
```

## Key Features

### 1. Clinical Audit Scorecards
- 8 clinical systems (7 scored, 1 reference)
- Monthly scorecards per facility with draft/trial-close/hard-close workflow
- Per-system auditor tracking with resident samples
- PDF export and multi-facility reporting

### 2. Historical Import System
- Multi-file Excel/KEV scorecard import
- Automatic format detection (Clinical Systems Review, KEV Hybrid, KEV Mini)
- Facility name matching with fuzzy logic
- Import batch tracking with rollback support

### 3. Survey Intelligence
- Survey risk scores based on CMS data
- Operational context (capacity strain, resource scores)
- Team and facility-level risk analytics
- 3-year trend analysis

### 4. CMS Data Integration
- Real-time facility ratings and trends from CMS
- Historical snapshots (2020-present)
- Health inspection, quality measures, staffing data
- Deficiency and citation tracking

## Environment Variables

```env
# Local SystemsCheck Database
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=systemscheck
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# External CMS/Market Database (read-only)
MARKET_DATABASE_URL=postgresql://user:pass@host/snf_market_data
```

## Setup Instructions

### 1. Create the Database

```bash
psql -U postgres -c "CREATE DATABASE systemscheck;"
```

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Seed the Database

```bash
cd backend
npm run db:seed-prod
```

This creates:
- 6 companies (Columbia, Envision, Three Rivers, Northern, Vincero, Olympus)
- 15 teams
- ~60 facilities with CCNs
- Test users

### 4. Start the Application

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cascadia.com | password123 |
| Clinical Resource | clinician@cascadia.com | password123 |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | User registration |
| GET | /api/auth/me | Get current user |

### Facilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/facilities | List facilities |
| GET | /api/facilities/:id | Get facility details |

### Scorecards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/scorecards | List scorecards |
| POST | /api/scorecards | Create scorecard |
| PUT | /api/scorecards/:id | Update scorecard |
| POST | /api/scorecards/:id/trial-close | Trial close |
| POST | /api/scorecards/:id/hard-close | Hard close |

### CMS Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cms/snf/:ccn | Get facility CMS data + trends |
| GET | /api/cms/snf/:ccn/percentiles | Get peer percentiles |
| GET | /api/cms/snf/search | Search SNF facilities |

### Survey Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/survey-intel/facility/:id | Facility intelligence |
| GET | /api/survey-intel/facility/:id/trends | Risk trends |
| GET | /api/survey-intel/team/:teamId | Team intelligence |
| GET | /api/survey-intel/team/:teamId/risk-trend | Team risk trend |

### Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/import/validate | Validate import files |
| POST | /api/admin/import/execute | Execute import |
| GET | /api/admin/import/history | Import history |
| POST | /api/admin/import/rollback/:batchId | Rollback import |

## Database Schema

### Core Tables
- **companies** - Top-level organizations
- **teams** - Regional teams within companies
- **facilities** - SNF/ALF/ILF facilities with CCNs
- **users** - System users with role-based access

### Scorecard Tables
- **scorecards** - Monthly scorecards per facility
- **scorecard_systems** - 8 clinical systems per scorecard
- **scorecard_items** - Individual audit criteria
- **scorecard_residents** - Resident samples for audits
- **scorecard_activity_log** - Audit trail

### Import Tables
- **import_batches** - Batch tracking for historical imports

### Template Tables
- **audit_templates** - Reusable audit templates
- **audit_template_systems** - Systems within templates
- **audit_template_items** - Items within template systems

### Intelligence Tables
- **survey_intelligence** - Cached survey intelligence data

## User Roles

1. `clinical_resource` - Facility-level data entry
2. `facility_leader` - Facility oversight
3. `team_leader` - Team management
4. `company_leader` - Company oversight
5. `corporate` - Corporate analytics
6. `admin` - System administration

## Deployment

Deployed on Render via `render.yaml`:
- **systemscheck-api** - Backend web service
- **systemscheck-web** - Frontend static site
- **systemscheck-db** - PostgreSQL database

## Development

### Available Scripts

```bash
# Backend
npm run dev          # Start with nodemon
npm run db:seed      # Seed local database
npm run db:seed-prod # Production-safe seed (alter mode)
npm run sync-facilities # Sync facilities from market DB

# Frontend
npm run dev          # Start Vite dev server
npm run build        # Production build
```

---
*Last Updated: 2025-12-31*
```

---

## backend/package.json

```json
{
  "name": "systemscheck-backend",
  "version": "1.0.0",
  "description": "Clinical audit scorecard system for skilled nursing facilities",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:import-batches": "node src/scripts/runMigration.js 20241230-add-import-batches",
    "db:seed": "node src/seeds/seed.js",
    "db:seed:template": "node src/seeds/seedTemplate.js",
    "db:reset": "sequelize-cli db:drop && sequelize-cli db:create && npm run db:migrate && npm run db:seed",
    "populate-ccns": "node src/scripts/populateCCNs.js",
    "db:add-ccns": "node src/scripts/addCcns.js",
    "db:seed-prod": "node src/scripts/seedProduction.js",
    "sync-facilities": "node src/scripts/syncSnfFacilities.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.2",
    "sequelize-cli": "^6.6.2",
    "uuid": "^9.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## frontend/package.json

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-pdf/renderer": "^4.3.1",
    "axios": "^1.13.2",
    "jspdf": "^3.0.4",
    "jspdf-autotable": "^5.0.2",
    "lucide-react": "^0.562.0",
    "posthog-js": "^1.310.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.11.0",
    "react-toastify": "^11.0.5",
    "recharts": "^3.6.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.19",
    "vite": "^7.2.4"
  }
}
```

---

## Project Structure

```
total 288
drwxr-xr-x  22 nikolashulewsky  staff    704 Dec 31 09:42 .
drwxr-xr-x  11 nikolashulewsky  staff    352 Dec 29 10:37 ..
-rw-------   1 nikolashulewsky  staff   3162 Dec 28 08:48 .claudemd
-rw-r--r--@  1 nikolashulewsky  staff   6148 Dec 28 08:47 .DS_Store
drwxr-xr-x  13 nikolashulewsky  staff    416 Dec 31 09:20 .git
-rw-------   1 nikolashulewsky  staff    272 Dec 30 19:18 .gitignore
-rw-------   1 nikolashulewsky  staff  12998 Dec 28 08:48 18_Survey_Intelligence_Architecture.md
-rw-r--r--@  1 nikolashulewsky  staff  28956 Dec 23 17:45 auditCriteria_corrected.js
drwxr-xr-x  10 nikolashulewsky  staff    320 Dec 30 09:20 backend
-rw-r--r--   1 nikolashulewsky  staff  10466 Dec 31 09:42 CLAUDE_ONBOARDING_systemscheck.md
drwx------@ 14 nikolashulewsky  staff    448 Dec 25 14:48 clinical_systems_docs
-rw-------   1 nikolashulewsky  staff  11392 Dec 31 09:42 CONTEXT.md
-rw-------   1 nikolashulewsky  staff   6778 Dec 28 08:48 DEPLOYMENT.md
drwx------  12 nikolashulewsky  staff    384 Dec 27 15:21 focus_areas
drwxr-xr-x  18 nikolashulewsky  staff    576 Dec 29 10:13 frontend
-rw-------   1 nikolashulewsky  staff   3578 Dec 28 08:48 PROJECT_LOG.md
-rw-------   1 nikolashulewsky  staff   7800 Dec 31 09:41 README.md
-rw-------   1 nikolashulewsky  staff   1592 Dec 28 08:47 render.yaml
drwxr-xr-x  21 nikolashulewsky  staff    672 Dec 28 12:42 Survey Risk Findings
-rw-r--r--   1 nikolashulewsky  staff   1797 Dec 27 13:35 survey_risk_coefficients.csv
-rw-r--r--@  1 nikolashulewsky  staff  20099 Dec 23 17:05 SYSTEMSCHECK_HANDOFF.md
-rw-------   1 nikolashulewsky  staff   4626 Dec 28 08:48 TODO.md

backend/:
node_modules
package-lock.json
package.json
src

frontend/:
dist
eslint.config.js
index.html
node_modules
package-lock.json
package.json
parse_excel.js
postcss.config.js
public
README.md
src
tailwind.config.js
vite.config.js

```
