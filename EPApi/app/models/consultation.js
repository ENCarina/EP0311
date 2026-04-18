import { DataTypes } from 'sequelize';
import sequelize from '../database/database.js';

const Consultation = sequelize.define('consultations', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  name: {type: DataTypes.STRING, allowNull: false, unique:true },
  description: {type:DataTypes.TEXT, allowNull: true},
  specialty: { type: DataTypes.STRING, allowNull: false}, 
  duration: {type: DataTypes.INTEGER, allowNull: false, defaultValue:60, validate: {min: 5}},
  price: {type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue:0.00, validate: {min: 0}},
}, {
  tableName: 'consultations',
  timestamps: true,
  freezeTableName: true
});

export default Consultation;
