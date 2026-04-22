import { DataTypes } from 'sequelize';
import sequelize from '../database/database.js';

const Staff = sequelize.define('staff', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    unique: true, 
    references: {
      model: 'users',
      key: 'id'
    }
  },
  specialty: { type: DataTypes.STRING, allowNull: true },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  imageUrl: { type: DataTypes.STRING, allowNull: true },
}, {
  timestamps: true,
  tableName: 'staff',
  freezeTableName: true
});

export default Staff;
