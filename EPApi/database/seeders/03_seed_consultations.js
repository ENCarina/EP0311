module.exports = {
  up: async (queryInterface, Sequelize) => {
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
        duration: 30,
        price: 15000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'Pszichiátriai első konzultáció',
        description: 'Hosszabb mélyinterjú és diagnózis felállítás.',
        specialty: 'Pszichiátria',
        duration: 30,
        price: 35000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: 'Laboreredmény értékelés',
        description: 'Friss laboreredmények áttekintése és kezelési javaslat.',
        specialty: 'Általános',
        duration: 30,
        price: 12000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        name: 'Kontroll konzultáció',
        description: 'Rövid állapotkövetés, gyógyszeres és életmód tanácsadás.',
        specialty: 'Általános',
        duration: 30,
        price: 18000.00,
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