module.exports = {
  up: async ({ context: queryInterface }) => {
    // Lekérdezzük a users táblából a staff-hoz tartozó id-ket
    const [users] = await queryInterface.sequelize.query("SELECT id, name FROM users");
    const userMap = {};
    for (const user of users) {
      userMap[user.name] = user.id;
    }
    await queryInterface.bulkInsert('staff', [
      { userId: userMap['Dr. Kovács Antal'], specialty: 'Kardiológus', isAvailable: true, isActive:true, bio: '20 éves szakmai tapasztalattal rendelkező kardiológus szakorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Tóth Tünde'], specialty: 'Fogorvos', isAvailable: true, isActive:true, bio: '15 éves nemzetközi tapasztalattal rendelkező fogorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. House Greg'], specialty: 'Pszichiáter', isAvailable: true, isActive: true, bio: 'Komplex esetekre specializálódott pszichiáter.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Szabó Eszter'], specialty: 'Szemész', isAvailable: true, isActive:true, bio: 'Látásvizsgálatra és szemfenéki szűrésre specializálódott szemész szakorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Varga Júlia'], specialty: 'Nőgyógyász', isAvailable: true, isActive:true, bio: 'Megelőző szűrésekben és nőgyógyászati gondozásban jártas szakorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Farkas Bence'], specialty: 'Bőrgyógyász', isAvailable: true, isActive:true, bio: 'Anyajegyvizsgálattal és krónikus bőrpanaszok kezelésével foglalkozik.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Németh Ádám'], specialty: 'Neurológus', isAvailable: true, isActive:true, bio: 'Fejfájás és idegrendszeri panaszok kivizsgálásában tapasztalt neurológus.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Kiss Mária'], specialty: 'Ortopéd', isAvailable: true, isActive:true, bio: 'Ízületi és gerinceredetű panaszok kezelésére specializálódott ortopéd szakorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Balogh Péter'], specialty: 'Urológus', isAvailable: true, isActive:true, bio: 'Megelőző urológiai szűrések és kontrollok szakértője.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Molnár Zsófia'], specialty: 'Endokrinológus', isAvailable: true, isActive:true, bio: 'Pajzsmirigy- és hormonális panaszok kivizsgálásával foglalkozik.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Horváth Levente'], specialty: 'Pulmonológus', isAvailable: true, isActive:true, bio: 'Légzőszervi panaszok és asztmás betegek gondozásában tapasztalt szakorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Papp Dóra'], specialty: 'Fül-orr-gégész', isAvailable: true, isActive:true, bio: 'Fül-orr-gégészeti kontrollokra és hallásvizsgálatokra specializálódott.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Lakatos Réka'], specialty: 'Gasztroenterológus', isAvailable: true, isActive:true, bio: 'Emésztőrendszeri panaszok kivizsgálásával és kontrolljával foglalkozik.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Simon Márton'], specialty: 'Reumatológus', isAvailable: true, isActive:true, bio: 'Mozgásszervi és gyulladásos panaszok kezelésében jártas reumatológus.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Dr. Gál Noémi'], specialty: 'Diabetológus', isAvailable: true, isActive:true, bio: 'Cukorbeteg gondozásra és életmódterápiára specializálódott szakorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      { userId: userMap['Admin'], specialty: 'Vezető asszisztens', isAvailable: true, isActive:true, bio: 'Laborvizsgálatok és adminisztráció felelőse.', imageUrl: null, createdAt: new Date(),updatedAt: new Date()}
    ]);
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('staff',  null, {});
  }
};