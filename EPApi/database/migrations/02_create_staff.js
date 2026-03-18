import { DataTypes, Sequelize } from 'sequelize';

async function up({ context: QueryInterface }) { 
  await QueryInterface.createTable('staff', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    }, 

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', 
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    
    role: {
      type: DataTypes.ENUM('admin', 'doctor', 'staff', 'user'),
      defaultValue: 'staff'
    }, 

    specialty: {
      type: DataTypes.STRING,
      allowNull: true 
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: { 
      allowNull: false, 
      type: DataTypes.DATE,
      defaultValue: new Date() 
    },
    updatedAt: { 
      allowNull: false, 
      type: DataTypes.DATE,
      defaultValue: new Date() 
    }    
  });
}

async function down({ context: QueryInterface }) {
  await QueryInterface.dropTable('staff');
}

export { up, down };