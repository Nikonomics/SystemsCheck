require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const models = require('./models');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const scorecardRoutes = require('./routes/scorecards');
const facilityRoutes = require('./routes/facilities');
const reportRoutes = require('./routes/reports');
const organizationRoutes = require('./routes/organization');
const importRoutes = require('./routes/import');
const templateRoutes = require('./routes/template');
const cmsDataRoutes = require('./routes/cmsData');
const surveyIntelRoutes = require('./routes/surveyIntel');
const surveyIntelTeamRoutes = require('./routes/surveyIntelTeam');
const { closeMarketPool } = require('./config/marketDatabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration - restrict in production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'SystemsCheck API',
    version: '1.0.0',
    description: 'Clinical audit scorecard system for skilled nursing facilities'
  });
});

// API Routes
// NOTE: More specific paths MUST be registered before general paths
// to prevent middleware from intercepting requests meant for other routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/import', importRoutes);
app.use('/api/admin/template', templateRoutes);
app.use('/api/cms', cmsDataRoutes);  // CMS routes are public - must be before general /api routes
app.use('/api/survey-intel', surveyIntelRoutes);  // Survey Intelligence - authenticated
app.use('/api/survey-intel', surveyIntelTeamRoutes);  // Team Intelligence - authenticated
app.use('/api', scorecardRoutes);     // Has router.use(authenticateToken)
app.use('/api', facilityRoutes);      // Has authenticateToken on each route
app.use('/api', reportRoutes);        // Has authenticateToken on each route

// Database sync and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models - alter: true adds new columns without dropping data
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    // Start server
    app.listen(PORT, () => {
      console.log(`SystemsCheck server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing connections...');
  await closeMarketPool();
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing connections...');
  await closeMarketPool();
  await sequelize.close();
  process.exit(0);
});

module.exports = app;
