module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Lekérdezzük a szükséges id-kat
    const [users] = await queryInterface.sequelize.query("SELECT id, name FROM users");
    const [staff] = await queryInterface.sequelize.query("SELECT id FROM staff ORDER BY id ASC");
    const [consultations] = await queryInterface.sequelize.query("SELECT id FROM consultations ORDER BY id ASC");
    const [slots] = await queryInterface.sequelize.query("SELECT id FROM slots ORDER BY id ASC");

    // Keresünk egy patientId-t (pl. User1)
    const patient = users.find(u => u.name === 'User1' || u.name === 'User');
    const patientId = patient ? patient.id : users[0].id;

    const bookingData = [
      {
        name: 'Kardiológiai vizsgálat',
        patientId: patientId,
        staffId: staff[0]?.id,
        consultationId: consultations[0]?.id,
        slotId: slots[0]?.id,
        status: 'Confirmed',
        duration: 30,
        startTime: '2026-03-10T08:00:00.000Z',
        endTime: '2026-03-10T08:30:00.000Z',
        price: 25000,
        isPublic: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Parandontológiai kiműtét',
        patientId: patientId,
        staffId: staff[1]?.id,
        consultationId: consultations[1]?.id,
        slotId: slots[1]?.id,
        status: 'Confirmed',
        duration: 60,
        startTime: '2026-03-11T09:00:00.000Z',
        endTime: '2026-03-11T10:00:00.000Z',
        price: 15000,
        isPublic: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pszichiátriai első konzultáció',
        patientId: patientId,
        staffId: staff[2]?.id,
        consultationId: consultations[2]?.id,
        slotId: slots[2]?.id,
        status: 'Confirmed',
        duration: 60,
        startTime: '2026-03-10T10:00:00.000Z',
        endTime: '2026-03-10T11:00:00.000Z',
        price: 35000,
        isPublic: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
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