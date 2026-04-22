import sequelize from '../app/database/database.js';
import * as chaiModule from 'chai';
import chaiHttp from 'chai-http';
import app from '../app/app.js'; 

const chai = chaiModule.use(chaiHttp);
const { expect } = chai;


global.expect = expect;
global.request = (url) => chai.request(url || app); 
global.app = app;

before(async () => {
    try {
        await sequelize.sync({ force: true });
        const now = new Date().toISOString();
        await sequelize.query(`
            INSERT INTO roles (id, name, createdAt, updatedAt) VALUES 
            (0, 'user', '${now}', '${now}'), 
            (1, 'staff', '${now}', '${now}'), 
            (2, 'admin', '${now}', '${now}')
        `);
    } catch (error) {
        console.error('--- ❌ Hiba a szinkronizálás során:', error);
        process.exit(1);
    }
});

after(async () => {
    try {
        await sequelize.close();
    } catch (error) {
        console.error('--- ❌ Hiba a lezáráskor:', error);
    }
});
