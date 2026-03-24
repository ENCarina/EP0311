module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Lekérdezzük a users táblából a staff-hoz tartozó id-ket
    const [users] = await queryInterface.sequelize.query("SELECT id, name FROM users");
    const userMap = {};
    for (const user of users) {
      userMap[user.name] = user.id;
    }
    await queryInterface.bulkInsert('staff', [
      { userId: userMap['Dr. Kovács Antal'], role: 'doctor', specialty: 'Kardiológus', isAvailable: true, isActive:true, bio: '20 éves szakmai tapasztalattal rendelkező szakorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Tóth Tünde'], role: 'doctor', specialty: 'Fogorvos', isAvailable: true, isActive:true, bio: '15 éves nemzetközi tapasztalattal rendelkező fogorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. House Greg'], role: 'doctor', specialty: 'Pszichiáter', isAvailable: true, isActive: true, bio: 'amerikai főorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Admin'], role: 'staff', specialty: 'Vezető asszisztens', isAvailable: true, isActive:true, bio: 'Laborvizsgálatok és adminisztráció felelőse.', imageUrl: null, createdAt: new Date(),updatedAt: new Date()}
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('staff',  null, {});
  }
};