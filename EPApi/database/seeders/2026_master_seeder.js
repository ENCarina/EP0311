import db from '../../app/models/modrels.js';
import bcrypt from 'bcryptjs';

const specialtyAliasMap = {
  'Kardiológus': 'Kardiológia',
  'Fogorvos': 'Fogászat',
  'Pszichiáter': 'Pszichiátria',
  'Bőrgyógyász': 'Bőrgyógyászat',
  'Ortopéd szakorvos': 'Ortopédia',
  'Szemész': 'Szemészet',
  'Urológus': 'Urológia',
  'Nőgyógyász': 'Nőgyógyászat',
  'Neurológus': 'Neurológia',
  'Endokrinológus': 'Endokrinológia',
  'Pulmonológus': 'Pulmonológia',
  'Fül-orr-gégész': 'Fül-orr-gégészet',
  'Gasztroenterológus': 'Gasztroenterológia',
  'Reumatológus': 'Reumatológia',
  'Diabetológus': 'Diabetológia'
};

const patientUsers = [
  { id: 25, name: 'User1', email: 'elitport@freemail.hu' },
  { id: 50, name: 'User', email: 'user@ep.com' },
  { id: 51, name: 'Kiss Anna', email: 'kiss.anna@ep.com' },
  { id: 52, name: 'Nagy Péter', email: 'nagy.peter@ep.com' },
  { id: 53, name: 'Tóth Emese', email: 'toth.emese@ep.com' }
];

const doctorUsers = [
  { id: 101, name: 'Dr. Kovács Antal', email: 'dr.kovacs@ep.com', specialty: 'Kardiológus', bio: '20 év tapasztalattal rendelkező kardiológus szakorvos.' },
  { id: 102, name: 'Dr. Tóth Tünde', email: 'dr.toth@ep.com', specialty: 'Fogorvos', bio: '15 éves nemzetközi tapasztalattal rendelkező fogorvos.' },
  { id: 103, name: 'Dr. House Greg', email: 'dr.house@ep.com', specialty: 'Pszichiáter', bio: 'Komplex esetekre specializálódott pszichiáter.' },
  { id: 104, name: 'Dr. Szabó Beatrix', email: 'dr.szabo@ep.com', specialty: 'Bőrgyógyász', bio: 'Anyajegyvizsgálatra és bőrpanaszok kezelésére specializálódott szakorvos.' },
  { id: 105, name: 'Dr. Kiss Zoltán', email: 'dr.kiss@ep.com', specialty: 'Ortopéd szakorvos', bio: 'Ízületi és gerinceredetű panaszok kezelésére specializálódott ortopéd szakorvos.' },
  { id: 106, name: 'Dr. Molnár Julianna', email: 'dr.molnar@ep.com', specialty: 'Szemész', bio: 'Látásvizsgálatra és szemfenéki szűrésre specializálódott szemész szakorvos.' },
  { id: 107, name: 'Dr. Barna Barnabás', email: 'dr.barna@ep.com', specialty: 'Urológus', bio: 'Megelőző urológiai szűrések és kontrollok szakértője.' },
  { id: 108, name: 'Dr. Varga Eszter', email: 'dr.varga@ep.com', specialty: 'Nőgyógyász', bio: 'Megelőző szűrésekben és nőgyógyászati gondozásban jártas szakorvos.' },
  { id: 109, name: 'Dr. Németh Ádám', email: 'dr.nemeth@ep.com', specialty: 'Neurológus', bio: 'Fejfájás és idegrendszeri panaszok kivizsgálásában tapasztalt neurológus.' },
  { id: 110, name: 'Dr. Farkas Bence', email: 'dr.farkas@ep.com', specialty: 'Endokrinológus', bio: 'Pajzsmirigy- és hormonális panaszok kivizsgálásával foglalkozik.' },
  { id: 111, name: 'Dr. Horváth Levente', email: 'dr.horvath@ep.com', specialty: 'Pulmonológus', bio: 'Légzőszervi panaszok és asztmás betegek gondozásában tapasztalt szakorvos.' },
  { id: 112, name: 'Dr. Papp Dóra', email: 'dr.papp@ep.com', specialty: 'Fül-orr-gégész', bio: 'Fül-orr-gégészeti kontrollokra és hallásvizsgálatokra specializálódott.' },
  { id: 113, name: 'Dr. Lakatos Réka', email: 'dr.lakatos@ep.com', specialty: 'Gasztroenterológus', bio: 'Emésztőrendszeri panaszok kivizsgálásával és kontrolljával foglalkozik.' },
  { id: 114, name: 'Dr. Simon Márton', email: 'dr.simon@ep.com', specialty: 'Reumatológus', bio: 'Mozgásszervi és gyulladásos panaszok kezelésében jártas reumatológus.' },
  { id: 115, name: 'Dr. Gál Noémi', email: 'dr.gal@ep.com', specialty: 'Diabetológus', bio: 'Cukorbeteg gondozásra és életmódterápiára specializálódott szakorvos.' }
];

