# systemscheck - Claude Code Onboarding Bundle

> **Auto-generated** - Do not edit manually
> Last updated: 2025-12-29 10:43:08
> Project: /Users/nikolashulewsky/Projects/systemscheck

This bundle contains all essential project context for onboarding new Claude Code sessions.

---

## README.md

```markdown
# SystemsCheck

Clinical Audit Scorecard System for Skilled Nursing Facilities

## Tech Stack

- **Backend**: Node.js, Express, Sequelize ORM, PostgreSQL
- **Frontend**: React 18, Tailwind CSS, React Router, Axios
- **Authentication**: JWT + bcrypt (to be implemented)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Project Structure

```
systemscheck/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes (to be added)
│   │   ├── middleware/     # Express middleware (to be added)
│   │   └── seeds/          # Database seed scripts
│   ├── .env                # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # React page components
│   │   ├── App.jsx         # Main app with routing
│   │   └── index.css       # Tailwind CSS imports
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE systemscheck;

# Exit
\q
```

### 2. Configure Environment Variables

Edit `backend/.env` with your database credentials:

```env
NODE_ENV=development
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=systemscheck
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Seed the Database

```bash
cd backend
npm run db:seed
```

This will create:
- 6 companies (Columbia, Envision, Three Rivers, Northern, Vincero, Olympus)
- 15 teams
- ~60 facilities
- 2 test users

### 5. Start the Application

In separate terminals:

```bash
# Terminal 1 - Backend (port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cascadia.com | password123 |
| Clinical Resource | clinician@cascadia.com | password123 |

## API Endpoints

### Available Now

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api | API information |
| GET | /api/health | Health check with database status |

### Coming Soon

- Authentication endpoints
- Scorecard CRUD operations
- User management
- Facility management

## Database Schema

### Core Tables

- **companies** - Top-level organization (6 companies)
- **teams** - Regional teams within companies (15 teams)
- **facilities** - SNF/ALF/ILF facilities (60+ facilities)
- **users** - System users with role-based access

### Scorecard Tables

- **scorecards** - Monthly scorecards per facility
- **scorecard_systems** - 8 clinical systems per scorecard
- **scorecard_items** - Individual criteria within systems
- **scorecard_residents** - Resident samples for audits
- **scorecard_activity_log** - Audit trail for changes

### User Roles

1. `clinical_resource` - Facility-level data entry
2. `facility_leader` - Facility oversight
3. `team_leader` - Team management
4. `company_leader` - Company oversight
5. `corporate` - Corporate analytics
6. `admin` - System administration

## Development

### Reset Database

```bash
cd backend
npm run db:seed  # This drops and recreates all tables
```

### Add New Models

1. Create model in `backend/src/models/`
2. Add associations in `backend/src/models/index.js`
3. Restart the server (auto-syncs in development)
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
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.35.2",
    "sequelize-cli": "^6.6.2"
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
total 200
drwxr-xr-x  17 nikolashulewsky  staff    544 Dec 29 10:43 .
drwxr-xr-x  11 nikolashulewsky  staff    352 Dec 29 10:37 ..
-rw-------   1 nikolashulewsky  staff   3162 Dec 28 08:48 .claudemd
-rw-r--r--@  1 nikolashulewsky  staff   6148 Dec 28 08:47 .DS_Store
drwxr-xr-x  12 nikolashulewsky  staff    384 Dec 29 10:17 .git
-rw-------   1 nikolashulewsky  staff    250 Dec 28 08:48 .gitignore
-rw-------   1 nikolashulewsky  staff  12998 Dec 28 08:48 18_Survey_Intelligence_Architecture.md
drwxr-xr-x  10 nikolashulewsky  staff    320 Dec 29 10:13 backend
-rw-r--r--   1 nikolashulewsky  staff   6311 Dec 29 10:43 CLAUDE_ONBOARDING_systemscheck.md
-rw-------   1 nikolashulewsky  staff  10363 Dec 28 08:48 CONTEXT.md
-rw-------   1 nikolashulewsky  staff   6778 Dec 28 08:48 DEPLOYMENT.md
drwxr-xr-x  18 nikolashulewsky  staff    576 Dec 29 10:13 frontend
-rw-------   1 nikolashulewsky  staff   3578 Dec 28 08:48 PROJECT_LOG.md
-rw-------   1 nikolashulewsky  staff   3817 Dec 28 08:48 README.md
-rw-------   1 nikolashulewsky  staff   1592 Dec 28 08:47 render.yaml
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
