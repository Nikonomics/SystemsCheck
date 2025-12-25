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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', scorecardRoutes);
app.use('/api', facilityRoutes);
app.use('/api', reportRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/import', importRoutes);
app.use('/api/admin/template', templateRoutes);

// Database sync and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models (in development, use alter: true; in production, use migrations)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized.');
    }

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

module.exports = app;
