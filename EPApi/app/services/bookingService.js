import db from '../models/modrels.js';
import { EmailService } from './emailService.js';

export const BookingService = {

    async createBooking(bookingData, user) {
        let t;
        try {
            t = await db.sequelize.transaction();

            let patientId = bookingData.patientId || (user ? user.id : null);
            let bookingStaffId = Number(bookingData.staffId);

            if (user?.roleId === 0) {
                patientId = user.id;
            }

            if (user?.roleId === 1) {
                const ownStaffProfile = await db.Staff.findOne({
                    where: { userId: user.id },
                    transaction: t
                });

                if (!ownStaffProfile) {
                    throw new Error('Az orvos profil nem található!');
                }

                if (!patientId) {
                    throw new Error('Páciens kiválasztása kötelező!');
                }

                bookingStaffId = ownStaffProfile.id;
            }

            const patient = patientId
                ? await db.User.findByPk(patientId, { transaction: t })
                : null;

            if (!patient || patient.roleId !== 0 || patient.isActive === false) {
                throw new Error('A kiválasztott páciens nem foglalható!');
            }

            const slot = await db.Slot.findByPk(bookingData.slotId, { transaction: t });

            if (!slot) {
                throw new Error('A választott időpont nem található!');
            }
            if (!slot.isAvailable) {
                throw new Error('Ez az időpont már foglalt!');
            }

            if (bookingStaffId && Number(slot.staffId) !== Number(bookingStaffId)) {
                throw new Error('A kiválasztott időpont nem ehhez a szakemberhez tartozik!');
            }

            const newBooking = await db.Booking.create({
                ...bookingData,
                patientId,
                staffId: Number(slot.staffId),
                startTime: bookingData.startTime || slot.startTime,
                date: bookingData.date || slot.date,
                duration: bookingData.duration || slot.duration || 30,
                status: 'Confirmed'
            }, { transaction: t });

            await slot.update({ isAvailable: false }, { transaction: t });

            await t.commit();

            const emailData = {
                ...newBooking.get({ plain: true }),
                name: bookingData.name || 'Orvosi vizsgálat'
            };

            const dateVal = slot.date;
            const timeVal = slot.startTime || slot.StartTime;

            if (dateVal && timeVal) {
                emailData.appointment_date = `${dateVal} ${timeVal}`;
            } else {
                emailData.appointment_date = "Időpont visszaigazolás alatt";
            }

            const confirmationEmail = patient?.email || user?.email;

            if (EmailService && confirmationEmail) {
                EmailService.sendBookingConfirmation(confirmationEmail, emailData).catch(err => {
                    console.error('E-mail hiba:', err);
                });
            }

            return newBooking;

        } catch (error) {
            if (t) await t.rollback();
            throw error;
        }
    },

    async getAvailableSlots(staffId, date) {
        return await db.Slot.findAll({
            where: {
                staffId: Number(staffId),
                date: date,
                isAvailable: true
            },
            order: [['startTime', 'ASC']]
        });
    },

    async cancelBooking(bookingId, userId) {
        const t = await db.sequelize.transaction();
        try {
            const booking = await db.Booking.findByPk(bookingId, { transaction: t });

            if (!booking) throw new Error('Foglalás nem található!');
            if (booking.patientId !== userId) throw new Error('Nincs jogosultságod a lemondáshoz!');

            const slot = await db.Slot.findByPk(booking.slotId, { transaction: t });
            
            if (slot) {
                const now = new Date();
                const bookingFullDate = new Date(`${slot.date} ${slot.startTime}`);
                const hoursDiff = (bookingFullDate - now) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    throw new Error('24 órán belüli lemondás csak telefonon lehetséges!');
                }

                await slot.update({ isAvailable: true }, { transaction: t });
            }

            await booking.destroy({ transaction: t });

            await t.commit();
            return { message: 'Sikeres lemondás' };

        } catch (error) {
            if (t) await t.rollback();
            throw error;
        }
    }
};
