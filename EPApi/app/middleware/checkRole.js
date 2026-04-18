import db from '../models/modrels.js';
const User = db.User;

const checkRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // A verifyToken-től kapjuk a req.userId-t
      const user = await User.findByPk(req.userId);

      if (!user) {
        return res.status(401).json({ success: false, message: 'COMMON.NOT_FOUND'});
      }
 
      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: 'MESSAGES.AUTH.ACCOUNT_INACTIVE' });
      }

      // Jogosultság ellenőrzés 
      if (user.roleId >= requiredRole) {
        req.user = user; 
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'BOOKING.UNAUTHORIZED'
        });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'COMMON.ERROR.SERVER_ERROR' });
    }
  };
};

export default checkRole;
