import db from '../models/modrels.js';
import { EmailService } from './emailService.js';

function bookingError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

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
                    throw bookingError('Az orvos profil nem található!', 'DOCTOR_PROFILE_NOT_FOUND');
                }

                if (!patientId) {
                    throw bookingError('Páciens kiválasztása kötelező!', 'PATIENT_REQUIRED');
                }

                bookingStaffId = Number(ownStaffProfile.id);
            }

            const patient = patientId
                ? await db.User.findByPk(patientId, { transaction: t })
                : null;

            if (!patient || patient.roleId !== 0) {
                throw bookingError('A kiválasztott páciens nem foglalható!', 'PATIENT_NOT_BOOKABLE');
            }

            const slot = await db.Slot.findByPk(bookingData.slotId, { transaction: t });

            if (!slot) {
                throw bookingError('A választott időpont nem található!', 'SLOT_NOT_FOUND');
            }
            if (!slot.isAvailable) {
                throw bookingError('Ez az időpont már foglalt!', 'SLOT_UNAVAILABLE');
            }

            if (bookingStaffId && Number(slot.staffId) !== Number(bookingStaffId)) {
                if (user?.roleId === 1) {
                    throw bookingError('Orvosként nincs jogosultságod más szakemberhez időpontot foglalni páciensnek. Erre csak az admin jogosult.', 'DOCTOR_CANNOT_BOOK_OTHER_STAFF');
                }

                throw bookingError('A kiválasztott időpont nem ehhez a szakemberhez tartozik!', 'SLOT_STAFF_MISMATCH');
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
