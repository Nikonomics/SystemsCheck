/**
 * Migration: Add import_batches table and import_batch_id to scorecards
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create import_batches table
    await queryInterface.createTable('import_batches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      batch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'completed_with_errors', 'failed', 'rolled_back'),
        defaultValue: 'pending',
        allowNull: false
      },
      import_type: {
        type: Sequelize.STRING(50),
        defaultValue: 'historical_full'
      },
      total_files: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      processed_files: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      success_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      failed_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_by_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      error_log: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      scorecard_ids: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: []
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add import_batch_id column to scorecards table
    await queryInterface.addColumn('scorecards', 'import_batch_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'import_batches',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove import_batch_id column from scorecards
    await queryInterface.removeColumn('scorecards', 'import_batch_id');

    // Drop import_batches table
    await queryInterface.dropTable('import_batches');

    // Drop the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_import_batches_status";');
  }
};
