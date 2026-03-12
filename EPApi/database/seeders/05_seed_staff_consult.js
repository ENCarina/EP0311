import db from '../../app/models/modrels.js';

async function up({context: QueryInterface}) {
  const pivotData = [
    { staffId: 1, consultationId: 1, createdAt: new Date(), updatedAt: new Date() }, // Dr. Kovács - Kardiológia
    { staffId: 2, consultationId: 2, createdAt: new Date(), updatedAt: new Date() }, // Dr. Tóth - Fogászat
    { staffId: 3, consultationId: 3, createdAt: new Date(), updatedAt: new Date() }, // Dr. House - Pszichiátria
    { staffId: 3, consultationId: 1, createdAt: new Date(), updatedAt: new Date() }, // Dr. House - Kardiológia szaktanácsadás (több szakterület)
  ];

  if(db && db.staff_consult) {
    await db.staff_consult.bulkCreate(pivotData);
  } else {
    await QueryInterface.bulkInsert('staff_consult', pivotData);
  }
}

async function down({context: QueryInterface}) {
  await QueryInterface.bulkDelete('staff_consult', null, {});
}

export { up, down }
