import { DataTypes, Sequelize } from 'sequelize';

async function up({context: QueryInterface}) {
  await QueryInterface.createTable('staff_consult', {
    id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, 
      allowNull: false
    },
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{ model: 'staff', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{ model: 'consultations', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }    
  });
}

async function addIndex({context: QueryInterface}) {
  await QueryInterface.dropTable('staff_consult', ['staffId', 'consultationId'], {
    unique: true,
    name: 'staff_consult_unique'
  });
}
async function down({ context: QueryInterface }) {
  await QueryInterface.dropTable('staff_consult');
}

export { up, down };
