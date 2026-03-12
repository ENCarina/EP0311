import User from '../models/user.js'

const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        const userRole = req.userRoleId;

        if (userRole === undefined) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' });
        }

            if(userRole >= requiredRole) {
                next()
            }else {
                return res.status(403).json({
                    success: false,
                    message: 'You are not allowed to do this action'
                })
            }
        };
};

export default checkRole
