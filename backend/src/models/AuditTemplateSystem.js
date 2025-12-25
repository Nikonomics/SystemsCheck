const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditTemplateSystem = sequelize.define('AuditTemplateSystem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'template_id',
    references: {
      model: 'audit_templates',
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  maxPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
    field: 'max_points'
  },
  sections: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  pageDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'page_description'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order'
  }
}, {
  tableName: 'audit_template_systems',
  timestamps: true,
  underscored: true
});

module.exports = AuditTemplateSystem;
