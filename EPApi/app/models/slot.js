import { DataTypes } from 'sequelize';
import sequelize from '../database/database.js';

const Slot = sequelize.define('slots', {
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  consultationId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  isAvailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true}
}, {
  validate: {

    isAfterStart() {
      if (this.endTime <= this.startTime) {
        throw new Error('A befejezési időnek a kezdési idő után kell lennie!');
      }
    }
  },
  timestamps: true,
  freezeTableName: true
});

export default Slot;
