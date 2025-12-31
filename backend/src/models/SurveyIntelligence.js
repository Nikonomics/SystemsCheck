const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SurveyIntelligence = sequelize.define('SurveyIntelligence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  facilityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'facility_id',
    references: {
      model: 'facilities',
      key: 'id'
    }
  },
  federalProviderNumber: {
    type: DataTypes.STRING(10),
    field: 'federal_provider_number'
  },

  // Survey Risk Score
  surveyRiskScore: {
    type: DataTypes.INTEGER,
    field: 'survey_risk_score'
  },
  surveyRiskTier: {
    type: DataTypes.STRING(20),
    field: 'survey_risk_tier'
  },

  // Operational Context
  resourceScore: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'resource_score'
  },
  capacityStrain: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'capacity_strain'
  },
  quadrant: {
    type: DataTypes.STRING(20)
  },

  // Individual Metrics
  turnoverRate: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'turnover_rate'
  },
  turnoverStatus: {
    type: DataTypes.STRING(20),
    field: 'turnover_status'
  },
  rnSkillMix: {
    type: DataTypes.DECIMAL(5, 4),
    field: 'rn_skill_mix'
  },
  rnSkillMixStatus: {
    type: DataTypes.STRING(20),
    field: 'rn_skill_mix_status'
  },
  rnHours: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'rn_hours'
  },
  rnHoursStatus: {
    type: DataTypes.STRING(20),
    field: 'rn_hours_status'
  },
  weekendGap: {
    type: DataTypes.DECIMAL(5, 4),
    field: 'weekend_gap'
  },
  weekendGapStatus: {
    type: DataTypes.STRING(20),
    field: 'weekend_gap_status'
  },
  occupancyRate: {
    type: DataTypes.DECIMAL(5, 4),
    field: 'occupancy_rate'
  },
  occupancyStatus: {
    type: DataTypes.STRING(20),
    field: 'occupancy_status'
  },

  // Alert Flags
  alertFlags: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'alert_flags'
  },

  // Chain Context
  chainName: {
    type: DataTypes.STRING(255),
    field: 'chain_name'
  },
  chainAvgQm: {
    type: DataTypes.DECIMAL(3, 2),
    field: 'chain_avg_qm'
  },
  facilityVsChain: {
    type: DataTypes.DECIMAL(3, 2),
    field: 'facility_vs_chain'
  },

  // Focus Areas (top 3)
  focusArea1System: {
    type: DataTypes.STRING(100),
    field: 'focus_area_1_system'
  },
  focusArea1Score: {
    type: DataTypes.INTEGER,
    field: 'focus_area_1_score'
  },
  focusArea2System: {
    type: DataTypes.STRING(100),
    field: 'focus_area_2_system'
  },
  focusArea2Score: {
    type: DataTypes.INTEGER,
    field: 'focus_area_2_score'
  },
  focusArea3System: {
    type: DataTypes.STRING(100),
    field: 'focus_area_3_system'
  },
  focusArea3Score: {
    type: DataTypes.INTEGER,
    field: 'focus_area_3_score'
  },

  // Recommendations (top 3)
  recommendation1: {
    type: DataTypes.TEXT,
    field: 'recommendation_1'
  },
  recommendation2: {
    type: DataTypes.TEXT,
    field: 'recommendation_2'
  },
  recommendation3: {
    type: DataTypes.TEXT,
    field: 'recommendation_3'
  },

  calculatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'calculated_at'
  }
}, {
  tableName: 'survey_intelligence',
  timestamps: false,
  underscored: true
});

module.exports = SurveyIntelligence;
