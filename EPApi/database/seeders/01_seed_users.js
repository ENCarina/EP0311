const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});

    // Roles beszúrás id nélkül
    await queryInterface.bulkInsert('roles', [
      { name: 'user', createdAt: new Date(), updatedAt: new Date() },
      { name: 'staff', createdAt: new Date(), updatedAt: new Date() },
      { name: 'admin', createdAt: new Date(), updatedAt: new Date() }
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
      { name: 'User1', email: 'elitport@freemail.hu', password: bcrypt.hashSync('test987',10), roleId: roleMap['user'], verified: true, verificationToken: null, isActive: true },
      { name: 'User', email: 'user@ep.com', password: bcrypt.hashSync('test1243',10), roleId: roleMap['user'], verified: true, verificationToken: null, isActive: true },
      { name: 'Dr. Kovács Antal', email: 'dr.kovacs@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true },
      { name: 'Dr. Tóth Tünde', email: 'dr.toth@ep.com', password: doctorsPassword,  roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true },
      { name: 'Dr. House Greg', email: 'dr.house@ep.com', password: doctorsPassword, roleId: roleMap['staff'], verified: true, verificationToken: null, isActive: true },
      { name: 'Admin', email: 'admin@ep.com', password: adminPassword, roleId: roleMap['admin'], verified: true, verificationToken: null, isActive: true },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    // Előbb töröljük a users-t, majd a roles-t
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
