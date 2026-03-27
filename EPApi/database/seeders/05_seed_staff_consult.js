module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('staff_consult', null, {});

    const [staffRows] = await queryInterface.sequelize.query(`
      SELECT staff.id, staff.specialty
      FROM staff
      INNER JOIN users ON users.id = staff.userId
      WHERE users.roleId = 1
      ORDER BY staff.id ASC
    `);
    const [consultationRows] = await queryInterface.sequelize.query('SELECT id, specialty, name FROM consultations ORDER BY id ASC');

    const specialtyMap = {
      'Kardiológus': 'Kardiológia',
      'Fogorvos': 'Fogászat',
      'Pszichiáter': 'Pszichiátria',
      'Szemész': 'Szemészet',
      'Nőgyógyász': 'Nőgyógyászat',
      'Bőrgyógyász': 'Bőrgyógyászat',
      'Neurológus': 'Neurológia',
      'Ortopéd': 'Ortopédia',
      'Urológus': 'Urológia',
      'Endokrinológus': 'Endokrinológia',
      'Pulmonológus': 'Pulmonológia',
      'Fül-orr-gégész': 'Fül-orr-gégészet',
      'Gasztroenterológus': 'Gasztroenterológia',
      'Reumatológus': 'Reumatológia',
      'Diabetológus': 'Diabetológia'
    };

    const generalConsultations = consultationRows.filter((consultation) => consultation.specialty === 'Általános');
    const pivotData = [];

    for (const staff of staffRows) {
      const specialtyName = specialtyMap[staff.specialty] || staff.specialty;
      const specialtyConsultations = consultationRows.filter((consultation) => consultation.specialty === specialtyName);

      for (const consultation of [...specialtyConsultations, ...generalConsultations]) {
        pivotData.push({
          staffId: staff.id,
          consultationId: consultation.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('staff_consult', pivotData);
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('staff_consult', null, {});
  }
};