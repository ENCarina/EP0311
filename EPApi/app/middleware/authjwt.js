import jwt from 'jsonwebtoken';
import dotenvFlow from 'dotenv-flow';
dotenvFlow.config();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).send({ message: 'Nincs token megadva!' });
    }

    // Bearer token kinyerése
    const parts = authHeader.split(' ');
    const token = (parts.length === 2 && parts[0] === 'Bearer') ? parts[1] : authHeader;
    
    const secretKey = process.env.APP_KEY || 'default_secret_key';

    try {
        const decoded = jwt.verify(token, secretKey);
        
        // Adatok csatolása a request-hez a későbbi használathoz
        req.user = decoded;
        req.userId = decoded.id;
        
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Érvénytelen vagy lejárt token!' });
    }
};

export default verifyToken;