const sequelize = require('../config/database');
const Company = require('./Company');
const Team = require('./Team');
const Facility = require('./Facility');
const User = require('./User');
const UserFacility = require('./UserFacility');
const Scorecard = require('./Scorecard');
const ScorecardSystem = require('./ScorecardSystem');
const ScorecardItem = require('./ScorecardItem');
const ScorecardResident = require('./ScorecardResident');
const ScorecardActivityLog = require('./ScorecardActivityLog');
const AuditTemplate = require('./AuditTemplate');
const AuditTemplateSystem = require('./AuditTemplateSystem');
const AuditTemplateItem = require('./AuditTemplateItem');

// Company - Team associations
Company.hasMany(Team, { foreignKey: 'companyId', as: 'teams' });
Team.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Team - Facility associations
Team.hasMany(Facility, { foreignKey: 'teamId', as: 'facilities' });
Facility.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

// User - Facility many-to-many (for clinical resources)
User.belongsToMany(Facility, {
  through: UserFacility,
  foreignKey: 'userId',
  otherKey: 'facilityId',
  as: 'assignedFacilities'
});
Facility.belongsToMany(User, {
  through: UserFacility,
  foreignKey: 'facilityId',
  otherKey: 'userId',
  as: 'assignedUsers'
});

// Facility - Scorecard associations
Facility.hasMany(Scorecard, { foreignKey: 'facilityId', as: 'scorecards' });
Scorecard.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });

// User - Scorecard associations (created by, trial closed by, hard closed by)
User.hasMany(Scorecard, { foreignKey: 'createdById', as: 'createdScorecards' });
Scorecard.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

User.hasMany(Scorecard, { foreignKey: 'trialClosedById', as: 'trialClosedScorecards' });
Scorecard.belongsTo(User, { foreignKey: 'trialClosedById', as: 'trialClosedBy' });

User.hasMany(Scorecard, { foreignKey: 'hardClosedById', as: 'hardClosedScorecards' });
Scorecard.belongsTo(User, { foreignKey: 'hardClosedById', as: 'hardClosedBy' });

User.hasMany(Scorecard, { foreignKey: 'updatedById', as: 'updatedScorecards' });
Scorecard.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

// Scorecard - ScorecardSystem associations
Scorecard.hasMany(ScorecardSystem, { foreignKey: 'scorecardId', as: 'systems' });
ScorecardSystem.belongsTo(Scorecard, { foreignKey: 'scorecardId', as: 'scorecard' });

// User - ScorecardSystem (last edited by)
User.hasMany(ScorecardSystem, { foreignKey: 'lastEditedById', as: 'editedSystems' });
ScorecardSystem.belongsTo(User, { foreignKey: 'lastEditedById', as: 'lastEditedBy' });

// User - ScorecardSystem (completed by - different auditor can complete each system)
User.hasMany(ScorecardSystem, { foreignKey: 'completedById', as: 'completedSystems' });
ScorecardSystem.belongsTo(User, { foreignKey: 'completedById', as: 'completedBy' });

// ScorecardSystem - ScorecardItem associations
ScorecardSystem.hasMany(ScorecardItem, { foreignKey: 'scorecardSystemId', as: 'items' });
ScorecardItem.belongsTo(ScorecardSystem, { foreignKey: 'scorecardSystemId', as: 'system' });

// ScorecardSystem - ScorecardResident associations
ScorecardSystem.hasMany(ScorecardResident, { foreignKey: 'scorecardSystemId', as: 'residents' });
ScorecardResident.belongsTo(ScorecardSystem, { foreignKey: 'scorecardSystemId', as: 'system' });

// Scorecard - ScorecardActivityLog associations
Scorecard.hasMany(ScorecardActivityLog, { foreignKey: 'scorecardId', as: 'activityLogs' });
ScorecardActivityLog.belongsTo(Scorecard, { foreignKey: 'scorecardId', as: 'scorecard' });

// User - ScorecardActivityLog associations
User.hasMany(ScorecardActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ScorecardActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AuditTemplate associations
AuditTemplate.hasMany(AuditTemplateSystem, { foreignKey: 'templateId', as: 'systems', onDelete: 'CASCADE' });
AuditTemplateSystem.belongsTo(AuditTemplate, { foreignKey: 'templateId', as: 'template' });

AuditTemplateSystem.hasMany(AuditTemplateItem, { foreignKey: 'templateSystemId', as: 'items', onDelete: 'CASCADE' });
AuditTemplateItem.belongsTo(AuditTemplateSystem, { foreignKey: 'templateSystemId', as: 'system' });

// User - AuditTemplate associations
User.hasMany(AuditTemplate, { foreignKey: 'createdById', as: 'createdTemplates' });
AuditTemplate.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

User.hasMany(AuditTemplate, { foreignKey: 'updatedById', as: 'updatedTemplates' });
AuditTemplate.belongsTo(User, { foreignKey: 'updatedById', as: 'updatedBy' });

module.exports = {
  sequelize,
  Company,
  Team,
  Facility,
  User,
  UserFacility,
  Scorecard,
  ScorecardSystem,
  ScorecardItem,
  ScorecardResident,
  ScorecardActivityLog,
  AuditTemplate,
  AuditTemplateSystem,
  AuditTemplateItem
};
