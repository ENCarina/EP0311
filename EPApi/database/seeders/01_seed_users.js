const bcrypt = require('bcryptjs');

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    const now = new Date();

    // Az alkalmazás logikája a 0=user, 1=staff, 2=admin szerepkör-azonosítókra épül.
    await queryInterface.bulkInsert('roles', [
      { id: 0, name: 'user', createdAt: now, updatedAt: now },
      { id: 1, name: 'staff', createdAt: now, updatedAt: now },
      { id: 2, name: 'admin', createdAt: now, updatedAt: now }
    ]);

    // Lekérdezzük az id-ket
    const [roles] = await queryInterface.sequelize.query('SELECT id, name FROM roles');
    const roleMap = {};
    for (const role of roles) {
      roleMap[role.name] = role.id;
    }

    const doctorsPassword = bcrypt.hashSync('doctor123', 10);
    const adminPassword = bcrypt.hashSync('joyEtna', 10);

    await queryInterface.bulkInsert('users', [
      { name: 'User1', email: 'elitport@freemail.hu', password: bcrypt.hashSync('test987',10), roleId: roleMap['user'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'User', email: 'user@ep.com', password: bcrypt.hashSync('test1243',10), roleId: roleMap['user'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Kiss Anna', email: 'kiss.anna@ep.com', password: bcrypt.hashSync('patient123',10), roleId: roleMap['user'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Nagy Péter', email: 'nagy.peter@ep.com', password: bcrypt.hashSync('patient123',10), roleId: roleMap['user'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Tóth Emese', email: 'toth.emese@ep.com', password: bcrypt.hashSync('patient123',10), roleId: roleMap['user'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Kovács Antal', email: 'dr.kovacs@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Tóth Tünde', email: 'dr.toth@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. House Greg', email: 'dr.house@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Szabó Eszter', email: 'dr.szabo@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Varga Júlia', email: 'dr.varga@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Farkas Bence', email: 'dr.farkas@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Németh Ádám', email: 'dr.nemeth@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Kiss Mária', email: 'dr.kiss@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Balogh Péter', email: 'dr.balogh@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Molnár Zsófia', email: 'dr.molnar@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Horváth Levente', email: 'dr.horvath@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Papp Dóra', email: 'dr.papp@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Lakatos Réka', email: 'dr.lakatos@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Simon Márton', email: 'dr.simon@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Dr. Gál Noémi', email: 'dr.gal@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Admin', email: 'admin@ep.com', password: adminPassword, roleId: roleMap['admin'], verified: true, verificationToken: null, isActive: true, createdAt: now, updatedAt: now },
    ]);
  },
  down: async ({ context: queryInterface }) => {
    // Előbb töröljük a users-t, majd a roles-t
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
