import bcrypt from 'bcryptjs';
import db from '../../app/models/modrels.js';

async function seedDemoV2() {
  await db.sequelize.sync({ force: true });

  await db.sequelize.query('CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY)');

  await db.User.bulkCreate([
    { id: 25, name: 'User1', email: 'elitport@freemail.hu', password: bcrypt.hashSync('test987', 10), roleId: 0 },
    { id: 50, name: 'User', email: 'user@ep.com', password: bcrypt.hashSync('test1243', 10), roleId: 0 },
    { id: 101, name: 'Dr. Kovács Antal', email: 'dr.kovacs@ep.com', password: bcrypt.hashSync('doctor123', 10), roleId: 1 },
    { id: 102, name: 'Dr. Tóth Tünde', email: 'dr.toth@ep.com', password: bcrypt.hashSync('doctor123', 10), roleId: 1 },
    { id: 103, name: 'Dr. House Greg', email: 'dr.house@ep.com', password: bcrypt.hashSync('doctor123', 10), roleId: 1 },
    { id: 100, name: 'Admin', email: 'admin@ep.com', password: bcrypt.hashSync('joyEtna', 10), roleId: 2 }
  ]);

  await db.sequelize.query('DELETE FROM user');
  await db.sequelize.query('INSERT INTO user(id) SELECT id FROM users');

  await db.Staff.bulkCreate([
    { id: 1, userId: 101, specialty: 'Kardiológus', isAvailable: true, bio: '20 éves szakmai tapasztalattal rendelkező szakorvos.' },
    { id: 2, userId: 102, specialty: 'Fogorvos', isAvailable: true, bio: '15 éves nemzetközi tapasztalattal rendelkező fogorvos.' },
    { id: 3, userId: 103, specialty: 'Pszichiáter', isAvailable: true, bio: 'amerikai főorvos.' },
    { id: 4, userId: 100, specialty: 'Vezető asszisztens', isAvailable: true, bio: 'Laborvizsgálatok és adminisztráció felelőse.' }
  ]);

  await db.Consultation.bulkCreate([
    { id: 1, name: 'Kardiológiai szakvizsgálat', description: 'Teljes körű szív- és érrendszeri állapotfelmérés.', specialty: 'Kardiológia', duration: 30, price: 25000 },
    { id: 2, name: 'Fogászati kontroll', description: 'Általános állapotfelmérés és tanácsadás.', specialty: 'Fogászat', duration: 20, price: 15000 },
    { id: 3, name: 'Pszichiátriai első konzultáció', description: 'Hosszabb mélyinterjú és diagnózis felállítás.', specialty: 'Pszichiátria', duration: 60, price: 35000 }
  ]);

  const s1 = await db.Staff.findByPk(1);
  const s2 = await db.Staff.findByPk(2);
  const s3 = await db.Staff.findByPk(3);
  const c1 = await db.Consultation.findByPk(1);
  const c2 = await db.Consultation.findByPk(2);
  const c3 = await db.Consultation.findByPk(3);

  await s1.addService(c1);
  await s2.addService(c2);
  await s3.addService(c3);
  await s3.addService(c1);

  await db.Slot.bulkCreate([
    { staffId: 1, consultationId: 1, date: '2026-03-14', startTime: '08:00:00', endTime: '09:00:00', isAvailable: true },
    { staffId: 1, consultationId: 1, date: '2026-03-14', startTime: '09:00:00', endTime: '10:00:00', isAvailable: true },
    { staffId: 1, consultationId: 1, date: '2026-03-13', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true },
    { staffId: 2, consultationId: 2, date: '2026-03-13', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true },
    { staffId: 2, consultationId: 3, date: '2026-03-13', startTime: '13:00:00', endTime: '14:00:00', isAvailable: true },
    { staffId: 3, consultationId: 3, date: '2026-03-12', startTime: '14:00:00', endTime: '15:00:00', isAvailable: true },
    { staffId: 2, consultationId: 2, date: '2026-03-12', startTime: '15:00:00', endTime: '16:00:00', isAvailable: true },
    { staffId: 2, consultationId: 2, date: '2026-03-12', startTime: '09:00:00', endTime: '10:00:00', isAvailable: true },
    { staffId: 3, consultationId: 3, date: '2026-03-14', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true },
    { staffId: 3, consultationId: 2, date: '2026-03-14', startTime: '13:00:00', endTime: '14:00:00', isAvailable: true },
    { staffId: 1, consultationId: 1, date: '2026-03-14', startTime: '15:00:00', endTime: '16:00:00', isAvailable: true },
    { staffId: 1, consultationId: 1, date: '2026-03-15', startTime: '09:00:00', endTime: '10:00:00', isAvailable: true },
    { staffId: 2, consultationId: 2, date: '2026-03-15', startTime: '10:00:00', endTime: '11:00:00', isAvailable: true }
  ]);

  const [u] = await db.sequelize.query('SELECT COUNT(*) as c FROM users');
  const [st] = await db.sequelize.query('SELECT COUNT(*) as c FROM staff');
  const [co] = await db.sequelize.query('SELECT COUNT(*) as c FROM consultations');
  const [sl] = await db.sequelize.query('SELECT COUNT(*) as c FROM slots');

  console.log('Demo adatok feltöltve (v2)', {
    users: u[0].c,
    staff: st[0].c,
    consultations: co[0].c,
    slots: sl[0].c
  });
}

seedDemoV2()
  .catch((error) => {
    console.error('Seed v2 hiba:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.sequelize.close();
  });
