import db from '../models/modrels.js';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const { Staff, User, Consultation, Slot } = db;

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  let totalMinutes = h * 60 + m + mins;

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`; 
}

const StaffController = {
    // Admin lista 
    async index(req, res) {
        try {
            const staff = await Staff.findAll({
                include: [
                    { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                    { model: Consultation, as: 'treatments', through: { attributes: [] } }
                ]
            });
            return res.json({ success: true, data: staff });
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                message: 'STAFF.MESSAGES.RESTORE_ERROR', 
                error: error.message 
            });
        }
    },

    // Kísérleti index (Kezelésekkel együtt, mélyebb asszociációval)
    async tryIndex(req, res) {
        try {
            const staff = await Staff.findAll({
                attributes: ['id', 'specialty'],
                include: [
                    { model: User, as: 'user', attributes: ['name'] },
                    {
                        model: Consultation,
                        as: 'treatments',
                        attributes: ['id', 'name'],
                        through: { attributes: [] }
                    }
                ]
            });
            return res.status(200).json({ success: true, data: staff });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // Publikus profilok (Csak az aktívak a pácienseknek)
    async getPublicProfiles(req, res) {
        try {
            const staff = await Staff.findAll({
                where: { isActive: true },
                include: [
                    { model: User, as: 'user', attributes: ['name'] },
                    { 
                        model: Consultation, 
                        as: 'treatments', 
                        through: { attributes: [] } 
                    }
                ]
            });
            return res.json({ success: true, data: staff });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'COMMON.ERROR_GENERAL' });
        }
    },

    // Egy konkrét szakember adatlapja
    async show(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id, {
                include: [{ model: User, as: 'user' }]
            });
            if (!staff) {
                return res.status(404).json({ success: false, message: 'USERS.MESSAGES.PROFILE_NOT_FOUND' });
            }
            return res.json({ success: true, data: staff });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // Szakemberhez tartozó kezelések lekérése
    async getTreatmentsForStaff(req, res) {
        try {
            const { id } = req.params;
            const staff = await Staff.findByPk(id, {
                include: [{ model: Consultation, as: 'treatments', through: { attributes: [] } }]
            });
            if (!staff) return res.status(404).json({ success: false, message: 'STAFF.MESSAGES.INVALID_ID' });
            return res.json({ success: true, data: staff.treatments || [] });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'SERVICES.MESSAGES.TREATMENTS_LOAD_ERROR' });
        }
    },

    // Kezelések hozzárendelése (M:N kapcsolat frissítése)
    async assignTreatments(req, res) {
        try {
            const { id } = req.params; // userId jön az URL-ből
            const { treatmentIds } = req.body;
            const staff = await Staff.findOne({ where: { userId: id } });
            
            if (!staff) return res.status(404).json({ success: false, message: 'STAFF.MESSAGES.INVALID_ID' });
            
            await staff.setTreatments(treatmentIds);
            return res.json({ success: true, message: 'STAFF.MESSAGES.ASSIGN_SUCCESS' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'STAFF.MESSAGES.ASSIGN_ERROR' });
        }
    },

    // Felhasználó előléptetése szakemberré
    async promoteToStaff(req, res) {
        try {
            const { userId, specialty } = req.body;
            const newStaff = await Staff.create({ 
                userId, 
                specialty: specialty || 'General', 
                isActive: true 
            });
            return res.json({ success: true, message: 'COMMON.SUCCESS', data: newStaff });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // Új szakember létrehozása (User + Staff egyben)
    async store(req, res) {
        const t = await db.sequelize.transaction();
        try {
            const { name, email, password, specialty, bio, roleId } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password || 'doctor123', salt);

            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
                roleId: roleId || 1,
                }, { transaction: t });

            const staff = await Staff.create({
                userId: newUser.id,
                specialty: specialty || 'GENERAL',
                bio: bio || '',
                isActive: true
                }, { transaction: t });
            
            if (treatmentIds && Array.isArray(treatmentIds)) {
                await staff.setTreatments(treatmentIds, { transaction: t });
            }
            await t.commit();
            return res.status(201).json({
                success: true,
                message: 'STAFF.MESSAGES.ADD_SUCCESS',
                data: { id: staff.id, userId: newUser.id, specialty: staff.specialty, bio: staff.bio }
            });


        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({ success: false, message: 'MESSAGES.AUTH.EMAIL_ALREADY_TAKEN' });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // Összetett frissítés (User és Staff adatok egyszerre)
    async update(req, res) {
        const t = await db.sequelize.transaction();

        try {
            const { id } = req.params; // userId
            const { name, email, specialty, bio, isActive, isAvailable, roleId, password, treatmentIds } = req.body;

            const userUpdateData = { 
            name, 
            email, 
            roleId: roleId ? Number(roleId) : 1 
        };
            if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            userUpdateData.password = await bcrypt.hash(password, salt);
        }

            // User tábla frissítése
            await User.update(userUpdateData, { where: { id: id }, transaction: t });

            let staff = await Staff.findOne({ where: { userId: id }, transaction: t });

            if (staff) {
                await staff.update({
                        specialty, 
                        bio, 
                        isActive: isActive ?? staff.isActive,
                        isAvailable: isAvailable ?? staff.isAvailable
                    }, { transaction: t });
                } else {
                    staff = await Staff.create({ 
                        userId: id, 
                        specialty, 
                        bio, 
                        isActive: isActive ?? true, 
                        isAvailable: isAvailable ?? true 
                    }, { transaction: t });
                }
                if (treatmentIds && Array.isArray(treatmentIds)) {
                    await staff.setTreatments(treatmentIds, { transaction: t });
                } 
                await t.commit();
            
                return res.json({ success: true, message: "STAFF.MESSAGES.UPDATE_SUCCESS" });

            } catch (error) {
                if (t) await t.rollback();
                console.error("Update error:", error);
                return res.status(500).json({ success: false, message: 'COMMON.ERROR_GENERAL' });
            }
        },

    async generateSlots(req, res) {
        try {
            const { staffId, startDate, endDate, startTime, endTime, interval, consultationId} = req.body;
            const duration = Number(interval || 30);
            const slots = [];

            const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
            const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
        
            let current = new Date(sYear, sMonth - 1, sDay);
            const endLimit = new Date(eYear, eMonth - 1, eDay );
            console.log(`Generálás indítása: ${current.toDateString()} -> ${endLimit.toDateString()}`);
            try {
                await db.sequelize.query(`
                    INSERT OR IGNORE INTO staff_consult (staffId, consultationId, createdAt, updatedAt)
                    VALUES (${staffId}, ${consultationId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `);
            } catch (e) {
                console.log("Kapcsolat már létezik vagy tábla hiányzik, haladunk tovább...");
            }

            while (current <= endLimit) {
                if (current.getDay() !== 0 && current.getDay() !== 6) {
                    let slotTime = startTime;
                    
                    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                    
                    while (slotTime < endTime) {
                        slots.push({
                            staffId: Number(staffId),
                            consultationId: Number(consultationId),
                            date: dateStr,
                            startTime: slotTime.length === 5 ? `${slotTime}:00` : slotTime, 
                            isAvailable: true,
                            createdAt: new Date(),
                            updatedAt: new Date()  
                        });
                        slotTime = addMinutes(slotTime, duration);
                    }
                }
                current.setDate(current.getDate() + 1);
            }
            if (slots.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Nem jött létre egyetlen idősáv sem. Ellenőrizze a dátumokat!" 
                });
            }
            await Slot.bulkCreate(slots, { ignoreDuplicates: true });

            return res.json({ success: true, message: 'STAFF.MESSAGES.SLOTS_GENERATED', count: slots.length });
        
        } catch (error) {
            console.error("GENERÁLÁSI HIBA RÉSZLETEI:", error);
            return res.status(500).json({ success: false, message: 'STAFF.MESSAGES.SLOTS_ERROR' });
        }
    },

    // Fizikai törlés
    async destroy(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id);
            if (!staff) {
                return res.status(404).json({ success: false, message: 'STAFF.MESSAGES.INVALID_ID' });
            }
            await staff.destroy();
            return res.json({ success: true, message: 'SERVICES.MESSAGES.DELETE_SUCCESS' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // Státusz kezelés (Aktiválás/Archiválás)
    async updateStatus(req, res) {
        try {
            const { id } = req.params; // userId
            const { isActive } = req.body;

            const staffProfile = await Staff.findOne({ where: { userId: id } });

            if (!staffProfile) {
                return res.status(404).json({ success: false, message: 'STAFF.MESSAGES.INVALID_ID' });
            }

            staffProfile.isActive = isActive;
            await staffProfile.save();

            return res.json({
                success: true,
                message: isActive ? 'STAFF.MESSAGES.RESTORE_SUCCESS' : 'USERS.MESSAGES.ARCHIVE_SUCCESS',
                data: staffProfile
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default StaffController;