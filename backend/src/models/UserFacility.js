const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserFacility = sequelize.define('UserFacility', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  facilityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    field: 'facility_id',
    references: {
      model: 'facilities',
      key: 'id'
    }
  }
}, {
  tableName: 'user_facilities',
  timestamps: false,
  underscored: true
});

module.exports = UserFacility;
