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
        let transaction;

        try {
            const normalizedUserId = Number(req.body?.userId);
            const specialty = (req.body?.specialty || '').trim();

            if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
                return res.status(400).json({ success: false, message: 'Érvénytelen felhasználó azonosító.' });
            }

            if (!specialty) {
                return res.status(400).json({ success: false, message: 'A szakterület megadása kötelező.' });
            }

            transaction = await db.sequelize.transaction();

            const user = await User.findByPk(normalizedUserId, { transaction });
            if (!user) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'A kiválasztott felhasználó nem található.' });
            }

            if (Number(user.roleId) === 2) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Admin felhasználó nem nevezhető ki szakemberré.' });
            }

            const existingStaff = await Staff.findOne({
                where: { userId: normalizedUserId },
                transaction
            });

            let staffProfile;
            if (existingStaff) {
                await existingStaff.update({
                    specialty,
                    isActive: true,
                    isAvailable: true
                }, { transaction });
                staffProfile = existingStaff;
            } else {
                staffProfile = await Staff.create({
                    userId: normalizedUserId,
                    specialty,
                    isActive: true,
                    isAvailable: true
                }, { transaction });
            }

            if (Number(user.roleId) !== 1) {
                await user.update({ roleId: 1 }, { transaction });
            }

            await transaction.commit();
            res.json({
                success: true,
                message: existingStaff ? 'A szakember profil frissítve lett.' : 'A szakember profil sikeresen létrejött.',
                data: staffProfile
            });
        } catch (error) {
            if (transaction) {
                await transaction.rollback();
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async store(req, res) {
        try {
            res.status(400).json({
                success: false,
                message: 'Kozvetlen szakember-letrehozas nem engedelyezett. Elobb regisztraljon egy felhasznalot, majd admin feluleten nevezze ki szakemberre.'
            });
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