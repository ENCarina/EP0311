import db from '../../app/models/modrels.js';
async function up({context: QueryInterface}) {

  await QueryInterface.bulkDelete('slots', null, {});
  
  // const today = new Date();
  // const nextMonday = new Date();
  // nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
  // for (let i = 0; i < 5; i++) {
  //   const currentdate = new Date(nextMonday);
  //   currentdate. setDate(nextMonday.getDate() + i);
  //   const dateStr = currentdate.toISOString().split('T')[0];
  // }

  const slotsData = [
          { staffId: 1, consultationId: 1, date: '2026-03-14', startTime: '08:00:00', endTime: '09:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 1, consultationId: 1, date: '2026-03-14', startTime: '09:00:00', endTime: '10:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 1, consultationId: 1, date: '2026-03-13', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 2, consultationId: 2, date: '2026-03-13', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 2, consultationId: 3, date: '2026-03-13', startTime: '13:00:00', endTime: '14:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 3, consultationId: 3, date: '2026-03-12', startTime: '14:00:00', endTime: '15:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 2, consultationId: 2, date: '2026-03-12', startTime: '15:00:00', endTime: '16:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 2, consultationId: 2, date: '2026-03-12', startTime: '09:00:00', endTime: '10:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 3, consultationId: 3, date: '2026-03-14', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 3, consultationId: 2, date: '2026-03-14', startTime: '13:00:00', endTime: '14:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 1, consultationId: 1, date: '2026-03-14', startTime: '15:00:00', endTime: '16:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 1, consultationId: 1, date: '2026-03-15', startTime: '09:00:00', endTime: '10:00:00', isAvailable : true, createdAt: new Date(), updatedAt: new Date()},
          { staffId: 2, consultationId: 2, date: '2026-03-15', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true, createdAt: new Date(), updatedAt: new Date()},
          
                
  ];  
    if (db && db.Slot) {
        await db.Slot.bulkCreate(slotsData);
      }else {
        await QueryInterface.bulkInsert('slots', slotsData);
  }
}

async function down({context: QueryInterface}) {
  await QueryInterface.bulkDelete('slots', null, {});
  }

export { up, down };