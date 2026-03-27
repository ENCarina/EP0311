module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('slots', null, {});

    const [staffRows] = await queryInterface.sequelize.query(`
      SELECT staff.id, staff.specialty
      FROM staff
      INNER JOIN users ON users.id = staff.userId
      WHERE users.roleId = 1
      ORDER BY staff.id ASC
    `);

    const [consultationRows] = await queryInterface.sequelize.query(
      'SELECT id, specialty FROM consultations ORDER BY id ASC'
    );

    const specialtyMap = {
      'Kardiológus': 'Kardiológia',
      'Fogorvos': 'Fogászat',
      'Pszichiáter': 'Pszichiátria',
      'Szemész': 'Szemészet',
      'Nőgyógyász': 'Nőgyógyászat',
      'Bőrgyógyász': 'Bőrgyógyászat',
      'Neurológus': 'Neurológia',
      'Ortopéd': 'Ortopédia',
      'Urológus': 'Urológia',
      'Endokrinológus': 'Endokrinológia',
      'Pulmonológus': 'Pulmonológia',
      'Fül-orr-gégész': 'Fül-orr-gégészet',
      'Gasztroenterológus': 'Gasztroenterológia',
      'Reumatológus': 'Reumatológia',
      'Diabetológus': 'Diabetológia'
    };

    const generalConsultationIds = consultationRows
      .filter((consultation) => consultation.specialty === 'Általános')
      .map((consultation) => consultation.id);

    const staffConsultationMap = staffRows.reduce((accumulator, staff) => {
      const specialtyName = specialtyMap[staff.specialty] || staff.specialty;
      const specialtyConsultationIds = consultationRows
        .filter((consultation) => consultation.specialty === specialtyName)
        .map((consultation) => consultation.id);

      accumulator[staff.id] = [...specialtyConsultationIds, ...generalConsultationIds];
      return accumulator;
    }, {});

    const startHour = 8;
    const endHour = 21;
    const slotDurationMinutes = 30;

    const getDaysToEndOfAugust = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endOfAugust = new Date(today.getFullYear(), 7, 31);
      if (today > endOfAugust) {
        endOfAugust.setFullYear(endOfAugust.getFullYear() + 1);
      }

      const diffMs = endOfAugust.getTime() - today.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    };

    const toDateOnly = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const toTime = (hours, minutes) => `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

    const slotsData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysToGenerate = getDaysToEndOfAugust();

    for (let offset = 0; offset < daysToGenerate; offset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + offset);
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek === 0) {
        continue;
      }

      const dateValue = toDateOnly(currentDate);

      for (const [staffIdRaw, allowedConsultations] of Object.entries(staffConsultationMap)) {
        const staffId = Number(staffIdRaw);
        if (!allowedConsultations.length) {
          continue;
        }

        let slotIndex = 0;

        for (let minutes = startHour * 60; minutes < endHour * 60; minutes += slotDurationMinutes) {
          const startHours = Math.floor(minutes / 60);
          const startMinutes = minutes % 60;
          const endTotalMinutes = minutes + slotDurationMinutes;
          const endHours = Math.floor(endTotalMinutes / 60);
          const endMinutes = endTotalMinutes % 60;
          const consultationId = allowedConsultations[slotIndex % allowedConsultations.length];

          slotsData.push({
            staffId,
            consultationId,
            date: dateValue,
            startTime: toTime(startHours, startMinutes),
            endTime: toTime(endHours, endMinutes),
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          slotIndex++;
        }
      }
    }

    await queryInterface.bulkInsert('slots', slotsData);
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('slots', null, {});
  }
};