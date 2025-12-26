const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Facility = sequelize.define('Facility', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'team_id',
    references: {
      model: 'teams',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  facilityType: {
    type: DataTypes.ENUM('SNF', 'ALF', 'ILF'),
    allowNull: false,
    defaultValue: 'SNF',
    field: 'facility_type'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  zipCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'zip_code'
  },
  ccn: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'ccn',
    comment: 'CMS Certification Number for linking to CMS data'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'facilities',
  timestamps: true,
  underscored: true
});

module.exports = Facility;
