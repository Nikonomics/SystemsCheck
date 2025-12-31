/**
 * Run a specific migration
 * Usage: node src/scripts/runMigration.js <migration-name>
 * Example: node src/scripts/runMigration.js 20241230-add-import-batches
 */

require('dotenv').config();
const sequelize = require('../config/database');

async function runMigration() {
  const migrationName = process.argv[2];

  if (!migrationName) {
    console.error('Usage: node src/scripts/runMigration.js <migration-name>');
    console.error('Example: node src/scripts/runMigration.js 20241230-add-import-batches');
    process.exit(1);
  }

  try {
    const migration = require(`../migrations/${migrationName}`);

    console.log(`Running migration: ${migrationName}...`);

    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`Migration not found: ${migrationName}`);
    } else {
      console.error('Migration failed:', error.message);
      console.error(error);
    }
    process.exit(1);
  }
}

runMigration();
