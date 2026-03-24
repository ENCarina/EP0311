module.exports = {
  up: async (queryInterface, Sequelize) => {
    const pivotData = [
      { staffId: 1, consultationId: 1, createdAt: new Date(), updatedAt: new Date() },
      { staffId: 1, consultationId: 4, createdAt: new Date(), updatedAt: new Date() },
      { staffId: 1, consultationId: 5, createdAt: new Date(), updatedAt: new Date() },
      { staffId: 2, consultationId: 2, createdAt: new Date(), updatedAt: new Date() },
      { staffId: 2, consultationId: 4, createdAt: new Date(), updatedAt: new Date() },
      { staffId: 2, consultationId: 5, createdAt: new Date(), updatedAt: new Date() },
      { staffId: 3, consultationId: 3, createdAt: new Date(), updatedAt: new Date() },
      { staffId: 3, consultationId: 4, createdAt: new Date(), updatedAt: new Date() },
      { staffId: 3, consultationId: 5, createdAt: new Date(), updatedAt: new Date() },
    ];
    await queryInterface.bulkInsert('staff_consult', pivotData);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('staff_consult', null, {});
  }
};