import { Op } from 'sequelize';
import db from '../models/modrels.js';
import log from '../utils/logger.js'; 
import Slot from '../models/slot.js';

const SlotController = {
  // Egységesített válaszkezelés a hibákhoz 
  sendError(res, error) {
    log(`API ERROR: ${error.message}`);
    const isNotFound = error.message === 'Fail! Record not found!';
        
    return res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: isNotFound ? 'COMMON.NOT_FOUND' : 'COMMON.ERROR_GENERAL',
      error: error.message
    });
  },

  async bulkGenerate(req, res) {
    let transaction;
    try {
      const { staffId, consultationId, startDate, endDate, startTime, endTime, interval } = req.body;
            
      // Transaction indítása
      transaction = await db.sequelize.transaction();

      const requester = req.user;
      const targetStaffId = Number(staffId);
      const requesterStaffId = requester.staffId ? Number(requester.staffId) : null;
      const roleId = Number(requester.roleId);

      // 1. AUTHORIZATION CHECK (Admin or Self only)
      const isAdmin = roleId === 2;
      const isOwnProfile = roleId === 1 && requesterStaffId === targetStaffId;

      if (!isAdmin && !isOwnProfile) {
        return res.status(403).json({ 
          success: false, 
          message: 'AUTH.ERROR.UNAUTHORIZED' 
        });
      }

      const slotsToCreate = [];
      let current = new Date(startDate);
      const last = new Date(endDate);

      current.setHours(0, 0, 0, 0);
      last.setHours(0, 0, 0, 0);

      // 2. MAIN GENERATION LOOP
      while (current <= last) {
        const dayOfWeek = current.getDay();
                
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
          const dateStr = current.toLocaleDateString('sv-SE');

          // SMART DUPLICATION CHECK
          const existingCount = await db.Slot.count({ 
            where: { staffId: targetStaffId, date: dateStr },
            transaction 
          });

          if (existingCount === 0) {
            let [startH, startM] = startTime.split(':').map(Number);
            let [endH, endM] = endTime.split(':').map(Number);
                        
            let currentTime = new Date(current);
            currentTime.setHours(startH, startM, 0, 0);
                        
            let finishTime = new Date(current);
            finishTime.setHours(endH, endM, 0, 0);

            const slotDuration = Number(interval) || 30;

            while (currentTime < finishTime) {
              const nextTime = new Date(currentTime);
              nextTime.setMinutes(nextTime.getMinutes() + slotDuration);

              if (nextTime <= finishTime) {
                slotsToCreate.push({
                  staffId: targetStaffId,
                  consultationId: consultationId ? Number(consultationId) : null,
                  date: dateStr,
                  startTime: currentTime.toTimeString().split(' ')[0].substring(0, 5),
                  endTime: nextTime.toTimeString().split(' ')[0].substring(0, 5),
                  isAvailable: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
              }
              currentTime = new Date(nextTime);
            }
          }
        }
        current.setDate(current.getDate() + 1);
      }

      if (slotsToCreate.length === 0) {
        if (transaction) await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'STAFF.MESSAGES.NO_SLOTS_GENERATED' 
        });
      }

      const createdSlots = await Slot.bulkCreate(slotsToCreate, { 
        transaction,
        ignoreDuplicates: true 
      });

      await transaction.commit();

      return res.status(201).json({ 
        success: true, 
        message: 'COMMON.MESSAGES.SUCCESS',
        count: createdSlots.length 
      });

    } catch (error) {
      if (transaction) await transaction.rollback();
      log(`BULK_GENERATE ERROR: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'COMMON.ERROR.SERVER_ERROR',
        error: error.message 
      });
    }
  },

  async index(req, res) {
    try {
      const { staffId, startDate, endDate } = req.query;
      const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

      const whereClause = { isAvailable: true };

      if (startDate && endDate) {
        whereClause.date = { [Op.between]: [startDate, endDate] };
      } else {
        whereClause.date = { [Op.gte]: todayStr };
      }

      if (staffId && staffId !== 'null' && staffId !== 'undefined') {
        whereClause.staffId = Number(staffId);
      }

      const slots = await db.Slot.findAll({
        where: whereClause,
        order: [['date', 'ASC'], ['startTime', 'ASC']],
      });
            
      return res.status(200).json({ success: true, count: slots.length, data: slots });
    } catch (error) {
      return SlotController.sendError(res, error);
    }
  },

  async show(req, res) {
    try {
      const slot = await db.Slot.findByPk(req.params.id);
      if (!slot) throw new Error('Fail! Record not found!');
      return res.status(200).json({ success: true, data: slot });
    } catch (error) {
      return SlotController.sendError(res, error);
    }
  },

  async store(req, res) {
    try {
      const { date, staffId } = req.body;
      const requester = req.user;

      if (requester.roleId !== 2) {
        if (!requester.staffId || Number(requester.staffId) !== Number(staffId)) {
          return res.status(403).json({ success: false, message: 'AUTH.ERROR.UNAUTHORIZED' });
        }
      }

      if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
        return res.status(400).json({ success: false, message: 'COMMON.ATTENTION' });
      }

      const slot = await db.Slot.create(req.body);
      return res.status(201).json({ success: true, message: 'COMMON.SUCCESS', data: slot });
    } catch (error) {
      return SlotController.sendError(res, error);
    }
  },

  async update(req, res) {
    try {
      const [updatedRows] = await db.Slot.update(req.body, { where: { id: req.params.id } });
      if (updatedRows === 0) throw new Error('Fail! Record not found!');
      const updatedSlot = await db.Slot.findByPk(req.params.id);
      return res.status(200).json({ success: true, message: 'SERVICES.MESSAGES.UPDATE_SUCCESS', data: updatedSlot });
    } catch (error) {
      return SlotController.sendError(res, error);
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await db.Slot.destroy({ where: { id: req.params.id } });
      if (!deleted) throw new Error('Fail! Record not found!');
      return res.status(200).json({ success: true, message: 'SERVICES.MESSAGES.DELETE_SUCCESS' });
    } catch (error) {
      return SlotController.sendError(res, error);
    }
  }
};

export default SlotController;