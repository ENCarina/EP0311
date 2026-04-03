import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/api.js'
import './models/modrels.js'
import { UPLOAD_PATH } from './utils/paths.js'
import sequelize from './database/database.js';

// 1.  az útvonalak és az app definiálása
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist/epweb/browser');

const app = express();

//app.use(express);

// 2. app.use hívások
app.use(cors({
  origin: 'http://localhost:4200', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// 3. LOGGING middleware
app.use((req, res, next) => {
    // console.log(`>>> BEÉRKEZŐ KÉRÉS: ${req.method} ${req.originalUrl}`);
    // console.log(`>>> AUTHORIZATION HEADER: ${req.headers.authorization ? 'VAN' : 'NINCS'}`);
    next();
});
app.use('/api', router);

const logfile = 'access.log'
var accessLogStream = fs.createWriteStream(logfile, { flags: 'a' })
app.use(morgan('dev', { stream: accessLogStream }))

// 4. Statikus file kiszolgálása (pics + Ang build)
app.use('/images', express.static('public/images'));
app.use(express.static(distPath));

// 5. Ang SPA fallback
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Adatbázis szinkronizálása
sequelize.sync({ force: false})
  .then(() => console.log('db kész'))
  .catch(err => console.log('Hiba a sync során: ', err));

app.use((req, res, next) => {
    //console.log(`>>> BEÉRKEZŐ KÉRÉS: ${req.method} ${req.originalUrl}`);
    //console.log(`>>> AUTHORIZATION HEADER: ${req.headers.authorization ? 'VAN' : 'NINCS'}`);
    next();
});


export default app
