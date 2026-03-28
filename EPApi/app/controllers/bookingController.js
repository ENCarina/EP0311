import { BookingService } from '../services/bookingService.js';
import db from '../models/modrels.js'; 
import {Op} from 'sequelize';
import { EmailService } from '../services/emailService.js';

const BookingController = {
    async index(req, res) {
        try {
            let whereCondition = {};
            if (req.user.roleId === 1) {
                const staff = await db.Staff.findOne({ where: { userId: req.user.id } });
                whereCondition = { staffId: staff ? staff.id : null };
            } else if (req.user.roleId === 0) {
                whereCondition = { patientId: req.user.id };
            } else if (req.user.roleId === 2) {
                whereCondition = {};
            }

            const bookings = await db.Booking.findAll({
                where: whereCondition,
                include: [
                    { model: db.User, as: 'patient', attributes: ['id','name', 'email'] },
                    { 
                        model: db.Staff, as: 'doctor', attributes: ['id', 'specialty'], 
                        include: [{ model: db.User, as: 'user', attributes: ['name'] }] 
                    },
                    { model: db.Slot, as: 'timeSlot', attributes: ['id', 'date', 'startTime', 'endTime'] },
                    { model: db.Consultation, as: 'treatment', attributes: ['id', 'name', 'price'] }
                ],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json({ success: true, data: bookings });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },
   
    // 2. Egy konkrét foglalás megtekintése
    async show(req, res) {
        try {
            const booking = await db.Booking.findByPk(req.params.id, {
                include: [
                    { model: db.User, as: 'patient', attributes: ['id','name', 'email'] },
                    { 
                        model: db.Staff, as: 'doctor', 
                        include: [{ model: db.User, as: 'user', attributes: ['name'] }] 
                    },
                    { model: db.Slot, as: 'timeSlot' },
                    { model: db.Consultation, as: 'treatment' }
                ]
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

            // Megnézi, h a páciensnek van-e már foglalása UGYANEBBEN az időpontban
            const selectedSlot = await db.Slot.findByPk(req.body.slotId);
            
            if (!selectedSlot) throw new Error("A választott időpont nem létezik!");

            const existingConflict = await db.Booking.findOne({
                include: [{
                    model: db.Slot,
                    as: 'timeSlot',
                    where: {
                        date: selectedSlot.date,
                        startTime: selectedSlot.startTime
                    }
                }],
                where: {
                    patientId: currentUserId,
                    status: { [Op.ne]: 'Cancelled' } // Csak az aktív foglalás számít
                }
            });
            if (existingConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'Ekkor már van egy másik lefoglalt időpontod! Nem lehetsz két helyen egyszerre.'
                });
            }

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