const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScorecardActivityLog = sequelize.define('ScorecardActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  scorecardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'scorecard_id',
    references: {
      model: 'scorecards',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['created', 'edited', 'trial_closed', 'reopened', 'hard_closed']]
    }
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'scorecard_activity_log',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = ScorecardActivityLog;
