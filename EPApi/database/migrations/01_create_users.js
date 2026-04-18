import { DataTypes, Sequelize } from 'sequelize';

async function up({context: QueryInterface}) {
  await QueryInterface.createTable('users', {
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    roleId: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      references: {
        model: 'roles', 
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET DEFAULT'
    },
    verificationToken: { type: DataTypes.STRING, allowNull: true },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    resetPasswordToken: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    resetPasswordExpires: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }    
  });
}

async function down({context: QueryInterface}) {
  await QueryInterface.dropTable('users');
}

export { up, down };