const consultationCatalog = [
  { id: 1, name: 'Kardiológiai szakvizsgálat', specialty: 'Kardiológia', duration: 30, price: 25000 },
  { id: 2, name: 'EKG és szívultrahang konzultáció', specialty: 'Kardiológia', duration: 45, price: 32000 },
  { id: 3, name: 'Fogászati kontroll', specialty: 'Fogászat', duration: 20, price: 15000 },
  { id: 4, name: 'Fogkő-eltávolítás', specialty: 'Fogászat', duration: 45, price: 22000 },
  { id: 5, name: 'Fogtömés', specialty: 'Fogászat', duration: 60, price: 35000 },
  { id: 6, name: 'Pszichiátriai első konzultáció', specialty: 'Pszichiátria', duration: 60, price: 35000 },
  { id: 7, name: 'Pszichiátriai kontroll', specialty: 'Pszichiátria', duration: 30, price: 22000 },
  { id: 8, name: 'Anyajegyszűrés', specialty: 'Bőrgyógyászat', duration: 20, price: 18000 },
  { id: 9, name: 'Allergiás bőrtünet kontroll', specialty: 'Bőrgyógyászat', duration: 30, price: 19000 },
  { id: 10, name: 'Ortopédiai szakvizsgálat', specialty: 'Ortopédia', duration: 30, price: 22000 },
  { id: 11, name: 'Ízületi injekció', specialty: 'Ortopédia', duration: 15, price: 12000 },
  { id: 12, name: 'Posztoperatív kontroll', specialty: 'Ortopédia', duration: 20, price: 15000 },
  { id: 13, name: 'Szemészeti alapvizsgálat', specialty: 'Szemészet', duration: 25, price: 16000 },
  { id: 14, name: 'Látásvizsgálat', specialty: 'Szemészet', duration: 40, price: 12000 },
  { id: 15, name: 'Urológiai kismedencei szűrés', specialty: 'Urológia', duration: 30, price: 20000 },
  { id: 16, name: 'Prosztata szűrő konzultáció', specialty: 'Urológia', duration: 45, price: 30000 },
  { id: 17, name: 'Nőgyógyászati rákszűrés', specialty: 'Nőgyógyászat', duration: 40, price: 28000 },
  { id: 18, name: 'Nőgyógyászati szakvizsgálat', specialty: 'Nőgyógyászat', duration: 30, price: 26000 },
  { id: 19, name: 'Neurológiai szakvizsgálat', specialty: 'Neurológia', duration: 45, price: 29000 },
  { id: 20, name: 'Fejfájás kivizsgálási konzultáció', specialty: 'Neurológia', duration: 30, price: 24000 },
  { id: 21, name: 'Endokrinológiai szakvizsgálat', specialty: 'Endokrinológia', duration: 45, price: 28000 },
  { id: 22, name: 'Pajzsmirigy kontroll', specialty: 'Endokrinológia', duration: 30, price: 22000 },
  { id: 23, name: 'Pulmonológiai szakvizsgálat', specialty: 'Pulmonológia', duration: 30, price: 27000 },
  { id: 24, name: 'Légzésfunkciós vizsgálat', specialty: 'Pulmonológia', duration: 30, price: 23000 },
  { id: 25, name: 'Fül-orr-gégészeti szakvizsgálat', specialty: 'Fül-orr-gégészet', duration: 30, price: 22000 },
  { id: 26, name: 'Hallás- és arcüreg kontroll', specialty: 'Fül-orr-gégészet', duration: 30, price: 18000 },
  { id: 27, name: 'Gasztroenterológiai szakvizsgálat', specialty: 'Gasztroenterológia', duration: 45, price: 31000 },
  { id: 28, name: 'Hasi panasz kivizsgálási konzultáció', specialty: 'Gasztroenterológia', duration: 30, price: 26000 },
  { id: 29, name: 'Reumatológiai szakvizsgálat', specialty: 'Reumatológia', duration: 45, price: 28000 },
  { id: 30, name: 'Mozgásszervi kontroll', specialty: 'Reumatológia', duration: 30, price: 21000 },
  { id: 31, name: 'Diabetológiai szakvizsgálat', specialty: 'Diabetológia', duration: 30, price: 26000 },
  { id: 32, name: 'Cukorbeteg gondozási kontroll', specialty: 'Diabetológia', duration: 30, price: 20000 }
];

