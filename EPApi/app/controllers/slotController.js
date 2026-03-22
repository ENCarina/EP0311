import { Op } from 'sequelize';
import Slot from '../models/slot.js'

const SlotController = {
    // Segédfüggv a hibakezeléshez
    handleError(res, error) {
        const status = error.message === 'Fail! Record not found!' ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Error! The query failed!',
            error: error.message
        });
    },

    async index(req, res) {
        try {
            const { staffId, consultationId, date } = req.query;

            const whereClause = {
                isAvailable: true,
                date: { [Op.gte]: new Date().setHours(0,0,0,0) }
            };

            if (staffId) {
                whereClause.staffId = Number (staffId);
            }

            if (date) {
                whereClause.date = { [Op.gte]: date };
                //whereClause.date = date; 

            console.log("Keresési feltételek:", whereClause);
            }
            const slots = await Slot.findAll({
                where: whereClause,
                order: [['date', 'ASC'], ['startTime', 'ASC']],
            });
            
            res.status(200).json({ success: true, data: slots });
        } catch (error) {
            SlotController.handleError(res, error);
        }
    },

    async show(req, res) {
        try {
            const slot = await Slot.findByPk(req.params.id);
            if (!slot) throw new Error('Fail! Record not found!');
            res.status(200).json({ success: true, data: slot });
        } catch (error) {
            SlotController.handleError(res, error);
        }
    },

    async store(req, res) {
        try {
            const { date, staffId } = req.body;
            const requester = req.user;
            // Csak admin hozhat létre slotot másnak, az orvos csak magának
            if (req.user.roleId !== 2){
                if (!requester.staffId || Number(requester.staffId) !== Number(staffId)) {
                    return res.status(403).json({ success: false, message: "Csak a saját naptáradat kezelheted!" });
                }
            }
            if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Nem hozhat létre időpontot a múltban!" 
                });
            }
            const slot = await Slot.create(req.body);
            res.status(201).json({ success: true, data: slot });
        } catch (error) {
            SlotController.handleError(res, error);
        }
    },

    async update(req, res) {
        try {
            const [updatedRows] = await Slot.update(req.body, {
                where: { id: req.params.id }
            });

            if (updatedRows === 0) throw new Error('Fail! Record not found!');

            const updatedSlot = await Slot.findByPk(req.params.id);
            res.status(200).json({ success: true, data: updatedSlot });
        } catch (error) {
            SlotController.handleError(res, error);
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await Slot.destroy({
                where: { id: req.params.id }
            });
            if (!deleted) throw new Error('Fail! Record not found!');
            res.status(200).json({ success: true, message: 'Törölve', data: deleted });
        } catch (error) {
            SlotController.handleError(res, error);
        }
    }
}

export default SlotController;
