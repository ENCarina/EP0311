import db from '../models/modrels.js';
import dotenv from 'dotenv';

dotenv.config();

const { Staff, User, Consultation } = db;

const StaffController = {
    async index(req, res) {
        try {
            const staff = await Staff.findAll({
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['name', 'email', 'roleId']
                    },
                    {
                        model: Consultation,
                        as: 'treatments',
                        attributes: ['id', 'name', 'price'],
                        through: { attributes: [] }
                    }
                ]
            });
            res.json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getPublicProfiles(req, res) {
        try {
            const staff = await Staff.findAll({
                where: { isActive: true },
                include: [
                    { model: User, as: 'user', attributes: ['name'] },
                    { model: Consultation, as: 'treatments', attributes: ['id', 'name', 'price'], through: { attributes: [] } }
                ]
            });
            res.json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async show(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id, {
                include: [
                    { model: User, as: 'user' },
                    { model: Consultation, as: 'treatments', through: { attributes: [] } }
                ]
            });
            if (!staff) return res.status(404).json({ success: false, message: 'Szakember nem található' });
            res.json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

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

    async assignTreatments(req, res) {
        try {
            const { id } = req.params;
            const { treatmentIds } = req.body;
            const staff = await Staff.findOne({ where: { userId: id } });
            if (!staff) return res.status(404).json({ success: false, message: 'Szakember nem található' });
            await staff.setTreatments(treatmentIds);
            res.json({ success: true, message: 'Kezelések frissítve' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async promoteToStaff(req, res) {
        try {
            const { userId, specialty } = req.body;
            const newStaff = await Staff.create({ userId, specialty, isActive: true });
            res.json({ success: true, data: newStaff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async store(req, res) {
        try {
            const staff = await Staff.create(req.body);
            res.status(201).json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

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

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;

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