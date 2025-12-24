# SystemsCheck Deployment Guide

## Overview

SystemsCheck is a clinical audit scorecard system for skilled nursing facilities. This guide covers deployment to Render.com.

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS (Static Site)
- **Backend**: Node.js + Express + Sequelize (Web Service)
- **Database**: PostgreSQL

## Prerequisites

- Node.js 18+ installed locally
- Git repository configured
- Render.com account

---

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd systemscheck

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (.env)**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/systemscheck
JWT_SECRET=your-development-secret-key
PORT=3001
NODE_ENV=development
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Database Setup

```bash
# Create the database (if using local PostgreSQL)
createdb systemscheck

# Run seeds (from backend directory)
npm run seed
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access the app at http://localhost:5173

---

## Render Deployment

### 1. Create PostgreSQL Database

1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `systemscheck-db`
   - Database: `systemscheck`
   - User: `systemscheck_user`
   - Region: Choose your preferred region
4. Click "Create Database"
5. Copy the "Internal Database URL" for the backend

### 2. Deploy Backend (Web Service)

1. Click "New +" → "Web Service"
2. Connect your Git repository
3. Configure:
   - Name: `systemscheck-api`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Region: Same as database

4. Add Environment Variables:
   - `DATABASE_URL`: (paste Internal Database URL from step 1)
   - `JWT_SECRET`: (generate a strong random string)
   - `NODE_ENV`: `production`

5. Click "Create Web Service"
6. Note the service URL (e.g., `https://systemscheck-api.onrender.com`)

### 3. Deploy Frontend (Static Site)

1. Click "New +" → "Static Site"
2. Connect your Git repository
3. Configure:
   - Name: `systemscheck-web`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

4. Add Environment Variables:
   - `VITE_API_URL`: `https://systemscheck-api.onrender.com/api`

5. Click "Create Static Site"

### 4. Seed Production Database

After the backend is deployed, seed the production database:

```bash
# Connect to Render shell or run locally with production DATABASE_URL
DATABASE_URL=<production-url> npm run seed:production
```

---

## Environment Variables Reference

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | Yes |
| `PORT` | Server port (default: 3001) | No |
| `NODE_ENV` | Environment (`development` or `production`) | No |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL (no trailing slash) | Yes |

---

## Seed Commands

```bash
# Development seed (creates test users and sample data)
npm run seed

# Production seed (creates only admin user)
npm run seed:production
```

**Default Test Accounts** (development only):
- Admin: `admin@cascadia.com` / `password123`
- Clinician: `clinician@cascadia.com` / `password123`

---

## Build Commands

### Backend

```bash
npm install     # Install dependencies
npm run dev     # Start development server with hot reload
npm start       # Start production server
npm run seed    # Seed database with sample data
```

### Frontend

```bash
npm install     # Install dependencies
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build locally
```

---

## Final Testing Checklist

Before going live, verify all functionality:

### Authentication
- [ ] Login works with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout works and clears session
- [ ] Protected routes redirect to login when unauthenticated

### Role-Based Access
- [ ] Admin can access all pages
- [ ] Non-admin cannot access admin pages (/admin/*)
- [ ] Users only see their assigned facilities (clinical_resource, team_leader)
- [ ] Company leaders only see their company's facilities

### Core Functionality
- [ ] Dashboard loads with correct role-based content
- [ ] Facility list displays correctly
- [ ] Facility detail page shows scorecards
- [ ] Create new scorecard flow works end-to-end
- [ ] Edit existing scorecard works
- [ ] Scorecard view displays all systems and items
- [ ] PDF export generates correctly

### Reports
- [ ] Team Comparison loads and filters work
- [ ] Company Comparison loads (admin only)
- [ ] Facility Comparison allows selecting multiple facilities
- [ ] System Analysis shows all 8 clinical systems

### Admin Features
- [ ] User Management: list, create, edit, deactivate
- [ ] Organization Management: companies, teams, facilities CRUD
- [ ] Settings: data export works
- [ ] Historical Import: file upload and import works

### User Profile
- [ ] Profile page loads with user data
- [ ] Name editing works
- [ ] Password change works
- [ ] Assigned facilities display correctly

### Mobile Responsiveness
- [ ] Sidebar collapses on mobile
- [ ] Tables are scrollable on small screens
- [ ] Forms are usable on mobile

### Error Handling
- [ ] 404 page displays for invalid routes
- [ ] API errors show toast notifications
- [ ] Form validation shows inline errors

---

## Troubleshooting

### Database Connection Issues

1. Verify `DATABASE_URL` format:
   ```
   postgresql://user:password@host:port/database
   ```

2. Check if database is running:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Frontend Can't Connect to Backend

1. Verify `VITE_API_URL` is set correctly (no trailing slash)
2. Check CORS settings in backend
3. Ensure backend is running and accessible

### Build Failures

1. Check Node.js version (18+ required)
2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Render Specific Issues

1. Free tier services spin down after 15 minutes of inactivity
2. First request after spin-down may take 30-60 seconds
3. Consider upgrading to paid tier for production use

---

## Support

For issues or questions, contact the development team or create an issue in the repository.
