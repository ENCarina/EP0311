import { BookingService } from '../services/bookingService.js';
import db from '../models/modrels.js'; 
import { Op } from 'sequelize';
import { EmailService } from '../services/emailService.js';

const BookingController = {
    // 1. Összes foglalás listázása (Szerepkör alapú szűréssel)
    async index(req, res) {
        try {
            let whereCondition = {};
            const roleId = Number(req.user.roleId); 
            const currentUserId = req.user.id;

            // Szűrési logika: Páciens csak a sajátját, Szakember a hozzárendeltet, Admin mindet
            if (roleId === 1) { // STAFF
                const staff = await db.Staff.findOne({ where: { userId: currentUserId } });
                whereCondition = { staffId: staff ? staff.id : null };
            } else if (roleId === 0) { // PATIENT
                whereCondition = { patientId: currentUserId };
            } else if (roleId === 2) { // ADMIN
                whereCondition = {};
            }

            const bookings = await db.Booking.findAll({
                where: whereCondition,
                include: [
                    { 
                        model: db.User, 
                        as: 'patient', 
                        attributes: ['id', 'name', 'email'] 
                    },
                    { 
                        model: db.Staff, 
                        as: 'doctor', 
                        attributes: ['id', 'specialty'], 
                        include: [{ model: db.User, as: 'user', attributes: ['name'] }] 
                    },
                    { 
                        model: db.Slot, 
                        as: 'timeSlot',
                        required: false, 
                        attributes: ['id', 'date', 'startTime', 'endTime'] 
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
            console.error('Hiba az index lekérésnél:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'BOOKING.ERROR_LOAD', 
                error: error.message 
            });
        }
    },

    // 2. Egy konkrét foglalás megtekintése
    async show(req, res) {
        try {
            const booking = await db.Booking.findByPk(req.params.id, {
                include: [
                    { model: db.User, as: 'patient', attributes: ['id', 'name', 'email'] },
                    { 
                        model: db.Staff, as: 'doctor', 
                        include: [{ model: db.User, as: 'user', attributes: ['name'] }] 
                    },
                    { model: db.Slot, as: 'timeSlot' },
                    { model: db.Consultation, as: 'treatment' }
                ]
            });
            
            if (!booking) {
                return res.status(404).json({ success: false, message: 'BOOKING.NOT_FOUND' });
            }

            return res.status(200).json({ success: true, data: booking });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'BOOKING.ERROR_LOAD',
                error: error.message
            });
        }
    },

    // 3. Új foglalás létrehozása (Conflict check-el)
    async store(req, res) {
        try {
            const currentUserId = req.user?.id || req.userId;
            if (!currentUserId) {
                return res.status(401).json({ success: false, message: 'AUTH.INVALID_CREDENTIALS' });
            }
           
            const user = await db.User.findByPk(currentUserId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'USERS.MESSAGES.PROFILE_NOT_FOUND' });
            }

            const selectedSlot = await db.Slot.findByPk(req.body.slotId);
            if (!selectedSlot) {
                return res.status(400).json({ success: false, message: 'BOOKING.NO_SLOTS_TITLE' });
            }

            // Ütközésvizsgálat: ne legyen ugyanarra az időpontra más aktív foglalása a páciensnek
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
                    status: { [Op.ne]: 'Cancelled' }
                }
            });

            if (existingConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'BOOKING.CONFLICT'
                });
            }

            const bookingData = {
                ...req.body,
                patientId: currentUserId,
                status: req.body.status || 'Confirmed'
            };

            // Itt hívjuk meg a Service-t a tényleges mentéshez
            const lang = req.headers['accept-language'] || 'hu';
            const newBooking = await BookingService.createBooking(bookingData, user, lang);

            await db.Slot.update(
                { isAvailable: false }, 
                { where: { id: req.body.slotId } }
            );

            return res.status(201).json({
                success: true,
                message: 'BOOKING.SUCCESS_MSG',
                data: newBooking
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'BOOKING.ERROR_MSG',
                error: error.message
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
                return res.status(404).json({ success: false, message: 'BOOKING.NOT_FOUND' });
            }
            
            const booking = await db.Booking.findByPk(req.params.id);
            return res.status(200).json({ 
                success: true, 
                message: 'COMMON.SUCCESS', 
                data: booking 
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'SERVICES.MESSAGES.UPDATE_SUCCESS', // vagy BOOKING.ERROR_MSG
                error: error.message
            });
        }
    },

    // 5. Foglalás törlése (Tranzakcióval és 24h szabály ellenőrzéssel)
    async destroy(req, res) {
        const t = await db.sequelize.transaction();
        try {
            const { id } = req.params;
            const forceDelete = req.query.force === 'true'; // ?force=true a végleges törléshez

            const booking = await db.Booking.findByPk(id, {
                include: [{ 
                    model: db.Slot, 
                    as: 'timeSlot' 
                }],
                transaction: t
            });

            // 1. Létezés ellenőrzése
            if (!booking) {
                await t.rollback();
                return res.status(404).json({ success: false, message: "BOOKING.NOT_FOUND" });
            }

            const requesterRoleId = Number(req.user.roleId);
            const isAdmin = requesterRoleId === 2;

            // 2. Jogosultság ellenőrzése
            if (!isAdmin && booking.patientId != req.user.id) {
                await t.rollback();
                return res.status(403).json({ success: false, message: "BOOKING.UNAUTHORIZED" });
            }

            // 3. 24 ÓRÁS SZABÁLY (Csak páciensre vonatkozik!)
            if (!isAdmin && booking.timeSlot && booking.status !== 'cancelled') {
                const now = new Date();
                // Időpont összeállítása (Dátum + Kezdési idő)
                const appointmentDate = new Date(`${booking.timeSlot.date}T${booking.timeSlot.startTime}`);
                
                if (!isNaN(appointmentDate.getTime())) {
                    const diffInHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                    
                    // Ha kevesebb mint 24 óra van hátra, a páciens nem mondhatja le
                    if (diffInHours < 24 && diffInHours > 0) {
                        await t.rollback();
                        return res.status(403).json({ 
                            success: false, 
                            message: "BOOKING.CANNOT_CANCEL_WITHIN_24H" 
                        });
                    }
                }
            }

            // 4. Slot felszabadítása (isAvailable = true)
            if (booking.slotId) {
                await db.Slot.update(
                    { isAvailable: true },
                    { where: { id: booking.slotId }, transaction: t }
                );
            }

            // 5. Törlés vagy Státuszváltás
            if (isAdmin && forceDelete) {
                // Admin kérésére végleges törlés (pl. tesztadat takarítás)
                await booking.destroy({ transaction: t });
            } else {
                // Normál üzemmód: Soft Delete (Lemondott állapot)
                await booking.update({ 
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancelledBy: req.user.id
                }, { transaction: t });
            }

            await t.commit();
            
            return res.status(200).json({ 
                success: true, 
                message: isAdmin ? "BOOKING.ADMIN_CANCEL_SUCCESS" : "BOOKING.CANCEL_SUCCESS" 
            });

        } catch (error) {
            if (t) await t.rollback();
            console.error("Cancellation error:", error);
            return res.status(500).json({ success: false, message: "BOOKING.SERVER_ERROR" });
        }
    }
};


export default BookingController;