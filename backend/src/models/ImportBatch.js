const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImportBatch = sequelize.define('ImportBatch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  batchId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
    field: 'batch_id'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'completed_with_errors', 'failed', 'rolled_back'),
    defaultValue: 'pending',
    allowNull: false
  },
  importType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'import_type',
    defaultValue: 'historical_full'
  },
  totalFiles: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_files'
  },
  processedFiles: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'processed_files'
  },
  successCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'success_count'
  },
  failedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'failed_count'
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
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  errorLog: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'error_log'
  },
  scorecardIds: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: 'scorecard_ids'
  }
}, {
  tableName: 'import_batches',
  timestamps: true,
  underscored: true
});

module.exports = ImportBatch;
