module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('slots', null, {});

    const staffConsultationMap = {
      1: [1, 4, 5],
      2: [2, 4, 5],
      3: [3, 4, 5]
    };
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('slots', null, {});
  }
};