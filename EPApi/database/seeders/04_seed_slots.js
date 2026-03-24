const db = require('../../app/models/modrels.js');
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('slots', null, {});

    const slotsData = [];
    const daysToGenerate = 14; // 2 hét
    const startHour = 8;
    const endHour = 16;

    // staff és consultation id-k lekérdezése
    const [staff] = await queryInterface.sequelize.query('SELECT id FROM staff');
    const [consultations] = await queryInterface.sequelize.query('SELECT id FROM consultations');
    const staffConfigs = staff.map((s, i) => ({ staffId: s.id, consultationId: consultations[i % consultations.length].id }));

    const now = new Date();

    for (let i = 0; i < daysToGenerate; i++) {
      const currentDate = new Date();
      currentDate.setDate(now.getDate() + i);
      // Hétvégéket kihagyva
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      // Óránkénti slotok generálása
      for (let hour = startHour; hour < endHour; hour++) {
        const config = staffConfigs[Math.floor(Math.random() * staffConfigs.length)];
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
        slotsData.push({
          staffId: config.staffId,
          consultationId: config.consultationId,
          date: dateString,
          startTime: startTime,
          endTime: endTime,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    await queryInterface.bulkInsert('slots', slotsData);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('slots', null, {});
  }
};

  // const slotsData = [
  //         { staffId: 1, consultationId: 1, date: '2026-03-19', startTime: '08:00:00', endTime: '09:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
  //         { staffId: 1, consultationId: 1, date: '2026-03-19', startTime: '09:00:00', endTime: '10:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
  //         { staffId: 1, consultationId: 1, date: '2026-03-19', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},      
                
  // ];  


