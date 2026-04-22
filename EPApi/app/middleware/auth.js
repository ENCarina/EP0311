import db from '../models/modrels.js';
const User = db.User;

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if(!user) {
      return res.status(404).json({
        success: false,
        message: 'COMMON.NOT_FOUND'
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'MESSAGES.AUTH.ACCOUNT_INACTIVE'
      });
    }
    if(user.roleId === 2) {
      next();
    }else {
      return res.status(403).json({
        success: false,
        message: 'BOOKING.UNAUTHORIZED'
      });
    }
  }catch(_err) {
    return res.status(500).json({
      success: false,
      message: 'COMMON.ERROR.SERVER_ERROR'
    });
  }
};

export default isAdmin;
