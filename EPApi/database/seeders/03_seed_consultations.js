module.exports = {
  up: async (queryInterface, Sequelize) => {
    const consultationData = [
      {
        name: 'Kardiológiai szakvizsgálat',
        description: 'Teljes körű szív- és érrendszeri állapotfelmérés.',
        specialty: 'Kardiológia',
        duration: 30,
        price: 25000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fogászati kontroll',
        description: 'Általános állapotfelmérés és tanácsadás.',
        specialty: 'Fogászat',
        duration: 20,
        price: 15000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pszichiátriai első konzultáció',
        description: 'Hosszabb mélyinterjú és diagnózis felállítás.',
        specialty: 'Pszichiátria',
        duration: 60,
        price: 35000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await queryInterface.bulkInsert('consultations', consultationData);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('consultations', null, {});
  }
};
