import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/api.js';
import './models/modrels.js';
import sequelize from './database/database.js';

// 1.  útvonalak definiálása
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist/epweb/browser');

const app = express();

// 2. app.use hívások
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

const logfile = 'access.log';
var accessLogStream = fs.createWriteStream(logfile, { flags: 'a' });
app.use(morgan('dev', {
  skip: function (req, res) { return res.statusCode < 400; }
}));
app.use(morgan('combined', { stream: accessLogStream }));

// 3. LOGGING middleware
app.use((req, res, next) => {
  next();
});
app.use('/api', router);

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

export default app;
