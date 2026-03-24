import Sequelize from 'sequelize'
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

export async function ensureSqliteCompatibility() {
    if (sequelize.getDialect() !== 'sqlite') {
        return;
    }

    const queryInterface = sequelize.getQueryInterface();
    const userTable = await queryInterface.describeTable('users').catch((error) => {
        if (error?.original?.code === 'SQLITE_ERROR' || /no such table/i.test(error.message)) {
            return null;
        }

        throw error;
    });

    if (userTable && !Object.prototype.hasOwnProperty.call(userTable, 'isActive')) {
        await queryInterface.addColumn('users', 'isActive', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        });
    }
}

export default sequelize;
