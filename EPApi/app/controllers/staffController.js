import db from '../models/modrels.js';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const { Staff, User, Consultation, Slot } = db;

const SPECIALTY_MAP = {
    'Kardiológus': 'Kardiológia',
    'Fogorvos': 'Fogászat',
    'Pszichiáter': 'Pszichiátria',
    'Szemész': 'Szemészet',
    'Nőgyógyász': 'Nőgyógyászat',
    'Bőrgyógyász': 'Bőrgyógyászat',
    'Neurológus': 'Neurológia',
    'Ortopéd': 'Ortopédia',
    'Ortopéd szakorvos': 'Ortopédia',
    'Urológus': 'Urológia',
    'Endokrinológus': 'Endokrinológia',
    'Pulmonológus': 'Pulmonológia',
    'Fül-orr-gégész': 'Fül-orr-gégészet',
    'Gasztroenterológus': 'Gasztroenterológia',
    'Reumatológus': 'Reumatológia',
    'Diabetológus': 'Diabetológia'
};

const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 21;
const SLOT_DURATION_MINUTES = 30;

function normalizeTreatmentIds(treatmentIds) {
    if (!Array.isArray(treatmentIds)) {
        return [];
    }

    return [...new Set(
        treatmentIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
    )];
}

async function resolveTreatmentIdsForSpecialty(specialty, transaction) {
    const specialtyName = SPECIALTY_MAP[specialty] || specialty;
    const consultations = await Consultation.findAll({
        attributes: ['id', 'specialty'],
        transaction
    });

    const specialtyIds = consultations
        .filter((consultation) => consultation.specialty === specialtyName)
        .map((consultation) => Number(consultation.id));

    const generalIds = consultations
        .filter((consultation) => consultation.specialty === 'Általános')
        .map((consultation) => Number(consultation.id));

    return [...new Set([...specialtyIds, ...generalIds])];
}

function getDaysToEndOfAugust() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfAugust = new Date(today.getFullYear(), 7, 31);
    if (today > endOfAugust) {
        endOfAugust.setFullYear(endOfAugust.getFullYear() + 1);
    }

    const diffMs = endOfAugust.getTime() - today.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

