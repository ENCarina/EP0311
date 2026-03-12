import db from '../../app/models/modrels.js';

async function up({context: QueryInterface}) {
  const consultationData = [
      {
      id: 1,
      name: 'Kardiológiai szakvizsgálat',
      description: 'Teljes körű szív- és érrendszeri állapotfelmérés.',
      specialty: 'Kardiológia',
      duration: 30,
      price: 25000.00,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,  
      name: 'Fogászati kontroll',
      description: 'Általános állapotfelmérés és tanácsadás.',
      specialty: 'Fogászat',
      duration: 20,
      price: 15000.00,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: 'Pszichiátriai első konzultáció',
      description: 'Hosszabb mélyinterjú és diagnózis felállítás.',
      specialty: 'Pszichiátria',
      duration: 60,
      price: 35000.00,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  if (db && db.Consultation) {
    await db.Consultation.bulkCreate(consultationData);
  } else {
    await QueryInterface.bulkInsert('consultations', consultationData);
  }
}

async function down({context: QueryInterface}) {
  await QueryInterface.bulkDelete('consultations', null, {});
}

export { up, down }
