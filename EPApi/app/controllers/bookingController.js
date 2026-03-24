import { BookingService } from '../services/bookingService.js';
import db from '../models/modrels.js';
import { EmailService } from '../services/emailService.js';

const BookingController = {
    async index(req, res) {
        try {
            const currentUserId = req.user?.id || req.userId;
            const currentUserRole = req.user?.roleId;

            if (!currentUserId) {
                return res.status(401).json({ success: false, error: 'User not authenticated' });
            }

            let whereClause = { patientId: currentUserId };

            if (currentUserRole === 1) {
                const staffRecord = await db.Staff.findOne({ where: { userId: currentUserId } });
                if (!staffRecord) {
                    return res.status(200).json({ success: true, data: [] });
                }
                whereClause = { staffId: staffRecord.id };
            } else if (currentUserRole === 2) {
                whereClause = {};
            }

            const bookings = await db.Booking.findAll({
                where: whereClause,
                include: [
                    { model: db.User, as: 'patient', attributes: ['name', 'email'] },
                    { model: db.Staff, as: 'doctor', attributes: ['id', 'specialty'], include: [{ model: db.User, as: 'user', attributes: ['name'] }] },
                    { model: db.Slot, as: 'timeSlot', attributes: ['date', 'startTime', 'endTime'] },
                    { model: db.Consultation, as: 'treatment', attributes: ['id', 'name', 'price'] }
                ],
                order: [['createdAt', 'DESC']]
            });
            res.status(200).json({ success: true, data: bookings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async tryIndex(req, res) {
        const bookings = await db.Booking.findAll()
        res.status(200).json({
            success: true,
            data: bookings
        })
    },

    async show(req, res) {
        try {
            await BookingController.tryShow(req, res)
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },

    async tryShow(req, res) {
        const booking = await db.Booking.findByPk(req.params.id)
        res.status(200).json({
            success: true,
            data: booking
        })
    },

    async store(req, res) {
        try {
            const currentUserId = req.user?.id || req.userId;
            if (!currentUserId) throw new Error("Nincs bejelentkezett felhasználó!");

            const user = await db.User.findByPk(currentUserId);
            if (!user) throw new Error("A felhasználó nem található!");

            const bookingData = {
                ...req.body,
                duration: req.body.duration || 30,
                status: req.body.status || 'Confirmed'
            };

            const newBooking = await BookingService.createBooking(bookingData, user);

            return res.status(201).json({
                success: true,
                message: 'Sikeres foglalás!',
                data: newBooking
            });
        } catch (error) {
            console.error('Controller hiba:', error.message);
            return res.status(400).json({
                success: false,
                error: error.message || 'Sajnáljuk, a foglalás nem sikerült.'
            });
        }
    },

    async tryStore(req, res) {
        const booking = await db.Booking.create(req.body)
        res.status(201).json({
            success: true,
            data: booking
        })
    },

    async update(req, res) {
        try {
            await BookingController.tryUpdate(req, res)
        } catch (error) {
            let actualMessage = '';
            if (error.message == 'Fail! Record not found!') {
                actualMessage = error.message
                res.status(404)
            } else {
                res.status(500)
                actualMessage = 'Fail! The query is failed!'
            }

            res.json({
                success: false,
                message: actualMessage
            })
        }
    },

    async tryUpdate(req, res) {
        const recordNumber = await db.Booking.update(req.body, {
            where: { id: req.params.id }
        })
        if (recordNumber == 0) {
            throw new Error('Fail! Record not found!')
        }
        const booking = await db.Booking.findByPk(req.params.id)
        res.status(200).json({
            success: true,
            data: booking
        })
    },

    async destroy(req, res) {
        try {
            const currentUserId = req.user?.id || req.userId;
            const currentUserRole = req.user?.roleId;

            if (!currentUserId) {
                return res.status(401).json({ success: false, error: 'User not authenticated' });
            }

            if (currentUserRole === 2) {
                const t = await db.sequelize.transaction();
                try {
                    const booking = await db.Booking.findByPk(req.params.id, { transaction: t });
                    if (!booking) throw new Error('Foglalás nem található!');

                    await db.Slot.update(
                        { isAvailable: true },
                        { where: { id: booking.slotId }, transaction: t }
                    );

                    await booking.destroy({ transaction: t });
                    await t.commit();

                    return res.status(200).json({
                        success: true,
                        message: 'Törölve és felszabadítva.'
                    });
                } catch (error) {
                    await t.rollback();
                    throw error;
                }
            }

            const result = await BookingService.cancelBooking(req.params.id, currentUserId);

            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            if (error.message === 'Foglalás nem található!') {
                return res.status(404).json({ success: false, error: error.message });
            }

            if (error.message === 'Nincs jogosultságod a lemondáshoz!') {
                return res.status(403).json({ success: false, error: error.message });
            }

            if (error.message === '24 órán belüli lemondás csak telefonon lehetséges!') {
                return res.status(400).json({ success: false, error: error.message });
            }

            return res.status(500).json({ success: false, error: error.message });
        }
    }
};

export default BookingController;