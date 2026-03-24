

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('slots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      staffId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'staff', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      consultationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'consultations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      startTime: {
        type: Sequelize.STRING,
        allowNull: false
      },
      endTime: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: { type: Sequelize.DATE },
      updatedAt: { type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('slots');
  },
};
