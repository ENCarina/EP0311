import db from '../models/modrels.js';
import { EmailService } from './emailService.js';
import log from '../utils/logger.js';

export const BookingService = {
  async getUserBookings(userId) {
    return await db.Booking.findAll({
      where: { patientId: userId },
      include: [{
        model: db.Slot,
        as: 'timeSlot' 
      }],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
  },

  async createBooking(bookingData, user , lang = 'hu') {
    let t;
    try {
      t = await db.sequelize.transaction();

      const slot = await db.Slot.findByPk(bookingData.slotId, { transaction: t });

      if (!slot) {
        throw new Error('SLOTS.MESSAGES.NOT_FOUND');
      }
      if (!slot.isAvailable) {
        throw new Error('BOOKING.CONFLICT');
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

      if (EmailService && user?.email) {
        const emailData = {
          name: bookingData.treatmentName || 'Medical Appointment',
          appointment_date: `${slot.date} ${slot.startTime}`,
          price: bookingData.price,
          notes: bookingData.notes
        };
            
        EmailService.sendBookingConfirmation(user.email, emailData, lang).catch(err => {
          log(`ERROR - Booking email failed: ${err.message}`);
        });
      }

      return newBooking;

    } catch (error) {
      if (t) await t.rollback();
      log(`ERROR - Booking creation failed: ${error.message}`);
      throw error;
    }
  },

  async getAvailableSlots(staffId, date) {
    try {
      const slots = await db.Slot.findAll({
        where: {
          staffId: Number(staffId), 
          date: date,              
          isAvailable: true       
        },
        order: [['startTime', 'ASC']] 
      });

      if (!slots || slots.length === 0) {
        log(`INFO - No available slots for Staff: ${staffId} on Date: ${date}`);
      }

      return slots;
    } catch (error) {
      log(`ERROR - getAvailableSlots: ${error.message}`);
      throw new Error('SLOTS.MESSAGES.LOAD_ERROR', { cause: error });
    }
  },

  async cancelBooking(bookingId, userId, userRole) {
    const t = await db.sequelize.transaction();
    try {
      const booking = await db.Booking.findByPk(bookingId, { transaction: t });

      if (!booking) throw new Error('BOOKING.NOT_FOUND');
      const isAdmin = userRole === 2;
            
      if (booking.patientId !== userId && !isAdmin) throw new Error('BOOKING.UNAUTHORIZED');
            
      const slot = await db.Slot.findByPk(booking.slotId, { transaction: t });
            
      if (slot) {
        const now = new Date();
        const bookingFullDate = new Date(`${slot.date}T${slot.startTime}`);
        const hoursDiff = (bookingFullDate - now) / (1000 * 60 * 60);

        if (!isAdmin && hoursDiff < 24) {
          throw new Error('BOOKING.CANNOT_CANCEL_WITHIN_24H');
        }

        await slot.update({ isAvailable: true }, { transaction: t });
      }

      await booking.destroy({ transaction: t });

      await t.commit();
      return { message: 'BOOKING.DELETE_SUCCESS' };

    } catch (error) {
      if (t) await t.rollback();
      log(`ERROR - Booking cancellation failed: ${error.message}`);
      throw error;
    }
  }
};
