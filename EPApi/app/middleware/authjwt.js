import jwt from 'jsonwebtoken';
import dotenvFlow from 'dotenv-flow';
dotenvFlow.config()

const verifyToken = (req, res, next) => {
    console.log("--- Auth ellenőrzés ---");
    const authHeader = req.headers['authorization'];

    if(!authHeader) {
        console.log("!!! HIBA: Teljesen hiányzik az Authorization header"); 
        return res.status(403).send({ message: 'Nincs token megadva!'});
    }
    const parts = authHeader.split(' ');
    let token;
    if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
    } else {
        token = authHeader;
    }
    const secretKey = process.env.APP_KEY || 'default_secret_key';

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        req.userId = decoded.id;
        console.log("TOKEN OK! Felhasználó ID:", decoded.id, "Role:", decoded.roleId);
        next();
    } catch (err) {
        console.log("Katasztrófa a verify alatt:", err.message);
        return res.status(401).json({ error: err.message });
    }
};

export default verifyToken