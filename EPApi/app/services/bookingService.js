import db from '../models/modrels.js';
import { EmailService } from './emailService.js';  

export const BookingService = {
    
    // 1. Új foglalás létrehozása
    async createBooking(bookingData, user) {
        let t;
        try {
            t = await db.sequelize.transaction();  

            const slot = await db.Slot.findByPk(bookingData.slotId, { transaction: t });

            if (!slot || !slot.isAvailable) {
                throw new Error('Ez az időpont már foglalt!');
            }   

        const newBooking = await db.Booking.create({
            ...bookingData,
            patientId:user.id, 
            status: 'Confirmed'
        }, { transaction: t});

        await slot.update({ isAvailable: false }, { transaction: t });  // Slot lefoglalása
        await t.commit(); // Ha minden OK, mentés az adatbázisba

        console.log('DEBUG: EmailService típusa:', typeof EmailService);
        if (typeof EmailService !== 'undefined') {
            await EmailService.sendBookingConfirmation(user.email, newBooking).catch(err => {
                console.error('E-mail küldési hiba:', err);
            });
        } else {
            console.error('HIBA: Az EmailService nem lett importálva!');
        }

        // E-mail küldés
        await EmailService.sendBookingConfirmation(user.email, newBooking).catch(err => {
            console.error('E-mail küldési hiba:', err);
        });

        return newBooking;

    } catch (error) {
        if (t) await t.rollback();
        throw error;
        }
    },
    // 2. Szabad időpontok keresése
    async getAvailableSlots(staffId, date) {
        return await db.Slot.findAll({
            where: { 
                staffId: Number(staffId),
                startTime: {
                    [db.sequelize.Op.like]: `${date}%` 
                },
                isAvailable: true 
            },
            order: [['startTime', 'ASC']]   
        });
    },

    // 3. Foglalás lemondása speciális szabályokkal
    async cancelBooking(bookingId, userId) {
        const t = await db.sequelize.transaction();
        try {
            const booking = await db.Booking.findByPk(bookingId);
        
            if (!booking) throw new Error('Foglalás nem található!');
            if (booking.patientId !== userId) throw new Error('Nincs jogosultságod a lemondáshoz!');

        // 24 órán belül már nem mondható le online
        const now = new Date(); // 24 órás szabály ellenőrzése
        const slot = await db.Slot.findByPk(booking.slotId, { transaction: t });
        const bookingDate = new Date(slot.startTime);
        const hoursDiff = (bookingDate - now) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            throw new Error('24 órán belüli lemondás csak telefonon lehetséges!');
        }
        // Slot felszabadítása
            if (slot) {
                await slot.update({ isAvailable: true }, { transaction: t });
            }

            // Foglalás törlése (vagy státusz állítása 'Cancelled'-re)
            await booking.destroy({ transaction: t });

            await t.commit();
            return { message: 'Sikeres lemondás' };

        } catch (error) {
            if (t) await t.rollback();
            throw error;
        }
    }
}
