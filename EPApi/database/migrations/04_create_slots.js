import { DataTypes } from 'sequelize';

async function up({context: QueryInterface}) {
  await QueryInterface.createTable('slots', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'staff', 
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },

    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'consultations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
   
    startTime: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    endTime: {
      type: DataTypes.STRING,
      allowNull: false
    },

    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE }    
  });
}

async function down({context: QueryInterface}) {
  await QueryInterface.dropTable('slots');
}

export { up, down };
