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
