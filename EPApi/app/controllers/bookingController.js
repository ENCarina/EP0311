import { BookingService } from '../services/bookingService.js';
import db from '../models/modrels.js'; 
import { EmailService } from '../services/emailService.js';

const BookingController = {
    async index(req, res) {
        try {
            console.log('Lekérés indul a felhasználónak:', req.user.id);

            const bookings = await db.Booking.findAll({
                where: { patientId: req.user.id },
                include: [
                    { model: db.User, as: 'patient', attributes: ['id','name', 'email'] },
                    { 
                        model: db.Staff, 
                        as: 'doctor', 
                        attributes: ['id', 'specialty'], 
                        include: [{ model: db.User, as: 'user', attributes: ['name'] }] 
                    },
                    { 
                        model: db.Slot, 
                        as: 'timeSlot', 
                        attributes: ['date', 'startTime', 'endTime'] 
                    },
                    { 
                        model: db.Consultation, 
                        as: 'treatment', 
                        attributes: ['id', 'name', 'price'] 
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            console.log(`Sikeres lekérés! Találatok száma: ${bookings.length}`);
            return res.status(200).json({ success: true, data: bookings });

        } catch (error) {
            console.error('BACKEND HIBA (index):', error);
            return res.status(500).json({
                success: false,
                message: 'Hiba történt a foglalások lekérésekor.',
                error: error.message
            });
        }
    },

    async tryIndex(req, res) {
        const bookings = await db.Booking.findAll();
        return res.status(200).json({
            success: true,
            data: bookings
        });
    },

    async show(req, res) {
        try {
            const booking = await db.Booking.findByPk(req.params.id, {
                include: ['patient', 'doctor', 'timeSlot', 'treatment']
            });
            if (!booking) return res.status(404).json({ success: false, message: 'Nincs ilyen foglalás.' });
            return res.status(200).json({ success: true, data: booking });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error! The query failed!',
                error: error.message
            });
        }
    },

    async tryShow(req, res) {
        const booking = await db.Booking.findByPk(req.params.id);
        return res.status(200).json({
            success: true,
            data: booking
        });
    },

    async store(req, res) {
        try {
            const currentUserId = req.user?.id || req.userId;
            if (!currentUserId) throw new Error("Nincs bejelentkezett felhasználó!");

            const user = await db.User.findByPk(currentUserId);
            if (!user) throw new Error("A felhasználó nem található!");

            const bookingData = {
                ...req.body,
                patientId: currentUserId,
                //duration: req.body.duration || 30,
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
        const booking = await db.Booking.create(req.body);
        return res.status(201).json({
            success: true,
            data: booking
        });
    },

    async update(req, res) {
        try {
            await BookingController.tryUpdate(req, res);
        } catch (error) {
            let status = 500;
            let message = 'Fail! The query failed!';
            
            if (error.message === 'Fail! Record not found!') {
                status = 404;
                message = error.message;
            }

            return res.status(status).json({
                success: false,
                message: message
            });
        }
    },

    async tryUpdate(req, res) {
        const [recordNumber] = await db.Booking.update(req.body, {
            where: { id: req.params.id }
        });
        
        if (recordNumber === 0) {
            throw new Error('Fail! Record not found!');
        }
        
        const booking = await db.Booking.findByPk(req.params.id);
        return res.status(200).json({
            success: true,
            data: booking
        });
    },

    async destroy(req, res) {
        const t = await db.sequelize.transaction();
        try {
            const booking = await db.Booking.findByPk(req.params.id);
            
            if (!booking) {
                await t.rollback();
                return res.status(404).json({ success: false, message: "Foglalás nem található!" });
            }

            // Jogosultság ellenőrzése (laza összehasonlítás a típuseltérés miatt)
            if (req.user.roleId !== 2 && booking.patientId != req.user.id) {
                await t.rollback();
                return res.status(403).json({ success: false, message: "Nincs jogosultsága a törléshez!" });
            }

            await db.Slot.update(
                { isAvailable: true },
                { where: { id: booking.slotId }, transaction: t }
            );

            await booking.destroy({ transaction: t });
            await t.commit();

            return res.status(200).json({ success: true, message: 'Törölve.' });
        } catch (error) {
            if (t) await t.rollback();
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};
    

export default BookingController;