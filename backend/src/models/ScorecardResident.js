const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScorecardResident = sequelize.define('ScorecardResident', {
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
  residentInitials: {
    type: DataTypes.STRING(3),
    allowNull: false,
    field: 'resident_initials',
    validate: {
      len: [2, 3]
    }
  },
  patientRecordNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'patient_record_number'
  }
}, {
  tableName: 'scorecard_residents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = ScorecardResident;
