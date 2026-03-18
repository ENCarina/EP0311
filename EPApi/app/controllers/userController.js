import bcrypt from 'bcryptjs';
import db from '../models/modrels.js'
import { Op } from 'sequelize';

const { Staff, User } = db;

const UserController = {
    async index(req, res) {
        try {
            await UserController.tryIndex(req, res)
        }catch(error) {
            console.error("!!! CONTROLLER HIBA:", error);
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                details: error.message // Ideiglenesen küldjük vissza az Angularnak is
            })
        }
    },
    async tryIndex(req, res) {
        
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [{ model: Staff, as: 'staffProfile', required: false }],
            order: [[{ model: Staff, as: 'staffProfile' }, 'isActive', 'DESC'], ['name', 'ASC']]
        });
        console.log(">>> TESZT SIKERES! Találatok:", users.length);
        res.status(200).json({
            success: true,
            data: users
        });
    },
    async show(req, res) {
        try {
            await UserController.tryShow(req, res)
        }catch(error) {
            console.error("DEBUG:", error);
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!'
            })
        }
    },
    async tryShow(req, res) {
        const user = await User.findByPk(req.params.id)
        res.status(200)
        res.json({
            success: true,
            data: user
        })
    },
    async create(req, res) {
        let clientError = false;
        try {
            const { name, email, password, confirmPassword } = req.body;

            if(!name || !email || !password || !confirmPassword) {
                clientError = true;
                throw new Error('Error! Hiányzó adatok!')
            }
            if(password != confirmPassword) {
                clientError = true
                throw new Error('Error! A két jelszó nem egyezik!')
            }
            const existingUser = await User.findOne({
                where: { 
                    [Op.or]: [{ name: name }, { email: email }]
            }
        });
            if(existingUser) {
                clientError = true;
                const field = existingUser.name === name ? 'név' : 'email';
                throw new Error(`Error! Ez a ${field} már foglalt!`);
            }            
            await UserController.tryCreate(req, res);

        }catch(error) {
           res.status(clientError ? 400 : 500).json({
                success: false,
                message: 'Error! A művelet sikertelen!',
                error: error.message
            });
        }
    },
    async tryCreate(req, res) {
        const newUser = {
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            roleId: req.body.roleId || 1
        }        
        const userData = await User.create(newUser)
        const result = userData.toJSON();
        delete result.password;
        
        res.status(201).json({
            success: true,
            data: result
        })
    },
    async updatePassword(req, res) {
        let clientError = false;
        try {
            const { password, confirmPassword } = req.body;
            const targetId = req.params.id; // A router-ben :id van, így innen olvassuk ki
            const requester = req.user;

            if (requester.roleId !== 2 && requester.id != targetId) {
            clientError = true;
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
                message: error.message // Az error.message-et küldjük, hogy a Swal kiírja
            });
        }
    },

    async tryUpdatePassword(req, res) {
        const { id } = req.params; 
        const { password } = req.body;

        const user = await User.findByPk(id);
        if(!user) {
            return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await user.update({ password: hashedPassword });
        console.log(`>>> Jelszó sikeresen frissítve: User ID ${id}`);
        return res.status(200).json({ success: true, message: 'Jelszó sikeresen módosítva!' }); 
        },

    async promoteToStaff(req, res) {
    try {
        const { id } = req.params; 
        const { specialty, bio } = req.body; 

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Felhasználó nem található' });
        }

        await user.update({ roleId: 1 });

        await Staff.create({
            userId: id,
            specialty: specialty || 'Általános szakértő',
            bio: bio || '',
            isActive: true,
            isAvailable: true
        });

        res.status(200).json({ 
            success: true, 
            message: 'A felhasználó mostantól szakember!' 
        });
    } catch (error) {
        console.error("Promote hiba:", error);
        res.status(500).json({ success: false, message: error.message });
    }
},
    // --- STÁTUSZ (AKTÍV/INAKTÍV) VÁLTÁS ---
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

        // Szinkronizáljuk a Staff profilt is, ha létezik
        const staffProfile = await Staff.findOne({ where: { userId: id } });
        if (staffProfile) {
            staffProfile.isActive = isActive;
            await staffProfile.save();
        }

        res.status(200).json({ success: true, data: { id: user.id, isActive: user.isActive } });
    },
    async destroy(req, res) {
        try {
            await UserController.tryDestroy(req, res)
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },
    async tryDestroy(req, res) {
        const userId = req.params.id;

        if (Number(userId) === Number(req.userId)) {
            return res.status(400).json({
                success: false,
                message: 'Error! Saját magadat nem archiválhatod!'
                });
            }
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Error! Felhasználó nem található!'
            });
        }
        user.isActive = false;
        await user.save();

        const staffProfile = await Staff.findOne({ where: { userId: userId } });

        if (staffProfile) {
            staffProfile.isActive = false;
            await staffProfile.save();
        }

        res.status(200)
        res.json({
            success: true,
            message: 'A felhasználó és kapcsolódó profilja sikeresen archiválva.',
            data: { id: user.id, isActive: user.isActive }
        });
    }
}

export default UserController
