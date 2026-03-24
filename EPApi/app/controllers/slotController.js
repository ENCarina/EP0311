import { Op } from 'sequelize';
import Slot from '../models/slot.js';

const SlotController = {
    sendError(res, error) {
        const isNotFound = error.message === 'Fail! Record not found!';
        return res.status(isNotFound ? 404 : 500).json({
            success: false,
            message: isNotFound ? 'A kért időpont nem található.' : 'Hiba történt a művelet során.',
            error: error.message
        });
    },

    async index(req, res) {
        try {
            const { staffId, consultationId, date } = req.query;

            const whereClause = {
                isAvailable: true,
                date: { [Op.gte]: new Date().setHours(0, 0, 0, 0) }
            };

            if (staffId) {
                whereClause.staffId = Number(staffId);
            }

            if (consultationId) {
                whereClause.consultationId = Number(consultationId);
            }

            if (date) {
                whereClause.date = date;
            }

            const slots = await Slot.findAll({
                where: whereClause,
                order: [['date', 'ASC'], ['startTime', 'ASC']],
            });

            return res.status(200).json({ success: true, data: slots });
        } catch (error) {
            return SlotController.sendError(res, error);
        }
    },

    async show(req, res) {
        try {
            const slot = await Slot.findByPk(req.params.id);
            if (!slot) throw new Error('Fail! Record not found!');
            return res.status(200).json({ success: true, data: slot });
        } catch (error) {
            return SlotController.sendError(res, error);
        }
    },

    async store(req, res) {
        try {
            const { date, staffId } = req.body;
            const requester = req.user;

            if (requester.roleId !== 2) {
                if (!requester.staffId || Number(requester.staffId) !== Number(staffId)) {
                    return res.status(403).json({ success: false, message: 'Csak a saját naptáradat kezelheted!' });
                }
            }

            if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
                return res.status(400).json({ success: false, message: 'Nem hozhat létre időpontot a múltban!' });
            }

            const slot = await Slot.create(req.body);
            return res.status(201).json({ success: true, data: slot });
        } catch (error) {
            return SlotController.sendError(res, error);
        }
    },

    async update(req, res) {
        try {
            const [updatedRows] = await Slot.update(req.body, {
                where: { id: req.params.id }
            });

            if (updatedRows === 0) throw new Error('Fail! Record not found!');

            const updatedSlot = await Slot.findByPk(req.params.id);
            return res.status(200).json({ success: true, data: updatedSlot });
        } catch (error) {
            return SlotController.sendError(res, error);
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await Slot.destroy({ where: { id: req.params.id } });
            if (!deleted) throw new Error('Fail! Record not found!');
            return res.status(200).json({ success: true, message: 'Időpont sikeresen törölve.' });
        } catch (error) {
            return SlotController.sendError(res, error);
        }
    }
};

export default SlotController;