function toDateOnly(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function toTime(hours, minutes) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

async function ensureFutureSlotsForStaff(staffId, consultationIds) {
    if (!consultationIds.length) {
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingFutureSlots = await Slot.count({
        where: {
            staffId,
            consultationId: { [Op.in]: consultationIds },
            isAvailable: true,
            date: { [Op.gte]: toDateOnly(today) }
        }
    });

    if (existingFutureSlots > 0) {
        return;
    }

    const slotsToCreate = [];
    const daysToGenerate = getDaysToEndOfAugust();

    for (let offset = 0; offset < daysToGenerate; offset += 1) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + offset);

        if (currentDate.getDay() === 0) {
            continue;
        }

        const dateValue = toDateOnly(currentDate);
        let slotIndex = 0;

        for (let minutes = SLOT_START_HOUR * 60; minutes < SLOT_END_HOUR * 60; minutes += SLOT_DURATION_MINUTES) {
            const startHours = Math.floor(minutes / 60);
            const startMinutes = minutes % 60;
            const endTotalMinutes = minutes + SLOT_DURATION_MINUTES;
            const endHours = Math.floor(endTotalMinutes / 60);
            const endMinutes = endTotalMinutes % 60;
            const consultationId = consultationIds[slotIndex % consultationIds.length];

            slotsToCreate.push({
                staffId,
                consultationId,
                date: dateValue,
                startTime: toTime(startHours, startMinutes),
                endTime: toTime(endHours, endMinutes),
                isAvailable: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            slotIndex += 1;
        }
    }

    if (slotsToCreate.length > 0) {
        await Slot.bulkCreate(slotsToCreate);
    }
}

const StaffController = {
    // 1. Admin lista (Mindenki)
    async index(req, res) {
        try {
            const staff = await Staff.findAll({
                include: [
                    { model: User, as: 'user', attributes: ['name', 'email', 'roleId'] },
                    {
                        model: Consultation,
                        as: 'treatments',
                        attributes: ['id', 'name', 'price'],
                        through: { attributes: [] }
                    }
                ]
            });
            res.json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    async tryIndex(req, res) {
        const staff = await Staff.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    model: Consultations,
                    attributes: ['id', 'name'],
                    through: {
                        attributes: []
                    }
                }
            ]
        })
        res.status(200)
        res.json({
            success: true,
            data: staff
        })
    },

    // 2. Publikus profilok (Csak az aktívak)
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
        res.json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Egy szakember adatai
    async show(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id, {
                include: [{ model: User, as: 'user' }]
            });
            if (!staff) return res.status(404).json({ success: false, message: 'Szakember nem található' });
            res.json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 4. KEZELÉSEK LEKÉRÉSE
    async getTreatmentsForStaff(req, res) {
        try {
            const { id } = req.params;
            const staff = await Staff.findByPk(id, {
                include: [{ model: Consultation, as: 'treatments', through: { attributes: [] } }]
            });
            if (!staff) return res.status(404).json({ success: false, message: 'Nincs ilyen szakember' });
            res.json({ success: true, data: staff.treatments || [] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 5. KEZELÉSEK HOZZÁADÁSA
    async assignTreatments(req, res) {
        try {
            const { id } = req.params;
            const { treatmentIds } = req.body;
            const staff = await Staff.findOne({ where: { userId: id } });
            if (!staff) return res.status(404).json({ success: false, message: 'Szakember nem található' });
            // Hozzárendelt vizsgálat
            await staff.setTreatments(treatmentIds);
            
            res.json({ success: true, message: 'Kezelések frissítve' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 6. ELŐLÉPTETÉS
    async promoteToStaff(req, res) {
        let transaction;

        try {
            const normalizedUserId = Number(req.body?.userId);
            const specialty = String(req.body?.specialty || '').trim();
            const requestedTreatmentIds = normalizeTreatmentIds(req.body?.treatmentIds);

            if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
                return res.status(400).json({ success: false, message: 'Érvénytelen felhasználó azonosító.' });
            }

            if (!specialty) {
                return res.status(400).json({ success: false, message: 'A szakterület megadása kötelező.' });
            }

            transaction = await db.sequelize.transaction();

            const user = await User.findByPk(normalizedUserId, { transaction });
            if (!user) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'A kiválasztott felhasználó nem található.' });
            }

            if (Number(user.roleId) === 2) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Admin felhasználó nem nevezhető ki szakemberré.' });
            }

            const existingStaff = await Staff.findOne({
                where: { userId: normalizedUserId },
                transaction
            });

            let staffProfile;
            if (existingStaff) {
                await existingStaff.update({
                    specialty,
                    isActive: true,
                    isAvailable: true
                }, { transaction });
                staffProfile = existingStaff;
            } else {
                staffProfile = await Staff.create({
                    userId: normalizedUserId,
                    specialty,
                    isActive: true,
                    isAvailable: true
                }, { transaction });
            }

            if (Number(user.roleId) !== 1) {
                await user.update({ roleId: 1 }, { transaction });
            }

            const treatmentIds = requestedTreatmentIds.length > 0
                ? requestedTreatmentIds
                : await resolveTreatmentIdsForSpecialty(specialty, transaction);

            await staffProfile.setTreatments(treatmentIds, { transaction });

            await transaction.commit();

            await ensureFutureSlotsForStaff(Number(staffProfile.id), treatmentIds);

            res.json({
                success: true,
                message: existingStaff ? 'A szakember profil frissítve lett.' : 'A szakember profil sikeresen létrejött.',
                data: staffProfile
            });
        } catch (error) {
            if (transaction) {
                await transaction.rollback();
            }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 7. Mentés (Új szakember közvetlen létrehozása)
    async store(req, res) {
        try {
            const { name, email, password, specialty, bio, roleId} = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password || 'doctor123', salt);

            const newUser = await User.create({
            name,
            email,
            password: hashedPassword, 
            roleId: roleId || 1, 
        });
        
            const staff = await Staff.create({
            userId: newUser.id,
            specialty: specialty || 'Általános szakorvos',
            bio: bio || '',
            isActive: true
        });

            res.status(201).json({ 
                success: true, 
                message: 'Szakember sikeresen létrehozva!',
                data: {
                    id: staff.id,
                    name: newUser.name,
                    email: newUser.email,
                    specialty: staff.specialty,
                    userId: newUser.id
                }
            });

        } catch (error) {
            console.error("MENTÉSI HIBA:", error);
            if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Ez az e-mail cím már használatban van!' 
            });
        }
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 8. Frissítés
    async update(req, res) {
        try {
            const { id } = req.params; // Ez a userId
            const { name, email, specialty, bio, isActive, isAvailable } = req.body;
            
            console.log(`--- FRISSÍTÉS INDUL: User ID ${id} ---`);
            console.log("Beérkező specialty:", specialty);
            
            // 1. User tábla frissítése 
            await User.update(
                { name, email },
                { where: { id:id } }
            );
            // 2. Staff tábla frissítése 
            const [updatedRows] = await Staff.update(
                { specialty, bio, isActive, isAvailable },
                { where: { userId: id } }
            );

            if (updatedRows === 0) {
                console.warn(`Figyelem: A Staff táblában nem frissült sor. Létezik rekord ehhez a userId-hoz (${id})?`);
            } else {
                console.log("Sikeres Staff frissítés!");
            }

            res.json({ success: true, message: "Minden adat sikeresen frissítve!" });
        
        } catch (error) {
            console.error("FRISSÍTÉSI HIBA A BACKENDEN:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 9. Törlés (Fizikai törlés)
    async destroy(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id);
            if (staff) {
                await staff.destroy();
                res.json({ success: true, message: 'Szakember profil törölve' });
            } else {
                res.status(404).json({ success: false, message: 'Nem található' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 10. STÁTUSZ KEZELÉS (Archiválás és Visszaállítás)
    async updateStatus(req, res) {
        try {
            const { id } = req.params; // a userId-t kapjuk az Angulartól
            const { isActive } = req.body;

            const staffProfile = await Staff.findOne({ where: { userId: id } });

            if (!staffProfile) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Ehhez a felhasználóhoz nem tartozik szakmai profil.' 
                });
            }

            staffProfile.isActive = isActive;
            await staffProfile.save();

            res.json({ 
                success: true, 
                message: isActive ? 'Szakember aktiválva' : 'Szakember archiválva', 
                data: staffProfile 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default StaffController;