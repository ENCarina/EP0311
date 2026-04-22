import jwt from 'jsonwebtoken';
import dotenvFlow from 'dotenv-flow';
import log from '../utils/logger.js';
dotenvFlow.config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    log('AUTH ERROR - No token provided');
    return res.status(403).send({ message: 'BOOKINGS.MESSAGES.UNAUTHORIZED' });
  }

  // Bearer token kinyerése
  const parts = authHeader.split(' ');
  const token = (parts.length === 2 && parts[0] === 'Bearer') ? parts[1] : authHeader;
    
  const secretKey = process.env.APP_KEY || 'default_secret_key';

  try {
    const decoded = jwt.verify(token, secretKey);
        
    req.user = decoded;
    req.userId = decoded.id;
        
    next();
  } catch (err) {
    log(`AUTH ERROR - Invalid/Expired token: ${err.message}`);
    return res.status(401).json({ error: 'BOOKINGS.MESSAGES.UNAUTHORIZED'});
  }
};

export default verifyToken;