"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('staff_consult', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      staffId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'staff', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      consultationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'consultations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('staff_consult');
  },
};