function toDateOnly(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextWeekDay(daysFromMonday, hour = 8, minute = 0) {
  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((7 - today.getDay() + 1) % 7 || 7));
  const targetDay = new Date(nextMonday);
  targetDay.setDate(nextMonday.getDate() + daysFromMonday);
  targetDay.setHours(hour, minute, 0, 0);
  return targetDay;
}

export const up = async ({ context: queryInterface }) => {
  const { sequelize, User, Staff, Consultation, Slot, Booking } = db;
  const now = new Date();
  const drPass = bcrypt.hashSync('doctor123', 10);
  const userPass = bcrypt.hashSync('test987', 10);
  const adminPass = bcrypt.hashSync('joyEtna', 10);

  // Kényszerített szinkronizáció
  await sequelize.query('PRAGMA foreign_keys = OFF;');
  await sequelize.sync({ force: true });
  await sequelize.query('PRAGMA foreign_keys = ON;');

  // 1. ROLES
  await sequelize.query(`
    INSERT INTO roles (id, name, createdAt, updatedAt)
    VALUES (0, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
           (1, 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
           (2, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  // 2. USERS  
  await queryInterface.bulkInsert('users', [
    ...patientUsers.map((patient) => ({
      ...patient,
      password: userPass,
      roleId: 0,
      verified: 1,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      createdAt: now,
      updatedAt: now
    })),
    ...doctorUsers.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      password: drPass,
      roleId: 1,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      verified: 1,
      createdAt: now,
      updatedAt: now
    })),
    { id: 100, name: 'Admin', email: 'admin@ep.com', password: adminPass, roleId: 2, verified: 1, resetPasswordToken: null, resetPasswordExpires: null, createdAt: now, updatedAt: now }
  ]);

  // 3. STAFF
  await queryInterface.bulkInsert('staff', doctorUsers.map((doctor, index) => ({
    id: index + 1,
    userId: doctor.id,
    specialty: doctor.specialty,
    isAvailable: true,
    isActive: true,
    bio: doctor.bio,
    createdAt: now,
    updatedAt: now
  })));

  // 4. CONSULTATIONS
  await queryInterface.bulkInsert('consultations', consultationCatalog.map((consultation) => ({
    ...consultation,
    createdAt: now,
    updatedAt: now
  })));

  // 5. SLOTS
  const slotsData = [];
  const generalConsultationIds = [];
  const staffMap = doctorUsers.reduce((map, doctor, index) => {
    const specialtyName = specialtyAliasMap[doctor.specialty] || doctor.specialty;
    const consultationIds = consultationCatalog
      .filter((consultation) => consultation.specialty === specialtyName)
      .map((consultation) => consultation.id);
    map[index + 1] = [...consultationIds, ...generalConsultationIds];
    return map;
  }, {});
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let d = 0; d < 30; d++) {
    const cur = new Date(today);
    cur.setDate(today.getDate() + d);
    if (cur.getDay() === 0 || cur.getDay() === 6) continue;
    const dateStr = toDateOnly(cur);
    for (const [sId, cIds] of Object.entries(staffMap)) {
      let cIdx = 0;
      for (let h = 8; h < 19; h++) {
        slotsData.push({
          staffId: Number(sId),
          consultationId: cIds[cIdx % cIds.length],
          date: dateStr,
          startTime: `${h.toString().padStart(2, '0')}:00:00`,
          endTime: `${(h + 1).toString().padStart(2, '0')}:00:00`,
          isAvailable: true,
          createdAt: now, updatedAt: now
        });
        cIdx++;
      }
    }
  }
  const createdSlots = await Slot.bulkCreate(slotsData, { returning: true });

  // 6. STAFF_CONSULT
  const staffConsultPairs = [];
  for (const [sId, cIds] of Object.entries(staffMap)) {
    cIds.forEach(cId => {
      staffConsultPairs.push({ staffId: Number(sId), consultationId: cId, createdAt: now, updatedAt: now });
    });
  }
  await queryInterface.bulkInsert('staff_consult', staffConsultPairs);

  // 7. BOOKINGS
  const bookingSeeds = [
    { staffId: 1, consultationId: 1, patientId: 50, dayOffset: 0 },
    { staffId: 2, consultationId: 3, patientId: 51, dayOffset: 1 },
    { staffId: 3, consultationId: 6, patientId: 52, dayOffset: 0 },
    { staffId: 4, consultationId: 8, patientId: 53, dayOffset: 2 },
    { staffId: 6, consultationId: 13, patientId: 50, dayOffset: 3 },
    { staffId: 8, consultationId: 17, patientId: 51, dayOffset: 4 },
    { staffId: 10, consultationId: 21, patientId: 52, dayOffset: 1 },
    { staffId: 15, consultationId: 31, patientId: 53, dayOffset: 2 }
  ];

  const testBookings = bookingSeeds
    .map((seed) => {
      const consultation = consultationCatalog.find((item) => item.id === seed.consultationId);
      const targetDate = toDateOnly(getNextWeekDay(seed.dayOffset, 8, 0));
      const slot = createdSlots.find((item) => (
        Number(item.staffId) === Number(seed.staffId)
        && Number(item.consultationId) === Number(seed.consultationId)
        && item.date === targetDate
      ));

      if (!consultation || !slot) {
        return null;
      }

      const bookingStart = new Date(`${slot.date}T${slot.startTime}`);

      const bookingEnd = new Date(bookingStart.getTime() + consultation.duration * 60 * 1000);

      return {
        name: consultation.name,
        patientId: seed.patientId,
        staffId: seed.staffId,
        consultationId: seed.consultationId,
        slotId: slot.id,
        status: 'Confirmed',
        duration: consultation.duration,
        price: consultation.price,
        isPublic: 1,
        startTime: bookingStart,
        endTime: bookingEnd,
        createdAt: now,
        updatedAt: now
      };
    })
    .filter(Boolean);

  await Booking.bulkCreate(testBookings);
  await Slot.update({ isAvailable: false }, { where: { id: testBookings.map((booking) => booking.slotId) } });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');
  await queryInterface.bulkDelete('Bookings', null, {});
  await queryInterface.bulkDelete('staff_consult', null, {});
  await queryInterface.bulkDelete('Slots', null, {});
  await queryInterface.bulkDelete('Consultations', null, {});
  await queryInterface.bulkDelete('Staff', null, {});
  await queryInterface.bulkDelete('users', null, {});
  await queryInterface.bulkDelete('roles', null, {});
  await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');
};