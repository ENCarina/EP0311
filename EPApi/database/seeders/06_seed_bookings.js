module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('bookings', null, {});

    const [users] = await queryInterface.sequelize.query("SELECT id, name FROM users WHERE roleId = (SELECT id FROM roles WHERE name = 'user') ORDER BY id ASC");
    const [consultations] = await queryInterface.sequelize.query('SELECT id, name, duration, price FROM consultations ORDER BY id ASC');
    const [slots] = await queryInterface.sequelize.query('SELECT id, staffId, consultationId, date, startTime, endTime FROM slots ORDER BY date ASC, startTime ASC, staffId ASC');

    const patients = users.slice(0, 4);
    const bookedStaff = new Set();
    const bookingData = [];

    for (const slot of slots) {
      if (bookedStaff.has(slot.staffId)) {
        continue;
      }

      const consultation = consultations.find((item) => Number(item.id) === Number(slot.consultationId));
      const patient = patients[bookingData.length % patients.length];

      if (!consultation || !patient) {
        continue;
      }

      bookingData.push({
        name: consultation.name,
        patientId: patient.id,
        staffId: slot.staffId,
        consultationId: slot.consultationId,
        slotId: slot.id,
        status: 'Confirmed',
        duration: consultation.duration,
        startTime: `${slot.date}T${slot.startTime}`,
        endTime: `${slot.date}T${slot.endTime}`,
        price: consultation.price,
        isPublic: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      bookedStaff.add(slot.staffId);

      if (bookingData.length >= 8) {
        break;
      }
    }

    await queryInterface.bulkInsert('bookings', bookingData);
    // Frissítjük a slotokat
    const slotIds = bookingData.map(b => b.slotId).filter(Boolean);
    if (slotIds.length > 0) {
      await queryInterface.sequelize.query(`UPDATE slots SET isAvailable = 0 WHERE id IN (${slotIds.join(',')})`);
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('bookings', null, {});
  }
};