const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditTemplate = sequelize.define('AuditTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Master Template'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'audit_templates',
  timestamps: true,
  underscored: true
});

module.exports = AuditTemplate;
