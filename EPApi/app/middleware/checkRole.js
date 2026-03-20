import User from '../models/user.js';

const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            // Lekérdezzük a legfrissebb adatokat
            const user = await User.findByPk(req.userId);

            if (!user) {
                return res.status(401).json({ success: false, message: 'Felhasználó nem található!' });
            }

            // Csak az isActive-et nézzük 
            if (user.isActive === false) {
                return res.status(403).json({ success: false, message: 'A fiókod inaktív.' });
            }

            // Jogosultság ellenőrzés (A >= jel jó, mert az Admin (2) láthatja a Staff (1) dolgait is)
            if (user.roleId >= requiredRole) {
                // Átadjuk a teljes user objektumot a következő lépésnek (Controllernek), 
                // így ott már nem kell findByPk-t hívni!
                req.user = user; 
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Nincs jogosultságod a művelethez!'
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Szerver hiba a jogosultság ellenőrzésekor.' });
        }
    };
};

export default checkRole;
