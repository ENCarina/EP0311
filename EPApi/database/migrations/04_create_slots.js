

const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('slots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'staff', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      consultationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'consultations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      startTime: {
        type: DataTypes.STRING,
        allowNull: false
      },
      endTime: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE }
    });
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('slots');
  },
};
