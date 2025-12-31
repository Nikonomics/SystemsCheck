const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KevHistoricalCategory = sequelize.define('KevHistoricalCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  kevHistoricalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'kev_historical_id',
    references: {
      model: 'kev_historical',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  categoryName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'category_name',
    comment: 'Abuse & Grievances, Accidents & Incidents, etc.'
  },
  possibleScore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'possible_score'
  },
  metScore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'met_score'
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sort_order',
    defaultValue: 0
  }
}, {
  tableName: 'kev_historical_categories',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['kev_historical_id']
    }
  ]
});

module.exports = KevHistoricalCategory;
