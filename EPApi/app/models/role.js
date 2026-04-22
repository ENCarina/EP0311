import { DataTypes } from 'sequelize';
import sequelize from '../database/database.js';

const Role = sequelize.define('roles', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING,  allowNull: false  }
}, {
  tableName: 'roles',
  timestamps: true,
  freezeTableName: true
});

export default Role;
