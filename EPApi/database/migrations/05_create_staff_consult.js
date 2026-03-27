"use strict";

const { DataTypes, literal } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('staff_consult', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'staff', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      consultationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'consultations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: literal('CURRENT_TIMESTAMP') }
    });
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('staff_consult');
  },
};
