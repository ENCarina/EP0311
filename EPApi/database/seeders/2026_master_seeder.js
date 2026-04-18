import db from '../../app/models/modrels.js';
import bcrypt from 'bcryptjs';

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
  const { sequelize, Slot, Booking } = db;
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
    { id: 25, name: 'User1', email: 'elitport@freemail.hu', password: userPass, roleId: 0, verified: 1, resetPasswordToken: null, resetPasswordExpires: null, createdAt: now, updatedAt: now },
    { id: 50, name: 'User', email: 'user@ep.com', password: userPass, roleId: 0, verified: 1, resetPasswordToken: null, resetPasswordExpires: null, createdAt: now, updatedAt: now },
    { id: 101, name: 'Dr. Kovács Antal', email: 'dr.kovacs@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
    { id: 102, name: 'Dr. Tóth Tünde', email: 'dr.toth@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
    { id: 103, name: 'Dr. House Greg', email: 'dr.house@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
    { id: 104, name: 'Dr. Szabó Beatrix', email: 'dr.szabo@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
    { id: 105, name: 'Dr. Kiss Zoltán', email: 'dr.kiss@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
    { id: 106, name: 'Dr. Molnár Julianna', email: 'dr.molnar@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
    { id: 107, name: 'Dr. Barna Barnabás', email: 'dr.barna@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
    { id: 108, name: 'Dr. Varga Eszter', email: 'dr.varga@ep.com', password: drPass, roleId: 1, resetPasswordToken: null,  resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
    { id: 100, name: 'Admin', email: 'admin@ep.com', password: adminPass, roleId: 2, verified: 1,resetPasswordToken: null, resetPasswordExpires: null, createdAt: now, updatedAt: now }
  ]);

  // 3. STAFF -  JSON kulcsok
  await queryInterface.bulkInsert('staff',[
    { id: 1, userId: 101, specialty: 'CARDIOLOGY', isAvailable: true, isActive: true, bio: 'STAFF.BIOS.DR_KOVACS', createdAt: now, updatedAt: now },
    { id: 2, userId: 102, specialty: 'DENTISTRY', isAvailable: true, isActive: true, bio: 'STAFF.BIOS.DR_TOTH', createdAt: now, updatedAt: now },
    { id: 3, userId: 103, specialty: 'PSYCHIATRY', isAvailable: true, isActive: true, bio: 'STAFF.BIOS.DR_HOUSE', createdAt: now, updatedAt: now },
    { id: 4, userId: 104, specialty: 'DERMATOLOGY', isAvailable: true, isActive: true, bio: 'STAFF.BIOS.DR_SZABO', createdAt: now, updatedAt: now },
    { id: 5, userId: 105, specialty: 'ORTHOPEDICS', isAvailable: true, isActive: true, bio: 'STAFF.BIOS.DR_KISS', createdAt: now, updatedAt: now },
    { id: 6, userId: 106, specialty: 'OPHTHALMOLOGY', isAvailable: true, isActive: true, bio: 'STAFF.BIOS.DR_MOLNAR', createdAt: now, updatedAt: now },
    { id: 7, userId: 107, specialty: 'UROLOGY', isAvailable: true, isActive: true, bio: 'STAFF.BIOS.DR_BARNA', createdAt: now, updatedAt: now },
    { id: 8, userId: 108, specialty: 'GYNECOLOGY', isAvailable: true, isActive: true, bio: 'STAFF.BIOS.DR_VARGA', createdAt: now, updatedAt: now }
  ]);

  // 4. CONSULTATIONS 
  await queryInterface.bulkInsert('consultations',[
    { id: 1, name: 'CARDIOLOGY_EXAM', specialty: 'CARDIOLOGY', duration: 30, price: 25000, createdAt: now, updatedAt: now },
    { id: 2, name: 'DENTAL_CHECKUP', specialty: 'DENTISTRY', duration: 20, price: 15000, createdAt: now, updatedAt: now },
    { id: 3, name: 'PSYCHIATRY_CONSULT', specialty: 'PSYCHIATRY', duration: 60, price: 35000, createdAt: now, updatedAt: now },
    { id: 4, name: 'DERMATOLOGY_SCREENING', specialty: 'DERMATOLOGY', duration: 20, price: 18000, createdAt: now, updatedAt: now },
    { id: 5, name: 'ORTHOPEDICS_EXAM', specialty: 'ORTHOPEDICS', duration: 30, price: 22000, createdAt: now, updatedAt: now },
    { id: 6, name: 'OPHTHALMOLOGY_EXAM', specialty: 'OPHTHALMOLOGY', duration: 25, price: 16000, createdAt: now, updatedAt: now },
    { id: 7, name: 'UROLOGY_SCREENING', specialty: 'UROLOGY', duration: 30, price: 20000, createdAt: now, updatedAt: now },
    { id: 8, name: 'GYNECOLOGY_SCREENING', specialty: 'GYNECOLOGY', duration: 40, price: 28000, createdAt: now, updatedAt: now },
    { id: 9, name: 'DENTAL_SCALING', specialty: 'DENTISTRY', duration: 45, price: 22000, createdAt: now, updatedAt: now },
    { id: 10, name: 'DENTAL_FILLING', specialty: 'DENTISTRY', duration: 60, price: 35000, createdAt: now, updatedAt: now },
    { id: 11, name: 'VISION_TEST', specialty: 'OPHTHALMOLOGY', duration: 40, price: 12000, createdAt: now, updatedAt: now },
    { id: 12, name: 'JOINT_INJECTION', specialty: 'ORTHOPEDICS', duration: 15, price: 12000, createdAt: now, updatedAt: now },
    { id: 13, name: 'POSTOP_CONTROL', specialty: 'ORTHOPEDICS', duration: 20, price: 15000, createdAt: now, updatedAt: now }
  ]);

  // 5. SLOTS
  const slotsData = [];
  const staffMap = { 1: [1], 2: [2, 9, 10], 3: [3], 4: [4], 5: [5, 12, 13], 6: [6, 11], 7: [7], 8: [8] };
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
  await Slot.bulkCreate(slotsData);

  // 6. STAFF_CONSULT
  const staffConsultPairs = [];
  for (const [sId, cIds] of Object.entries(staffMap)) {
    cIds.forEach(cId => {
      staffConsultPairs.push({ staffId: Number(sId), consultationId: cId, createdAt: now, updatedAt: now });
    });
  }
  await queryInterface.bulkInsert('staff_consult', staffConsultPairs);

  // 7. BOOKINGS
  const testBookings = [
    { name: 'CARDIOLOGY_EXAM', patientId: 50, staffId: 1, consultationId: 1, slotId: 1, status: 'Confirmed', duration: 30, price: 25000, isPublic: 1, startTime: getNextWeekDay(0, 8, 0), endTime: getNextWeekDay(0, 8, 30), createdAt: now, updatedAt: now },
    { name: 'DENTAL_SCALING', patientId: 50, staffId: 2, consultationId: 2, slotId: 12, status: 'Confirmed', duration: 20, price: 15000, isPublic: 1, startTime: getNextWeekDay(1, 9, 0), endTime: getNextWeekDay(1, 9, 20), createdAt: now, updatedAt: now },
    { name: 'PSYCHIATRY_CONSULT', patientId: 50, staffId: 3, consultationId: 3, slotId: 23, status: 'Confirmed', duration: 60, price: 35000, isPublic: 1, startTime: getNextWeekDay(0, 10, 0), endTime: getNextWeekDay(0, 11, 0), createdAt: now, updatedAt: now },
    { name: 'DERMATOLOGY_SCREENING', patientId: 50, staffId: 4, consultationId: 4, slotId: 45, status: 'Confirmed', duration: 20, price: 18000, isPublic: 1, startTime: getNextWeekDay(2, 8, 30), endTime: getNextWeekDay(2, 8, 50), createdAt: now, updatedAt: now }
  ];

  await Booking.bulkCreate(testBookings);
  await Slot.update({ isAvailable: false }, { where: { id: testBookings.map(b => b.slotId) } });
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

// import db from '../../app/models/modrels.js';
// import bcrypt from 'bcryptjs';

// function toDateOnly(value) {
//   const year = value.getFullYear();
//   const month = String(value.getMonth() + 1).padStart(2, '0');
//   const day = String(value.getDate()).padStart(2, '0');
//   return `${year}-${month}-${day}`;
// }

// function getNextWeekDay(daysFromMonday, hour = 8, minute = 0) {
//   const today = new Date();
//   const nextMonday = new Date(today);
//   nextMonday.setDate(today.getDate() + ((7 - today.getDay() + 1) % 7 || 7));
//   const targetDay = new Date(nextMonday);
//   targetDay.setDate(nextMonday.getDate() + daysFromMonday);
//   targetDay.setHours(hour, minute, 0, 0);
//   return targetDay;
// }

// export const up = async ({ context: queryInterface }) => {
//   const { sequelize, User, Staff, Consultation, Slot, Booking } = db;
//   const now = new Date();
//   const drPass = bcrypt.hashSync('doctor123', 10);
//   const userPass = bcrypt.hashSync('test987', 10);
//   const adminPass = bcrypt.hashSync('joyEtna', 10);

//   // Kényszerített szinkronizáció
//   await sequelize.query('PRAGMA foreign_keys = OFF;');
//   await sequelize.sync({ force: true });
//   await sequelize.query('PRAGMA foreign_keys = ON;');

//   // 1. ROLES
//   await sequelize.query(`
//     INSERT INTO roles (id, name, createdAt, updatedAt)
//     VALUES (0, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
//            (1, 'staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
//            (2, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
//   `);

//   // 2. USERS  
//   await queryInterface.bulkInsert('users', [
//     { id: 25, name: 'User1', email: 'elitport@freemail.hu', password: userPass, roleId: 0, verified: 1, resetPasswordToken: null, resetPasswordExpires: null, createdAt: now, updatedAt: now },
//     { id: 50, name: 'User', email: 'user@ep.com', password: userPass, roleId: 0, verified: 1, resetPasswordToken: null, resetPasswordExpires: null, createdAt: now, updatedAt: now },
//     { id: 101, name: 'Dr. Kovács Antal', email: 'dr.kovacs@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
//     { id: 102, name: 'Dr. Tóth Tünde', email: 'dr.toth@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
//     { id: 103, name: 'Dr. House Greg', email: 'dr.house@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
//     { id: 104, name: 'Dr. Szabó Beatrix', email: 'dr.szabo@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
//     { id: 105, name: 'Dr. Kiss Zoltán', email: 'dr.kiss@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
//     { id: 106, name: 'Dr. Molnár Julianna', email: 'dr.molnar@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
//     { id: 107, name: 'Dr. Barna Barnabás', email: 'dr.barna@ep.com', password: drPass, roleId: 1, resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
//     { id: 108, name: 'Dr. Varga Eszter', email: 'dr.varga@ep.com', password: drPass, roleId: 1, resetPasswordToken: null,  resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now },
//     { id: 100, name: 'Admin', email: 'admin@ep.com', password: adminPass, roleId: 2, verified: 1,resetPasswordToken: null, resetPasswordExpires: null, verified: 1, createdAt: now, updatedAt: now }
//   ]);

//   // 3. STAFF
//   await queryInterface.bulkInsert('staff',[
//     { id: 1, userId: 101, specialty: 'Kardiológus', isAvailable: true, isActive: true, bio: '20 év tapasztalat.', createdAt: now, updatedAt: now },
//     { id: 2, userId: 102, specialty: 'Fogorvos', isAvailable: true, isActive: true, bio: 'Szakorvos.', createdAt: now, updatedAt: now },
//     { id: 3, userId: 103, specialty: 'Pszichiáter', isAvailable: true, isActive: true, bio: 'Diagnoszta.', createdAt: now, updatedAt: now },
//     { id: 4, userId: 104, specialty: 'Bőrgyógyász', isAvailable: true, isActive: true, bio: 'Szakorvos.', createdAt: now, updatedAt: now },
//     { id: 5, userId: 105, specialty: 'Ortopéd szakorvos', isAvailable: true, isActive: true, bio: 'Specialista.', createdAt: now, updatedAt: now },
//     { id: 6, userId: 106, specialty: 'Szemész', isAvailable: true, isActive: true, bio: 'Szakorvos.', createdAt: now, updatedAt: now },
//     { id: 7, userId: 107, specialty: 'Urológus', isAvailable: true, isActive: true, bio: 'Szakorvos.', createdAt: now, updatedAt: now },
//     { id: 8, userId: 108, specialty: 'Nőgyógyász', isAvailable: true, isActive: true, bio: 'Szakorvos.', createdAt: now, updatedAt: now }
//   ]);

//   // 4. CONSULTATIONS
//   await queryInterface.bulkInsert('consultations',[
//     { id: 1, name: 'Kardiológiai szakvizsgálat', specialty: 'Kardiológia', duration: 30, price: 25000, createdAt: now, updatedAt: now },
//     { id: 2, name: 'Fogászati kontroll', specialty: 'Fogászat', duration: 20, price: 15000, createdAt: now, updatedAt: now },
//     { id: 3, name: 'Pszichiátriai első konzultáció', specialty: 'Pszichiátria', duration: 60, price: 35000, createdAt: now, updatedAt: now },
//     { id: 4, name: 'Anyajegyszűrés', specialty: 'Bőrgyógyász', duration: 20, price: 18000, createdAt: now, updatedAt: now },
//     { id: 5, name: 'Ortopédiai szakvizsgálat', specialty: 'Ortopéd szakorvos', duration: 30, price: 22000, createdAt: now, updatedAt: now },
//     { id: 6, name: 'Szemészeti alapvizsgálat', specialty: 'Szemész', duration: 25, price: 16000, createdAt: now, updatedAt: now },
//     { id: 7, name: 'Urológiai kismedencei szűrés', specialty: 'Urológus', duration: 30, price: 20000, createdAt: now, updatedAt: now },
//     { id: 8, name: 'Nőgyógyászati rákszűrés', specialty: 'Nőgyógyász', duration: 40, price: 28000, createdAt: now, updatedAt: now },
//     { id: 9, name: 'Fogkő-eltávolítás', specialty: 'Fogászat', duration: 45, price: 22000, createdAt: now, updatedAt: now },
//     { id: 10, name: 'Fogtömés', specialty: 'Fogászat', duration: 60, price: 35000, createdAt: now, updatedAt: now },
//     { id: 11, name: 'Látásvizsgálat', specialty: 'Szemész', duration: 40, price: 12000, createdAt: now, updatedAt: now },
//     { id: 12, name: 'Ízületi injekció', specialty: 'Ortopéd szakorvos', duration: 15, price: 12000, createdAt: now, updatedAt: now },
//     { id: 13, name: 'Posztoperatív kontroll', specialty: 'Ortopéd szakorvos', duration: 20, price: 15000, createdAt: now, updatedAt: now }
//   ]);

//   // 5. SLOTS
//   const slotsData = [];
//   const staffMap = { 1: [1], 2: [2, 9, 10], 3: [3], 4: [4], 5: [5, 12, 13], 6: [6, 11], 7: [7], 8: [8] };
//   const today = new Date();
//   today.setHours(0,0,0,0);

//   for (let d = 0; d < 30; d++) {
//     const cur = new Date(today);
//     cur.setDate(today.getDate() + d);
//     if (cur.getDay() === 0 || cur.getDay() === 6) continue;
//     const dateStr = toDateOnly(cur);
//     for (const [sId, cIds] of Object.entries(staffMap)) {
//       let cIdx = 0;
//       for (let h = 8; h < 19; h++) {
//         slotsData.push({
//           staffId: Number(sId),
//           consultationId: cIds[cIdx % cIds.length],
//           date: dateStr,
//           startTime: `${h.toString().padStart(2, '0')}:00:00`,
//           endTime: `${(h + 1).toString().padStart(2, '0')}:00:00`,
//           isAvailable: true,
//           createdAt: now, updatedAt: now
//         });
//         cIdx++;
//       }
//     }
//   }
//   await Slot.bulkCreate(slotsData);

//   // 6. STAFF_CONSULT
//   const staffConsultPairs = [];
//   for (const [sId, cIds] of Object.entries(staffMap)) {
//     cIds.forEach(cId => {
//       staffConsultPairs.push({ staffId: Number(sId), consultationId: cId, createdAt: now, updatedAt: now });
//     });
//   }
//   await queryInterface.bulkInsert('staff_consult', staffConsultPairs);

//   // 7. BOOKINGS
//   const testBookings = [
//     { name: 'Kardiológiai vizsgálat', patientId: 50, staffId: 1, consultationId: 1, slotId: 1, status: 'Confirmed', duration: 30, price: 25000, isPublic: 1, startTime: getNextWeekDay(0, 8, 0), endTime: getNextWeekDay(0, 8, 30), createdAt: now, updatedAt: now },
//     { name: 'Fogászati kontroll', patientId: 50, staffId: 2, consultationId: 2, slotId: 12, status: 'Confirmed', duration: 20, price: 15000, isPublic: 1, startTime: getNextWeekDay(1, 9, 0), endTime: getNextWeekDay(1, 9, 20), createdAt: now, updatedAt: now },
//     { name: 'Pszichiátriai konzultáció', patientId: 50, staffId: 3, consultationId: 3, slotId: 23, status: 'Confirmed', duration: 60, price: 35000, isPublic: 1, startTime: getNextWeekDay(0, 10, 0), endTime: getNextWeekDay(0, 11, 0), createdAt: now, updatedAt: now },
//     { name: 'Anyajegyszűrés', patientId: 50, staffId: 4, consultationId: 4, slotId: 45, status: 'Confirmed', duration: 20, price: 18000, isPublic: 1, startTime: getNextWeekDay(2, 8, 30), endTime: getNextWeekDay(2, 8, 50), createdAt: now, updatedAt: now }
//   ];

//   await Booking.bulkCreate(testBookings);
//   await Slot.update({ isAvailable: false }, { where: { id: testBookings.map(b => b.slotId) } });
// };

// export const down = async ({ context: queryInterface }) => {
//   await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF;');
//   await queryInterface.bulkDelete('Bookings', null, {});
//   await queryInterface.bulkDelete('staff_consult', null, {});
//   await queryInterface.bulkDelete('Slots', null, {});
//   await queryInterface.bulkDelete('Consultations', null, {});
//   await queryInterface.bulkDelete('Staff', null, {});
//   await queryInterface.bulkDelete('users', null, {});
//   await queryInterface.bulkDelete('roles', null, {});
//   await queryInterface.sequelize.query('PRAGMA foreign_keys = ON;');
// };