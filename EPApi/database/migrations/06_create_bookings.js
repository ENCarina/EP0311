import { DataTypes, Sequelize } from 'sequelize';

async function up({context: QueryInterface}) {
  await QueryInterface.createTable('bookings', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING, 
      allowNull: false 
    },
   
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }, 
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },

    staffId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'staff', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' 
    },

    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: true, 
      references: { model: 'consultations', key: 'id' }
    },

    slotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'slots', key: 'id' }, 
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Confirmed' 
    },

    duration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    startTime: { 
      type: DataTypes.DATE, 
      allowNull: false 
    }, 

    endTime: {          
      type: DataTypes.DATE, 
      allowNull: true 
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await QueryInterface.addIndex('bookings', ['staffId', 'status']);
}

async function down({context: QueryInterface}) {
  await QueryInterface.dropTable('bookings');
}

export { up, down };