const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScorecardSystem = sequelize.define('ScorecardSystem', {
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
  systemNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'system_number',
    validate: {
      min: 1,
      max: 8
    }
  },
  systemName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'system_name'
  },
  totalPointsPossible: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    field: 'total_points_possible'
  },
  totalPointsEarned: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_points_earned'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastEditedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'last_edited_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lastEditedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_edited_at'
  }
}, {
  tableName: 'scorecard_systems',
  timestamps: true,
  underscored: true
});

module.exports = ScorecardSystem;
