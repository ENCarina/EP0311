module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Lekérdezzük a staff és consultation id-kat
    const [staff] = await queryInterface.sequelize.query('SELECT id FROM staff ORDER BY id ASC');
    const [consultations] = await queryInterface.sequelize.query('SELECT id FROM consultations ORDER BY id ASC');
    // Feltételezzük, hogy 1:1 hozzárendelés (mint az eredeti seedben)
    const minLen = Math.min(staff.length, consultations.length);
    const pivotData = [];
    for (let i = 0; i < minLen; i++) {
      pivotData.push({
        staffId: staff[i].id,
        consultationId: consultations[i].id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await queryInterface.bulkInsert('staff_consult', pivotData);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('staff_consult', null, {});
  }
};
