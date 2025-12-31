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
