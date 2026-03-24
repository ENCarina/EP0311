"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      staffId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'staff', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      consultationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'consultations', key: 'id' }
      },
      slotId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'slots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Confirmed'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    await queryInterface.addIndex('bookings', ['staffId', 'status']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bookings');
  },
};