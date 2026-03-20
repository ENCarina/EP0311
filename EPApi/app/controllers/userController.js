import db from '../models/modrels.js'
const { User, Staff, Role, Consultation, Op } = db;
import bcrypt from 'bcryptjs';

const UserController = {
    // --- LISTÁZÁS (ADMIN FELÜLETRE IS) ---
    async index(req, res) {
        try {
            await UserController.tryIndex(req, res);
        } catch (error) {
            console.error("!!! CONTROLLER HIBA:", error);
            res.status(500).json({
                success: false,
                message: 'Hiba a lekérdezés során!',
                details: error.message
            });
        }
    },

    async tryIndex(req, res) {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Role,
                    as: 'role', 
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: Staff,
                    as: 'staffProfile',
                    required: false, // A sima User-ek is megjelennek!
                    include: [
                        {
                            model: Consultation,
                            as: 'treatments',
                            through: { attributes: [] },
                            required: false
                        }
                    ]
                }
            ],
            order: [
                //[{ model: Staff, as: 'staffProfile' }, 'isActive', 'DESC'], // Előbb az aktív szakemberek, aztán ABC név szerint
                ['name', 'ASC']
            ]
        });

        res.status(200).json({
            success: true,
            data: users
        });
    },

    // --- EGY FELHASZNÁLÓ RÉSZLETEI ---
    async show(req, res) {
        try {
            await UserController.tryShow(req, res);
        } catch (error) {
            console.error("DEBUG SHOW HIBA:", error);
            res.status(500).json({
                success: false,
                message: 'Hiba a felhasználó lekérésekor!'
            });
        }
    },

    async tryShow(req, res) {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Role,
                    as: 'role',
                    required: false
                },
                {
                    model: Staff,
                    as: 'staffProfile',
                    include: [{
                        model: Consultation,
                        as: 'treatments', 
                        through: { attributes: [] }
                    }]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Felhasználó nem található' });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    },

    // --- LÉTREHOZÁS (REGISZTRÁCIÓ) ---
    async create(req, res) {
        let clientError = false;
        try {
            const { name, email, password, confirmPassword } = req.body;

            if (!name || !email || !password || !confirmPassword) {
                clientError = true;
                throw new Error('Hiányzó adatok!');
            }
            if (password !== confirmPassword) {
                clientError = true;
                throw new Error('A két jelszó nem egyezik!');
            }

            const existingUser = await User.findOne({
                where: { [Op.or]: [{ name }, { email }] }
            });

            if (existingUser) {
                clientError = true;
                const field = existingUser.name === name ? 'név' : 'email';
                throw new Error(`Ez a ${field} már foglalt!`);
            }

            await UserController.tryCreate(req, res);
        } catch (error) {
            res.status(clientError ? 400 : 500).json({
                success: false,
                message: error.message
            });
        }
    },

    async tryCreate(req, res) {
        const newUser = {
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            roleId: req.body.roleId !== undefined ? req.body.roleId : 0,
            isActive: true
        };

        const userData = await User.create(newUser);
        const result = userData.toJSON();
        delete result.password;

        res.status(201).json({
            success: true,
            data: result
        });
    },

    // --- JELSZÓ MÓDOSÍTÁS ---
    async updatePassword(req, res) {
        let clientError = false;
        try {
            const { password, confirmPassword } = req.body;
            const targetId = req.params.id;
            const requester = req.user; // AuthMiddleware-ből 

            // Jogosultság: Csak admin (2) vagy saját maga
            if (requester.roleId !== 2 && Number(requester.id) !== Number(targetId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Nincs jogosultságod más jelszavát módosítani!'
                });
            }

            if (!password || !confirmPassword) {
                clientError = true;
                throw new Error('Hiányzó jelszó mezők!');
            }
            if (password !== confirmPassword) {
                clientError = true;
                throw new Error('A két jelszó nem egyezik!');
            }

            await UserController.tryUpdatePassword(req, res);
        } catch (error) {
            res.status(clientError ? 400 : 500).json({
                success: false,
                message: error.message
            });
        }
    },

    async tryUpdatePassword(req, res) {
        const { id } = req.params;
        const { password } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await user.update({ password: hashedPassword });

        return res.status(200).json({ success: true, message: 'Jelszó sikeresen módosítva!' });
    },

    // --- ELŐLÉPTETÉS SZAKEMBERRÉ ---
    async promoteToStaff(req, res) {
        try {
            const { id } = req.params;
            const { specialty } = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Felhasználó nem található' });
            }
            if (user.roleId !== 2) {
            await user.update({ roleId: 1 });
        }
            const [staff, created] = await Staff.findOrCreate({
            where: { userId: id },
            defaults: {
                specialty: specialty || 'Általános szakértő',
                isActive: true,
                isAvailable: true
            }
        });
            if (!created) {
            await staff.update({ 
                isActive: true, 
                specialty: specialty || staff.specialty 
            });
        }
            res.status(200).json({
                success: true,
                message: created ? 'A felhasználó mostantól szakember!' : 'A szakmai profil frissítve lett!',
                data: {
                    roleId: user.roleId,
                    staffId: staff.id
                    }
                });

        } catch (error) {
            console.error("Promote hiba:", error);
            res.status(500).json({
                success: false,
                message: 'Hiba történt...a szakemberré avatás során.'
            });
        }
    },

    // --- ALAPADATOK FRISSÍTÉSE ---
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, email, roleId } = req.body;

            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });

            await user.update({
                name: name || user.name,
                email: email || user.email,
                roleId: roleId !== undefined ? roleId : user.roleId
            });

            res.status(200).json({
                success: true,
                message: 'Adatok sikeresen frissítve!',
                data: user
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- STÁTUSZ VÁLTÁS ---
    async updateStatus(req, res) {
        try {
            await UserController.tryUpdateStatus(req, res);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba a státusz frissítésekor!', error: error.message });
        }
    },

    async tryUpdateStatus(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });

        user.isActive = isActive;
        await user.save();

        const staffProfile = await Staff.findOne({ where: { userId: id } });
        if (staffProfile) {
            staffProfile.isActive = isActive;
            await staffProfile.save();
        }

        res.status(200).json({ success: true, data: { id: user.id, isActive: user.isActive } });
    },

    // --- TÖRLÉS (ARCHIVÁLÁS) ---
    async destroy(req, res) {
        try {
            await UserController.tryDestroy(req, res);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Hiba a törlés/archiválás során!',
                error: error.message
            });
        }
    },

    async tryDestroy(req, res) {
        const userId = req.params.id;

        // Ne tudja saját magát törölni
        if (Number(userId) === Number(req.userId)) {
            return res.status(400).json({
                success: false,
                message: 'Saját magadat nem archiválhatod!'
            });
        }
        // 2. Felhasználó lekérése
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
        }
        // 3. Archiválás (User tábla)
        user.isActive = false;
        await user.save();

        // 4. Kapcsolódó szakember profil archiválása
        const staffProfile = await Staff.findOne({ where: { userId } });
        if (staffProfile) {
            staffProfile.isActive = false;
            await staffProfile.save();
        }
        // 5. Válasz küldése a friss állapotról
        res.status(200).json({
            success: true,
            message: 'Sikeres archiválás.',
            data: { id: user.id, isActive: user.isActive, name: user.name }
        });
    }
};

export default UserController;
