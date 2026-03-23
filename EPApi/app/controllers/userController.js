import db from '../models/modrels.js';
const { User, Staff, Role, Consultation, Booking, Slot, Op } = db;
import bcrypt from 'bcryptjs';

const UserController = {
    // --- LISTÁZÁS ---
    async index(req, res) {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] },
                include: [
                    { model: Role, as: 'role', attributes: ['id', 'name'], required: false },
                    { model: Staff, as: 'staffProfile', required: false, attributes: ['isActive', 'specialty'] }
                ],
                order: [['name', 'ASC']]
            });
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba a lekérdezés során!', details: error.message });
        }
    },

    // --- EGY FELHASZNÁLÓ RÉSZLETEI ---
    async show(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
                include: [
                    { model: Role, as: 'role', required: false },
                    {
                        model: Staff, as: 'staffProfile',
                        include: [{ model: Consultation, as: 'treatments', through: { attributes: [] } }]
                    }
                ]
            });
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található' });
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba a felhasználó lekérésekor!' });
        }
    },

    // --- LÉTREHOZÁS ---
    async create(req, res) {
        try {
            const { name, email, password, roleId } = req.body;
            const hashedPassword = bcrypt.hashSync(password, 10);
            const newUser = await User.create({ name, email, password: hashedPassword, roleId: roleId || 0 });
            const result = newUser.toJSON();
            delete result.password;
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- SAJÁT PROFIL FRISSÍTÉSE (Ezt kereste az api.js!) ---
    async updateMyProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, email } = req.body;
            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
            await user.update({ name: name || user.name, email: email || user.email });
            res.status(200).json({ success: true, message: 'Profil frissítve!', data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- JELSZÓ MÓDOSÍTÁS (Ezt is kereste!) ---
    async updatePassword(req, res) {
        try {
            const { id } = req.params;
            const { password } = req.body;
            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
            const hashedPassword = await bcrypt.hash(password, 10);
            await user.update({ password: hashedPassword });
            res.status(200).json({ success: true, message: 'Jelszó sikeresen módosítva!' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- STÁTUSZ VÁLTÁS ---
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const staffProfile = await Staff.findOne({ where: { userId: id } });
            if (staffProfile) {
                staffProfile.isActive = isActive;
                await staffProfile.save();
            }
            res.status(200).json({ success: true, data: { id, isActive } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba a státusz frissítésekor!' });
        }
    },

    // --- ADATOK FRISSÍTÉSE (Admin) ---
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, email, roleId } = req.body;
            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
            await user.update({ name: name || user.name, email: email || user.email, roleId: roleId !== undefined ? roleId : user.roleId });
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- TÖRLÉS ---
    async destroy(req, res) {
        try {
            const userId = req.params.id;
            const staffProfile = await Staff.findOne({ where: { userId } });
            if (staffProfile) {
                staffProfile.isActive = false;
                await staffProfile.save();
            }
            res.status(200).json({ success: true, message: 'Archiválva.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba az archiválás során!' });
        }
    },

    // --- SAJÁT PROFIL LEKÉRÉSE --- 
    async getMyProfile(req, res) {
        try {
            const userId = req.user.id; 
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'verificationToken'] },
                include: [
                    { model: Role, as: 'role', attributes: ['name'] },
                    {
                        model: Booking, as: 'bookings',
                        include: [
                            { model: Staff, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['name'] }] },
                            { model: Slot, as: 'timeSlot' },
                            { model: Consultation, as: 'treatment' }
                        ]
                    },
                    { model: Staff, as: 'staffProfile', required: false }
                ]
            });
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default UserController;
