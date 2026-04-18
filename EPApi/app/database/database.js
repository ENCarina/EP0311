import Sequelize from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'database_development',
  process.env.DB_USER || 'admin',
  process.env.DB_PASS || null,
  {
    dialect: process.env.DB_DIALECT || 'sqlite',
    storage: process.env.DB_STORAGE || './database/data.sqlite',
    logging: process.env.APP_LOG === 'true' ? console.log : false,
    dialectOptions: {
      dateStrings: true, 
      typeCast: true     
    },
  }
);

export default sequelize;
