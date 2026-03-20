import db from '../models/modrels.js';
import { EmailService } from './emailService.js';

export const BookingService = {

    async createBooking(bookingData, user) {
        let t;
        try {
            t = await db.sequelize.transaction();

            const slot = await db.Slot.findByPk(bookingData.slotId, { transaction: t });

            if (!slot) {
                throw new Error('A választott időpont nem található!');
            }
            if (!slot.isAvailable) {
                throw new Error('Ez az időpont már foglalt!');
            }

            const newBooking = await db.Booking.create({
                ...bookingData,
                patientId: bookingData.patientId || (user ? user.id : null),
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

            if (EmailService && user?.email) {
                EmailService.sendBookingConfirmation(user.email, emailData).catch(err => {
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
