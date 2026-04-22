import { DataTypes } from 'sequelize';
import sequelize from '../database/database.js';

const User = sequelize.define('user', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: { type: DataTypes.STRING,  allowNull: false,
    validate: {notEmpty: true}
  },
  email: { type: DataTypes.STRING,  allowNull: true,
    validate: {isEmail: true}
  },
  password: { type: DataTypes.STRING , allowNull: false },
  roleId: { type: DataTypes.INTEGER, defaultValue: 0,
    references:{ model: 'roles', key: 'id'}
  },
  verificationToken: { type: DataTypes.STRING, allowNull: true },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },

  resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true }
}, {
  timestamps: true,    
  freezeTableName: true,
  tableName: 'users',
});

export default User;
