const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KevHistorical = sequelize.define('KevHistorical', {
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
      min: 2000,
      max: 2100
    }
  },
  format: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'KEV Mini or KEV Hybrid'
  },
  facilityName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'facility_name',
    comment: 'Facility name as extracted from the file'
  },
  reviewPeriod: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'review_period',
    comment: 'Review period text from cover sheet'
  },
  dateOfCompletion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'date_of_completion'
  },
  auditCompletedBy: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'audit_completed_by'
  },
  totalPossible: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_possible'
  },
  totalMet: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_met'
  },
  totalPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'total_percentage'
  },
  overallScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'overall_score'
  },
  originalFilename: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'original_filename'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'file_path',
    comment: 'Path to stored file on disk'
  },
  importBatchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'import_batch_id',
    references: {
      model: 'import_batches',
      key: 'id'
    }
  },
  importedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'imported_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'kev_historical',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['facility_id', 'month', 'year']
    },
    {
      fields: ['facility_id']
    },
    {
      fields: ['import_batch_id']
    }
  ]
});

module.exports = KevHistorical;
