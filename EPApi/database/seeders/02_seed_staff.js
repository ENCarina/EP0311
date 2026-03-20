import db from '../../app/models/modrels.js';

async function up({context: QueryInterface}) {
  if(db.Staff) {
    await db.Staff.bulkCreate([
      
      {id: 1, userId: 101, role: 'doctor', specialty: 'Kardiológus', isAvailable: true, isActive:true, bio: '20 éves szakmai tapasztalattal rendelkező szakorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      {id: 2, userId: 102, role: 'doctor', specialty: 'Fogorvos', isAvailable: true, isActive:true, bio: '15 éves nemzetközi tapasztalattal rendelkező fogorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      {id: 3, userId: 103, role: 'doctor', specialty: 'Pszichiáter', isAvailable: true, isActive: true, bio: 'amerikai főorvos.', imageUrl: null, createdAt: new Date(), updatedAt: new Date()},
      {id: 4, userId: 100, role: 'staff', specialty: 'Vezető asszisztens', isAvailable: true, isActive:true, bio: 'Laborvizsgálatok és adminisztráció felelőse.', imageUrl: null, createdAt: new Date(),updatedAt: new Date()}
    ]);
  }else {
    await QueryInterface.bulkInsert('staff', [
      {
    userId: 101, 
    role: 'doctor', 
    specialty: 'Kardiológus', 
    isAvailable: true,
    isActive:  true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
    ]);
  }

}

async function down({context: QueryInterface}) {
  await QueryInterface.bulkDelete('staff',  null, {});
}

export { up, down }