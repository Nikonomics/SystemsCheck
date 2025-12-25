const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditTemplateItem = sequelize.define('AuditTemplateItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  templateSystemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'template_system_id',
    references: {
      model: 'audit_template_systems',
      key: 'id'
    }
  },
  itemNumber: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'item_number'
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  maxPoints: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'max_points'
  },
  sampleSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    field: 'sample_size'
  },
  multiplier: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1
  },
  inputType: {
    type: DataTypes.ENUM('binary', 'sample'),
    allowNull: false,
    defaultValue: 'sample',
    field: 'input_type'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order'
  }
}, {
  tableName: 'audit_template_items',
  timestamps: true,
  underscored: true
});

module.exports = AuditTemplateItem;
