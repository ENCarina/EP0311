import db from '../models/modrels.js';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const { Staff, User, Consultation, Slot } = db;

const StaffController = {
    // 1. Admin lista 
    async index(req, res) {
        try {
            const staff = await Staff.findAll({
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
            });
            return res.json({ success: true, data: staff });
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                message: 'STAFF.MESSAGES.RESTORE_ERROR', 
                error: error.message 
            });
        }
    },

    // Kísérleti index (Kezelésekkel együtt, mélyebb asszociációval)
    async tryIndex(req, res) {
        try {
            const staff = await Staff.findAll({
                attributes: ['id', 'specialty'],
                include: [
                    { model: User, as: 'user', attributes: ['name'] },
                    {
                        model: Consultation,
                        as: 'treatments',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }
                ]
            });
            return res.status(200).json({ success: true, data: staff });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // 2. Publikus profilok (Csak az aktívak a pácienseknek)
    async getPublicProfiles(req, res) {
        try {
            const staff = await Staff.findAll({
                where: { isActive: true },
                include: [
                    { model: User, as: 'user', attributes: ['name'] },
                    { 
                        model: Consultation, 
                        as: 'treatments', 
                        through: { attributes: [] } 
                    }
                ]
            });
            return res.json({ success: true, data: staff });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'COMMON.ERROR_GENERAL' });
        }
    },

    // 3. Egy konkrét szakember adatlapja
    async show(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id, {
                include: [{ model: User, as: 'user' }]
            });
            if (!staff) {
                return res.status(404).json({ success: false, message: 'USERS.MESSAGES.PROFILE_NOT_FOUND' });
            }
            return res.json({ success: true, data: staff });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. Szakemberhez tartozó kezelések lekérése
    async getTreatmentsForStaff(req, res) {
        try {
            const { id } = req.params;
            const staff = await Staff.findByPk(id, {
                include: [{ model: Consultation, as: 'treatments', through: { attributes: [] } }]
            });
            if (!staff) return res.status(404).json({ success: false, message: 'STAFF.MESSAGES.INVALID_ID' });
            return res.json({ success: true, data: staff.treatments || [] });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'SERVICES.MESSAGES.TREATMENTS_LOAD_ERROR' });
        }
    },

    // 5. Kezelések hozzárendelése (M:N kapcsolat frissítése)
    async assignTreatments(req, res) {
        try {
            const { id } = req.params; // userId jön az URL-ből
            const { treatmentIds } = req.body;
            const staff = await Staff.findOne({ where: { userId: id } });
            
            if (!staff) return res.status(404).json({ success: false, message: 'STAFF.MESSAGES.INVALID_ID' });
            
            await staff.setTreatments(treatmentIds);
            return res.json({ success: true, message: 'STAFF.MESSAGES.ASSIGN_SUCCESS' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'STAFF.MESSAGES.ASSIGN_ERROR' });
        }
    },

    // 6. Felhasználó előléptetése szakemberré
    async promoteToStaff(req, res) {
        try {
            const { userId, specialty } = req.body;
            const newStaff = await Staff.create({ 
                userId, 
                specialty: specialty || 'General', 
                isActive: true 
            });
            return res.json({ success: true, message: 'COMMON.SUCCESS', data: newStaff });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // 7. Új szakember létrehozása (User + Staff egyben)
    async store(req, res) {
        try {
            const { name, email, password, specialty, bio, roleId } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password || 'doctor123', salt);

            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
                roleId: roleId || 1,
            });

            const staff = await Staff.create({
                userId: newUser.id,
                specialty: specialty || 'Általános szakorvos',
                bio: bio || '',
                isActive: true
            });

            return res.status(201).json({
                success: true,
                message: 'STAFF.MESSAGES.ADD_SUCCESS',
                data: { id: staff.id, name: newUser.name, email: newUser.email }
            });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: 'MESSAGES.AUTH.EMAIL_ALREADY_TAKEN' });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // 8. Összetett frissítés (User és Staff adatok egyszerre)
    async update(req, res) {
        try {
            const { id } = req.params; // userId
            const { name, email, specialty, bio, isActive, isAvailable } = req.body;

            // 1. User tábla frissítése
            await User.update({ name, email }, { where: { id: id } });

            // 2. Staff tábla frissítése
            const [updatedRows] = await Staff.update(
                { specialty, bio, isActive, isAvailable },
                { where: { userId: id } }
            );

            if (updatedRows === 0) {
                console.warn(`Nincs módosítandó staff rekord a userId-hoz: ${id}`);
            }

            return res.json({ success: true, message: "STAFF.MESSAGES.UPDATE_SUCCESS" });
        } catch (error) {
            console.error("Update hiba:", error);
            return res.status(500).json({ success: false, message: 'COMMON.ERROR_GENERAL' });
        }
    },

    // 9. Fizikai törlés
    async destroy(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id);
            if (!staff) {
                return res.status(404).json({ success: false, message: 'STAFF.MESSAGES.INVALID_ID' });
            }
            await staff.destroy();
            return res.json({ success: true, message: 'SERVICES.MESSAGES.DELETE_SUCCESS' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // 10. Státusz kezelés (Aktiválás/Archiválás)
    async updateStatus(req, res) {
        try {
            const { id } = req.params; // userId
            const { isActive } = req.body;

            const staffProfile = await Staff.findOne({ where: { userId: id } });

            if (!staffProfile) {
                return res.status(404).json({ success: false, message: 'STAFF.MESSAGES.INVALID_ID' });
            }

            staffProfile.isActive = isActive;
            await staffProfile.save();

            return res.json({
                success: true,
                message: isActive ? 'STAFF.MESSAGES.RESTORE_SUCCESS' : 'USERS.MESSAGES.ARCHIVE_SUCCESS',
                data: staffProfile
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default StaffController;