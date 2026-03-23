import { BookingService } from '../services/bookingService.js';
import db from '../models/modrels.js'; 
import { EmailService } from '../services/emailService.js';

const BookingController = {
    // 1. Összes saját foglalás lekérése
    async index(req, res) {
        try {
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

            return res.status(200).json({ success: true, data: bookings });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Hiba történt a foglalások lekérésekor.',
                error: error.message
            });
        }
    },

    // 2. Egy konkrét foglalás megtekintése
    async show(req, res) {
        try {
            const booking = await db.Booking.findByPk(req.params.id, {
                include: ['patient', 'doctor', 'timeSlot', 'treatment']
            });
            
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Nincs ilyen foglalás.' });
            }

            return res.status(200).json({ success: true, data: booking });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Hiba a lekérés során!',
                error: error.message
            });
        }
    },

    // 3. Új foglalás létrehozása
    async store(req, res) {
        try {
            const currentUserId = req.user?.id || req.userId;
            if (!currentUserId) throw new Error("Nincs bejelentkezett felhasználó!");

            const user = await db.User.findByPk(currentUserId);
            if (!user) throw new Error("A felhasználó nem található!");

            const bookingData = {
                ...req.body,
                patientId: currentUserId,
                status: req.body.status || 'Confirmed'
            };

            const newBooking = await BookingService.createBooking(bookingData, user);

            return res.status(201).json({
                success: true,
                message: 'Sikeres foglalás!',
                data: newBooking
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: error.message || 'Sajnáljuk, a foglalás nem sikerült.'
            });
        }
    },

    // 4. Foglalás frissítése
    async update(req, res) {
        try {
            const [recordNumber] = await db.Booking.update(req.body, {
                where: { id: req.params.id }
            });
            
            if (recordNumber === 0) {
                return res.status(404).json({ success: false, message: 'Foglalás nem található!' });
            }
            
            const booking = await db.Booking.findByPk(req.params.id);
            return res.status(200).json({ success: true, data: booking });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Hiba a frissítés során!',
                error: error.message
            });
        }
    },

    // 5. Foglalás törlése (Transaction-nel)
    async destroy(req, res) {
        const t = await db.sequelize.transaction();
        try {
            const booking = await db.Booking.findByPk(req.params.id);
            
            if (!booking) {
                await t.rollback();
                return res.status(404).json({ success: false, message: "Foglalás nem található!" });
            }

            // Jogosultság: Csak Admin (2) vagy a foglalás saját tulajdonosa törölhet
            if (req.user.roleId !== 2 && booking.patientId != req.user.id) {
                await t.rollback();
                return res.status(403).json({ success: false, message: "Nincs jogosultsága a törléshez!" });
            }

            // Felszabadítjuk az időpontot (isAvailable: true)
            await db.Slot.update(
                { isAvailable: true },
                { where: { id: booking.slotId }, transaction: t }
            );

            await booking.destroy({ transaction: t });
            await t.commit();

            return res.status(200).json({ success: true, message: 'Foglalás sikeresen törölve.' });
        } catch (error) {
            if (t) await t.rollback();
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};

export default BookingController;