const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScorecardItem = sequelize.define('ScorecardItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  scorecardSystemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'scorecard_system_id',
    references: {
      model: 'scorecard_systems',
      key: 'id'
    }
  },
  itemNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'item_number'
  },
  criteriaText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'criteria_text'
  },
  maxPoints: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'max_points'
  },
  chartsMet: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'charts_met'
  },
  sampleSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sample_size'
  },
  pointsEarned: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'points_earned'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'scorecard_items',
  timestamps: true,
  underscored: true
});

module.exports = ScorecardItem;
