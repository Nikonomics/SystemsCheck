/**
 * Migration: Add onboarding_completed column to users table
 * Tracks whether a user has completed the welcome/onboarding flow
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'onboarding_completed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'onboarding_completed');
  }
};
