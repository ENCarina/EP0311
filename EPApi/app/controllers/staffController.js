import db from '../models/modrels.js';
import dotenv from 'dotenv';
dotenv.config();
import { Op } from 'sequelize';

const { Staff, User, Consultation, Slot } = db;

const StaffController = {
    // 1. Admin lista (Mindenki)
    async index(req, res) {
        try {
            const staff = await Staff.findAll({
                include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
            });
            res.json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 2. Publikus profilok (Csak az aktívak)
    async getPublicProfiles(req, res) {
        try {
            const staff = await Staff.findAll({
                where: { isActive: true },
                include: [{ model: User, as: 'user', attributes: ['name'] }]
            });
            res.json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Egy szakember adatai
    async show(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id, {
                include: [{ model: User, as: 'user' }]
            });
            if (!staff) return res.status(404).json({ success: false, message: 'Szakember nem található' });
            res.json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. KEZELÉSEK LEKÉRÉSE
    async getTreatmentsForStaff(req, res) {
        try {
            const { id } = req.params;
            const staff = await Staff.findByPk(id, {
                include: [{ model: Consultation, as: 'treatments', through: { attributes: [] } }]
            });
            if (!staff) return res.status(404).json({ success: false, message: 'Nincs ilyen szakember' });
            res.json({ success: true, data: staff.treatments || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 5. KEZELÉSEK HOZZÁADÁSA
    async assignTreatments(req, res) {
        try {
            const { id } = req.params;
            const { treatmentIds } = req.body;
            const staff = await Staff.findOne({ where: { userId: id } });
            if (!staff) return res.status(404).json({ success: false, message: 'Szakember nem található' });
            // Hozzárendelt vizsgálat
            await staff.setTreatments(treatmentIds);
            
            res.json({ success: true, message: 'Kezelések frissítve' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 6. ELŐLÉPTETÉS
    async promoteToStaff(req, res) {
        try {
            const { userId, specialty } = req.body;
            const newStaff = await Staff.create({ userId, specialty, isActive: true });
            res.json({ success: true, data: newStaff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 7. Mentés (Új szakember közvetlen létrehozása)
    async store(req, res) {
        try {
            const staff = await Staff.create(req.body);
            res.status(201).json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 8. Frissítés
    async update(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id);
            if (staff) {
                await staff.update(req.body);
                res.json({ success: true, data: staff });
            } else {
                res.status(404).json({ success: false, message: 'Nem található' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 9. Törlés (Fizikai törlés)
    async destroy(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id);
            if (staff) {
                await staff.destroy();
                res.json({ success: true, message: 'Szakember profil törölve' });
            } else {
                res.status(404).json({ success: false, message: 'Nem található' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 10. STÁTUSZ KEZELÉS (Archiválás és Visszaállítás)
    async updateStatus(req, res) {
        try {
            const { id } = req.params; // Itt a userId-t kapjuk az Angulartól
            const { isActive } = req.body;

            // Keresés userId alapján, hogy elkerüljük a 404-et
            const staffProfile = await Staff.findOne({ where: { userId: id } });

            if (!staffProfile) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Ehhez a felhasználóhoz nem tartozik szakmai profil.' 
                });
            }

            staffProfile.isActive = isActive;
            await staffProfile.save();

            res.json({ 
                success: true, 
                message: isActive ? 'Szakember aktiválva' : 'Szakember archiválva', 
                data: staffProfile 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default StaffController;