import { BookingService } from '../services/bookingService.js';
import db from '../models/modrels.js'; 
import {Op} from 'sequelize';
import { EmailService } from '../services/emailService.js';

const MANAGEABLE_STATUSES = new Set(['Confirmed', 'Cancelled', 'Completed']);

async function getDoctorStaffIdForUser(userId, transaction) {
    const staff = await db.Staff.findOne({ where: { userId }, transaction });
    return staff ? Number(staff.id) : null;
}

async function canManageBooking(user, booking, transaction) {
    if (!user || !booking) {
        return false;
    }

    if (user.roleId === 2) {
        return true;
    }

    if (user.roleId === 1) {
        const staffId = await getDoctorStaffIdForUser(user.id, transaction);
        return staffId !== null && Number(booking.staffId) === staffId;
    }

    return false;
}

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

            const targetPatientId = req.user.roleId === 1
                ? Number(req.body.patientId)
                : currentUserId;

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
                    patientId: targetPatientId,
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
                patientId: targetPatientId,
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
            const currentUserId = req.user?.id || req.userId;

            if (!currentUserId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const currentUser = await db.User.findByPk(currentUserId);
            if (!currentUser || currentUser.roleId < 1) {
                return res.status(403).json({ success: false, message: 'Nincs jogosultságod a foglalás kezeléséhez!' });
            }

            const nextStatus = req.body?.status;
            if (!nextStatus || !MANAGEABLE_STATUSES.has(nextStatus)) {
                return res.status(400).json({ success: false, message: 'Érvénytelen vagy hiányzó státusz!' });
            }

            const transaction = await db.sequelize.transaction();

            try {
                const booking = await db.Booking.findByPk(req.params.id, { transaction });

                if (!booking) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, message: 'Foglalás nem található!' });
                }

                const authorized = await canManageBooking(currentUser, booking, transaction);
                if (!authorized) {
                    await transaction.rollback();
                    return res.status(403).json({ success: false, message: 'Nincs jogosultságod ehhez a foglaláshoz!' });
                }

                const slot = await db.Slot.findByPk(booking.slotId, { transaction });
                const previousStatus = booking.status;

                if (slot) {
                    if (previousStatus !== 'Cancelled' && nextStatus === 'Cancelled') {
                        await slot.update({ isAvailable: true }, { transaction });
                    }

                    if (previousStatus === 'Cancelled' && nextStatus !== 'Cancelled') {
                        if (!slot.isAvailable) {
                            throw new Error('A foglalás nem állítható vissza, mert az időpont már foglalt.');
                        }

                        await slot.update({ isAvailable: false }, { transaction });
                    }
                }

                await booking.update({ status: nextStatus }, { transaction });
                await transaction.commit();

                return res.status(200).json({ success: true, data: booking });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Hiba a frissítés során!',
                error: error.message
            });
        }
    },

    // 5. Foglalás törlése (24 órás szabály a pácienseknél)
    async destroy(req, res) {
        try {
            const currentUserId = req.user?.id || req.userId;
            const currentUserRole = req.user?.roleId;

            if (!currentUserId) {
                return res.status(401).json({ success: false, error: 'User not authenticated' });
            }

            if (currentUserRole === 2) {
                const transaction = await db.sequelize.transaction();
                try {
                    const booking = await db.Booking.findByPk(req.params.id, { transaction });
                    if (!booking) {
                        throw new Error('Foglalás nem található!');
                    }

                    await db.Slot.update(
                        { isAvailable: true },
                        { where: { id: booking.slotId }, transaction }
                    );

                    await booking.destroy({ transaction });
                    await transaction.commit();

                    return res.status(200).json({
                        success: true,
                        message: 'Foglalás sikeresen törölve.'
                    });
                } catch (error) {
                    await transaction.rollback();
                    throw error;
                }
            }

            if (currentUserRole === 1) {
                return res.status(403).json({
                    success: false,
                    error: 'Az orvosi felületen a foglalást státuszváltással kezeld, végleges törléshez admin jogosultság kell.'
                });
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