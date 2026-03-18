import User from './user.js';
import sequelize from '../database/database.js';
import Slot from './slot.js';
import Booking from './booking.js';
import Consultation from './consultation.js';
import Staff from './staff.js';

const db = {};
db.sequelize = sequelize;
db.User = User;
db.Staff = Staff;
db.Slot = Slot;
db.Booking = Booking;
db.Consultation = Consultation;

// 1. User - Staff (1:1)
db.User.hasOne(db.Staff, { foreignKey: 'userId', as: 'staffProfile' });
db.Staff.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// 2. Staff - Slot (1:N)
db.Staff.hasMany(db.Slot, { foreignKey: 'staffId' });
db.Slot.belongsTo(db.Staff, { foreignKey: 'staffId' });

// 3. Booking kapcsolatok
db.User.hasMany(db.Booking, { foreignKey: 'patientId', as: 'appointments' });
db.Booking.belongsTo(db.User, { foreignKey: 'patientId', as: 'patient' });

// Consultation - Booking (1:N)
db.Consultation.hasMany(db.Booking, { foreignKey: 'consultationId', as: 'bookings' });
db.Booking.belongsTo(db.Consultation, { foreignKey: 'consultationId', as: 'type' });

db.Staff.hasMany(db.Booking, { foreignKey: 'staffId', as: 'bookings' });
db.Booking.belongsTo(db.Staff, { foreignKey: 'staffId', as: 'doctor' });

// 4. Slot - Booking (1:1)
db.Slot.hasOne(db.Booking, { foreignKey: 'slotId' });
db.Booking.belongsTo(db.Slot, { foreignKey: 'slotId' });

// 5. Staff - Consultation (M:N) 
db.Staff.belongsToMany(db.Consultation, { through: 'staff_consult', foreignKey: 'staffId', as: 'treatments' }); 
db.Consultation.belongsToMany(db.Staff, { through: 'staff_consult', foreignKey: 'consultationId', as: 'specialists' });

// 6. Slot és a Consultation (1:N) 
//db.Consultation.hasMany(db.Slot, { foreignKey: 'consultationId' , as: 'slots'});
//db.Slot.belongsTo(db.Consultation, { foreignKey: 'consultationId', as: 'treatment' });

export default db;