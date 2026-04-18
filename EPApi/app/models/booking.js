import { DataTypes } from 'sequelize';
import sequelize from '../database/database.js';

const Booking = sequelize.define('bookings', {
  name: {type: DataTypes.STRING, allowNull: false },
  patientId: { type: DataTypes.INTEGER,  allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  staffId: { type: DataTypes.INTEGER,  allowNull: false,
    references: { model: 'staff', key: 'id' }
  },
  consultationId: { type: DataTypes.INTEGER,  allowNull: false,
    references: { model: 'consultations', key: 'id' }
  },
  slotId: { type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'slots', key: 'id' }
  },
  duration: { type: DataTypes.INTEGER, allowNull: false },
  startTime: { type: DataTypes.DATE, allowNull: false }, 
  endTime: { type: DataTypes.DATE, allowNull: true }, 
  status: { type: DataTypes.ENUM ('Pending', 'Confirmed', 'Cancelled', 'Completed'), 
    allowNull: false, 
    defaultValue: 'Pending'
  },
  price: {type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue:0.00},
  isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  //notes: {type: DataTypes.TEXT},

}, {
  timestamps: true,
  freezeTableName: true
});

export default Booking;
