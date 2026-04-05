import { Op } from 'sequelize';
import Slot from '../models/slot.js';

const SlotController = {
    // Egységesített válaszkezelés a hibákhoz 
    sendError(res, error) {
        const isNotFound = error.message === 'Fail! Record not found!';
        return res.status(isNotFound ? 404 : 500).json({
            success: false,
            message: isNotFound ? 'COMMON.NOT_FOUND' : 'COMMON.ERROR_GENERAL',
            error: error.message
        });
    },
    async bulkGenerate(req, res) {
        try {
            const { staffId, consultationId, startDate, endDate, startTime, endTime, interval } = req.body;
            const requester = req.user;

            // Jogosultság ellenőrzés (Admin vagy saját maga)
            if (requester.roleId !== 2 && (!requester.staffId || Number(requester.staffId) !== Number(staffId))) {
                return res.status(403).json({ success: false, message: "BOOKING.UNAUTHORIZED" });
            }


            let current = new Date(startDate);
            const last = new Date(endDate);

            current.setHours(0, 0, 0, 0);
            last.setHours(0, 0, 0, 0);
            const slotsData = [];

            while (current <= last) {
                // Hétvége kihagyása (0: Vasárnap, 6: Szombat)
                const dayOfWeek = current.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    const dateStr = current.toISOString().split('T')[0];
                    
                    let [startH, startM] = startTime.split(':').map(Number);
                    let [endH, endM] = endTime.split(':').map(Number);
                    
                    let currentTime = new Date(current);
                    currentTime.setHours(startH, startM, 0, 0);
                    
                    let finishTime = new Date(current);
                    finishTime.setHours(endH, endM, 0);

                    while (currentTime < finishTime) {
                        const slotStart = currentTime.toTimeString().split(' ')[0].substring(0, 5); 
                        // Időpont léptetése 
                        const nextTime = new Date(currentTime);
                        nextTime.setMinutes(nextTime.getMinutes() + Number(interval));
                        const slotEnd = nextTime.toTimeString().split(' ')[0].substring(0, 5);

                        // Csak akkor adjuk hozzá, ha a slot vége sem lépi túl a munkaidőt
                       if (nextTime <= finishTime) {
                            slotsData.push({
                                staffId: Number(staffId),
                                consultationId: Number(consultationId),
                                date: dateStr,
                                startTime: slotStart,
                                endTime: slotEnd,
                                isAvailable: true
                            });
                        }
                        currentTime = new Date(nextTime);
                    }
                }
                current.setDate(current.getDate() + 1);
            }
            if (slotsData.length === 0) {
            return res.status(400).json({ success: false, message: "STAFF.MESSAGES.NO_SLOTS_GENERATED" });
        }

            // Tömeges mentés az adatbázisba
            const createdSlots = await Slot.bulkCreate(slotsData);

            return res.status(201).json({ 
                success: true, 
                message: 'COMMON.SUCCESS',
                count: createdSlots.length 
            });

        } catch (error) {
            console.error("Bulk generate error:", error);
            return SlotController.sendError(res, error);
        }
    },

    async index(req, res) {
        try {
            const { staffId, date, startDate, endDate } = req.query;
            const now = new Date();
            const todayStr = now.toLocaleDateString('sv-SE');

            const whereClause = {
                isAvailable: true,
            };

            if (startDate && endDate) {
                whereClause.date = {
                    [Op.between]: [startDate, endDate]
                };
            } else {
                whereClause.date = { 
                    [Op.gte]: todayStr
                };
            }
            if (staffId && staffId !== 'null' && staffId !== 'undefined') {
            whereClause.staffId = Number(staffId);
            }

            const slots = await Slot.findAll({
                where: whereClause,
                order: [
                    ['date', 'ASC'], 
                    ['startTime', 'ASC']
                ],
            });
            
            return res.status(200).json({ 
                success: true, 
                count: slots.length,
                data: slots 
            });

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

            // Jogosultság ellenőrzés (Admin: 2 vagy a saját staffId-ja)
            if (requester.roleId !== 2) {
                if (!requester.staffId || Number(requester.staffId) !== Number(staffId)) {
                    return res.status(403).json({ 
                        success: false, 
                        message: "BOOKING.UNAUTHORIZED" 
                    });
                }
            }

            // Múltbeli dátum ellenőrzése
            if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "COMMON.ATTENTION" // Vagy egy specifikusabb: "ERROR_PAST_DATE"
                });
            }

            const slot = await Slot.create(req.body);
            return res.status(201).json({ 
                success: true, 
                message: 'COMMON.SUCCESS',
                data: slot 
            });
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
            return res.status(200).json({ 
                success: true, 
                message: 'SERVICES.MESSAGES.UPDATE_SUCCESS',
                data: updatedSlot 
            });
        } catch (error) {
            return SlotController.sendError(res, error);
        }
    },

    async destroy(req, res) {
        try {
            const deleted = await Slot.destroy({ where: { id: req.params.id } });
            if (!deleted) throw new Error('Fail! Record not found!');
            
            return res.status(200).json({ 
                success: true, 
                message: 'SERVICES.MESSAGES.DELETE_SUCCESS' 
            });
        } catch (error) {
            return SlotController.sendError(res, error);
        }
    }
};

export default SlotController;