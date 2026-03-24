module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('consultations', null, {});

    const consultationData = [
      { name: 'Kardiológiai szakvizsgálat', description: 'Teljes körű szív- és érrendszeri állapotfelmérés.', specialty: 'Kardiológia', duration: 30, price: 25000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'EKG és szívultrahang konzultáció', description: 'EKG kiértékelés és szívultrahang eredmények áttekintése.', specialty: 'Kardiológia', duration: 45, price: 32000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Fogászati kontroll', description: 'Általános fogászati állapotfelmérés és tanácsadás.', specialty: 'Fogászat', duration: 30, price: 15000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Professzionális fogkőeltávolítás', description: 'Lepedék- és fogkőeltávolítás kontrollvizsgálattal.', specialty: 'Fogászat', duration: 45, price: 22000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pszichiátriai első konzultáció', description: 'Hosszabb mélyinterjú és diagnózis felállítás.', specialty: 'Pszichiátria', duration: 60, price: 35000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pszichiátriai kontroll', description: 'Állapotkövető kontroll és terápiás javaslat felülvizsgálata.', specialty: 'Pszichiátria', duration: 30, price: 22000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Szemészeti alapvizsgálat', description: 'Látásélesség és szemészeti státusz vizsgálata.', specialty: 'Szemészet', duration: 30, price: 21000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Szemnyomás és látásellenőrzés', description: 'Szemnyomásmérés és kontroll látásvizsgálat.', specialty: 'Szemészet', duration: 30, price: 18000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Nőgyógyászati szakvizsgálat', description: 'Általános nőgyógyászati állapotfelmérés és tanácsadás.', specialty: 'Nőgyógyászat', duration: 30, price: 26000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Rákszűrés és ultrahang konzultáció', description: 'Rákszűrési eredmények és nőgyógyászati ultrahang áttekintése.', specialty: 'Nőgyógyászat', duration: 45, price: 34000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Bőrgyógyászati anyajegyvizsgálat', description: 'Anyajegyek és bőrelváltozások szakorvosi vizsgálata.', specialty: 'Bőrgyógyászat', duration: 30, price: 23000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Allergiás bőrtünet kontroll', description: 'Krónikus és allergiás bőrpanaszok kontrollvizsgálata.', specialty: 'Bőrgyógyászat', duration: 30, price: 19000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Neurológiai szakvizsgálat', description: 'Idegrendszeri tünetek és panaszok kivizsgálása.', specialty: 'Neurológia', duration: 45, price: 29000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Fejfájás kivizsgálási konzultáció', description: 'Migrén, szédülés és fejfájás panaszok kontrollja.', specialty: 'Neurológia', duration: 30, price: 24000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Ortopédiai szakvizsgálat', description: 'Mozgásszervi panaszok és ízületi problémák felmérése.', specialty: 'Ortopédia', duration: 30, price: 27000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Ízületi kontrollvizsgálat', description: 'Gerinc- és ízületi panaszok állapotkövetése.', specialty: 'Ortopédia', duration: 30, price: 21000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Urológiai szakvizsgálat', description: 'Urológiai panaszok szakorvosi kivizsgálása.', specialty: 'Urológia', duration: 30, price: 26000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Prosztata szűrő konzultáció', description: 'Megelőző urológiai szűrés és eredményértékelés.', specialty: 'Urológia', duration: 45, price: 30000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Endokrinológiai szakvizsgálat', description: 'Hormonális eltérések és anyagcsere-problémák kivizsgálása.', specialty: 'Endokrinológia', duration: 45, price: 28000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pajzsmirigy kontroll', description: 'Pajzsmirigy problémák nyomon követése és terápiás kontroll.', specialty: 'Endokrinológia', duration: 30, price: 22000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pulmonológiai szakvizsgálat', description: 'Légzőszervi panaszok és krónikus tüdőbetegségek kivizsgálása.', specialty: 'Pulmonológia', duration: 30, price: 27000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Légzésfunkciós vizsgálat', description: 'Légzésfunkciós teszt és eredményértékelés.', specialty: 'Pulmonológia', duration: 30, price: 23000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Fül-orr-gégészeti szakvizsgálat', description: 'Fül-orr-gégészeti panaszok teljes kivizsgálása.', specialty: 'Fül-orr-gégészet', duration: 30, price: 22000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Hallás- és arcüreg kontroll', description: 'Hallásvizsgálat és arcüregpanaszok kontrollja.', specialty: 'Fül-orr-gégészet', duration: 30, price: 18000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Gasztroenterológiai szakvizsgálat', description: 'Emésztőrendszeri panaszok szakorvosi kivizsgálása.', specialty: 'Gasztroenterológia', duration: 45, price: 31000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Hasi panasz kivizsgálási konzultáció', description: 'Hasi fájdalom és emésztési problémák kontrollvizsgálata.', specialty: 'Gasztroenterológia', duration: 30, price: 26000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Reumatológiai szakvizsgálat', description: 'Gyulladásos és degeneratív mozgásszervi panaszok felmérése.', specialty: 'Reumatológia', duration: 45, price: 28000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Mozgásszervi kontroll', description: 'Krónikus mozgásszervi panaszok és terápia kontrollja.', specialty: 'Reumatológia', duration: 30, price: 21000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Diabetológiai szakvizsgálat', description: 'Cukoranyagcsere-zavarok és inzulinterápia felmérése.', specialty: 'Diabetológia', duration: 30, price: 26000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cukorbeteg gondozási kontroll', description: 'Rendszeres diabetológiai állapotkövetés és életmódterápia.', specialty: 'Diabetológia', duration: 30, price: 20000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Laboreredmény értékelés', description: 'Friss laboreredmények áttekintése és kezelési javaslat.', specialty: 'Általános', duration: 30, price: 12000.00, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Kontroll konzultáció', description: 'Rövid állapotkövetés, gyógyszeres és életmód tanácsadás.', specialty: 'Általános', duration: 30, price: 18000.00, createdAt: new Date(), updatedAt: new Date() }
    ];
    await queryInterface.bulkInsert('consultations', consultationData);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('consultations', null, {});
  }
};