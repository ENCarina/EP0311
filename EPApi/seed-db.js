import db from './app/models/modrels.js';
import bcrypt from 'bcryptjs';

function toDateOnly(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function getDaysToEndOfAugust() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfAugust = new Date(today.getFullYear(), 7, 31);
  if (today > endOfAugust) {
    endOfAugust.setFullYear(endOfAugust.getFullYear() + 1);
  }

  const diffMs = endOfAugust.getTime() - today.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

function generateSlots({ staffConsultationMap, daysToGenerate, startHour, endHour, slotMinutes }) {
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + dayOffset);

    // Hétfő-Szombat (vasárnap kimarad)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0) {
      continue;
    }

    const date = toDateOnly(currentDate);

    for (const [staffIdRaw, allowedConsultations] of Object.entries(staffConsultationMap)) {
      const staffId = Number(staffIdRaw);
      let slotIndex = 0;
      for (let minutes = startHour * 60; minutes < endHour * 60; minutes += slotMinutes) {
        const consultationId = allowedConsultations[slotIndex % allowedConsultations.length];
        slots.push({
          staffId,
          consultationId,
          date,
          startTime: toTime(minutes),
          endTime: toTime(minutes + slotMinutes),
          isAvailable: true,
        });
        slotIndex++;
      }
    }
  }

  return slots;
}

async function seedDatabase() {
  try {
    const { sequelize, User, Staff, Consultation, Slot } = db;

    await sequelize.sync({ force: true });
    console.log('✓ Adatbázis szinkronizálva');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await sequelize.query(`DELETE FROM roles`);
    await sequelize.query(`
      INSERT INTO roles (id, name, createdAt, updatedAt)
      VALUES
        (0, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (1, 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (2, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    console.log('✓ Szerepkörök beszúrva');

    await User.bulkCreate([
      { id: 25, name: 'User1', email: 'elitport@freemail.hu', password: bcrypt.hashSync('test987', 10), roleId: 0, verified: true, verificationToken: null },
      { id: 50, name: 'User', email: 'user@ep.com', password: bcrypt.hashSync('test1243', 10), roleId: 0, verified: true, verificationToken: null },
      { id: 101, name: 'Dr. Kovács Antal', email: 'dr.kovacs@ep.com', password: bcrypt.hashSync('doctor123', 10), roleId: 1, verified: true, verificationToken: null },
      { id: 102, name: 'Dr. Tóth Tünde', email: 'dr.toth@ep.com', password: bcrypt.hashSync('doctor123', 10), roleId: 1, verified: true, verificationToken: null },
      { id: 103, name: 'Dr. House Greg', email: 'dr.house@ep.com', password: bcrypt.hashSync('doctor123', 10), roleId: 1, verified: true, verificationToken: null },
      { id: 100, name: 'Admin', email: 'admin@ep.com', password: bcrypt.hashSync('joyEtna', 10), roleId: 2, verified: true, verificationToken: null }
    ]);
    console.log('✓ Felhasználók beszúrva');

    await Staff.bulkCreate([
      { id: 1, userId: 101, specialty: 'Kardiológus', isAvailable: true, isActive: true, bio: '20 éves szakmai tapasztalattal rendelkező szakorvos.', imageUrl: 'https://example.com/images/dr_kovacs.jpg' },
      { id: 2, userId: 102, specialty: 'Fogorvos', isAvailable: true, isActive: true, bio: '15 éves nemzetközi tapasztalattal rendelkező fogorvos.', imageUrl: 'https://example.com/images/dr_toth.jpg' },
      { id: 3, userId: 103, specialty: 'Pszichiáter', isAvailable: true, isActive: true, bio: 'Amerikai főorvos.', imageUrl: 'https://example.com/images/dr_house.jpg' }
    ]);
    console.log('✓ Szakemberek beszúrva');

    await Consultation.bulkCreate([
      { id: 1, name: 'Kardiológiai szakvizsgálat', description: 'Teljes körű szív- és érrendszeri állapotfelmérés.', specialty: 'Kardiológia', duration: 30, price: 25000 },
      { id: 2, name: 'Fogászati kontroll', description: 'Általános állapotfelmérés és tanácsadás.', specialty: 'Fogászat', duration: 30, price: 15000 },
      { id: 3, name: 'Pszichiátriai első konzultáció', description: 'Mélyinterjú és diagnózis felállítás.', specialty: 'Pszichiátria', duration: 30, price: 35000 },
      { id: 4, name: 'Laboreredmény értékelés', description: 'Friss laboreredmények értelmezése és javaslat.', specialty: 'Általános', duration: 30, price: 12000 },
      { id: 5, name: 'Kontroll konzultáció', description: 'Rövid állapotkövetés és terápiás finomhangolás.', specialty: 'Általános', duration: 30, price: 18000 }
    ]);
    console.log('✓ Kezelések beszúrva');

    await sequelize.query(`DELETE FROM staff_consult`);
    await sequelize.query(`
      INSERT INTO staff_consult (staffId, consultationId, createdAt, updatedAt)
      VALUES
        (1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        (1,4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        (1,5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        (2,2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        (2,4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        (2,5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        (3,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        (3,4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        (3,5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `);
    console.log('✓ Staff-kezelés kapcsolatok beszúrva');

    const generatedSlots = generateSlots({
      staffConsultationMap: {
        1: [1, 4, 5],
        2: [2, 4, 5],
        3: [3, 4, 5],
      },
      daysToGenerate: getDaysToEndOfAugust(),
      startHour: 8,
      endHour: 21,
      slotMinutes: 30,
    });

    await Slot.bulkCreate(generatedSlots);
    console.log(`✓ Időpontok beszúrva (${generatedSlots.length} db)`);

    console.log('\n✓✓ Adatbázis sikeresen feltöltve!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Hiba a seedingnél:', error.message);
    process.exit(1);
  }
}

seedDatabase();
