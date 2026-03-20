import db from '../../app/models/modrels.js';
async function up({context: QueryInterface}) {

  await QueryInterface.bulkDelete('slots', null, {});

  const slotsData = [];
  const daysToGenerate = 14; // 2 hét
  const startHour = 8;
  const endHour = 16;

  
  const staffConfigs = [
    { staffId: 1, consultationId: 1 },
    { staffId: 2, consultationId: 2 },
    { staffId: 3, consultationId: 3 }
  ];

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

  if (db && db.Slot) {
    await db.Slot.bulkCreate(slotsData);
  } else {
    await QueryInterface.bulkInsert('slots', slotsData);
  }
}

  // const slotsData = [
  //         { staffId: 1, consultationId: 1, date: '2026-03-19', startTime: '08:00:00', endTime: '09:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
  //         { staffId: 1, consultationId: 1, date: '2026-03-19', startTime: '09:00:00', endTime: '10:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
  //         { staffId: 1, consultationId: 1, date: '2026-03-19', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},      
                
  // ];  


async function down({context: QueryInterface}) {
  await QueryInterface.bulkDelete('slots', null, {});
  }

export { up, down };