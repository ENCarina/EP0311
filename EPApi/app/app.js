import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import fs from 'fs'
import router from './routes/api.js'
import './models/modrels.js'
import { UPLOAD_PATH } from './utils/paths.js'
import sequelize from './database/database.js'


const app = express()

// Adatbázis szinkronizálása
sequelize.sync({ force: false})
  .then(() => console.log('db kész'))
  .catch(err => console.log('Hiba a sync során: ', err));

const logfile = 'access.log'
var accessLogStream = fs.createWriteStream(logfile, { flags: 'a' })

app.use('/images', express.static(UPLOAD_PATH))
app.use(morgan('dev', { stream: accessLogStream }))
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
    console.log(`>>> BEÉRKEZŐ KÉRÉS: ${req.method} ${req.originalUrl}`);
    console.log(`>>> AUTHORIZATION HEADER: ${req.headers.authorization ? 'VAN' : 'NINCS'}`);
    next();
});
app.use('/api', router);

export default app
