/**
 * Seed Audit Template Only
 *
 * This script populates the audit template tables from auditCriteria.js
 * WITHOUT dropping or affecting any other data.
 *
 * Usage: node src/seeds/seedTemplate.js
 */

require('dotenv').config();
const sequelize = require('../config/database');
const {
  AuditTemplate,
  AuditTemplateSystem,
  AuditTemplateItem,
  User
} = require('../models');
const { getScoredSystems } = require('../data/auditCriteria');

async function seedTemplate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Sync only the template tables (creates them if they don't exist)
    console.log('Syncing template tables...');
    await AuditTemplate.sync({ alter: true });
    await AuditTemplateSystem.sync({ alter: true });
    await AuditTemplateItem.sync({ alter: true });

    // Check if template already exists
    const existingTemplate = await AuditTemplate.findOne({ where: { isActive: true } });
    if (existingTemplate) {
      console.log('\n⚠️  Active template already exists!');
      console.log(`   Name: ${existingTemplate.name}`);
      console.log(`   Created: ${existingTemplate.createdAt}`);
      console.log('\nTo re-seed, first delete the existing template or set isActive=false.');
      console.log('Exiting without changes.');
      process.exit(0);
    }

    // Find an admin user to attribute the template to
    let adminUser = await User.findOne({ where: { role: 'admin' } });
    const adminId = adminUser?.id || null;

    console.log('\nCreating master template...');

    // Create the master template
    const template = await AuditTemplate.create({
      name: 'Master Template',
      isActive: true,
      createdById: adminId,
      updatedById: adminId
    });

    // Create systems and items from auditCriteria
    const scoredSystems = getScoredSystems();
    let totalItems = 0;

    for (const systemData of scoredSystems) {
      const templateSystem = await AuditTemplateSystem.create({
        templateId: template.id,
        systemNumber: systemData.systemNumber,
        name: systemData.name,
        maxPoints: systemData.maxPoints,
        sections: systemData.sections || [],
        pageDescription: systemData.pageDescription || null,
        sortOrder: systemData.systemNumber
      });

      // Create items for this system
      for (let i = 0; i < systemData.items.length; i++) {
        const item = systemData.items[i];
        await AuditTemplateItem.create({
          templateSystemId: templateSystem.id,
          itemNumber: item.number,
          text: item.text,
          maxPoints: item.maxPoints,
          sampleSize: item.sampleSize,
          multiplier: item.multiplier,
          inputType: item.inputType,
          sortOrder: i + 1
        });
        totalItems++;
      }

      console.log(`  System ${systemData.systemNumber}: ${systemData.name} (${systemData.items.length} items)`);
    }

    console.log(`\n✅ Template seeded successfully!`);
    console.log(`   ${scoredSystems.length} systems`);
    console.log(`   ${totalItems} items`);
    console.log('\nYou can now access the Template Editor at /admin/template');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedTemplate();
