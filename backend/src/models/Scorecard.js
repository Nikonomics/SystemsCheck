const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Scorecard = sequelize.define('Scorecard', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  facilityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'facility_id',
    references: {
      model: 'facilities',
      key: 'id'
    }
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2020,
      max: 2100
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'trial_close', 'hard_close'),
    allowNull: false,
    defaultValue: 'draft'
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  trialClosedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'trial_closed_at'
  },
  trialClosedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'trial_closed_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  hardClosedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'hard_closed_at'
  },
  hardClosedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'hard_closed_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  totalScore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_score',
    defaultValue: 0
  },
  updatedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  importBatchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'import_batch_id',
    references: {
      model: 'import_batches',
      key: 'id'
    }
  }
}, {
  tableName: 'scorecards',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['facility_id', 'month', 'year']
    }
  ]
});

module.exports = Scorecard;
