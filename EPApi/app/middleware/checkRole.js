import User from '../models/user.js'

const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            
            const user = await User.findByPk(req.userId);

            if (!user) {
                return res.status(401).json({ success: false, message: 'Felhasználó nem található!' });
            }
            const accountActive = user.isActive !== false && user.is_active !== false;

            // SOFT DELETE ELLENŐRZÉS:
            if (!accountActive) {
                return res.status(403).json({ success: false, message: 'A fiókod inaktív.' });
            }

            // jogosultság ELLENŐRZÉS (0: User, 1: Staff, 2: Admin)
            if (user.roleId >= requiredRole) {
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Nincs jogosultságod!'
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    };
};

export default checkRole;
