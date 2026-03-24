import app from './app.js'
import { initializeDatabase } from './app.js'
import dotenv from 'dotenv';

dotenv.config()

const PORT = process.env.APP_PORT || 8000;

try {
    await initializeDatabase();

    app.listen(PORT, () => {
        console.log(`Listening on port: ${PORT}`);
        console.log(`-------------------------------------------`);
    });
} catch (err) {
    console.log('Hiba a sync során: ', err);
    process.exit(1);
}
