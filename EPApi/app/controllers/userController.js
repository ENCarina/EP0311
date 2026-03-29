import db from '../models/modrels.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const { User, Staff, Role, Consultation, Booking, Slot } = db;

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

async function resolveTreatmentIdsForSpecialty(specialty) {
    const specialtyName = SPECIALTY_MAP[specialty] || specialty;
    const consultations = await Consultation.findAll({
        attributes: ['id', 'specialty']
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

async function ensureStaffAvailability(staffProfile) {
    if (!staffProfile) {
        return;
    }

    let treatmentIds = [];
    const existingTreatments = await staffProfile.getTreatments({ attributes: ['id'] });

    if (existingTreatments.length > 0) {
        treatmentIds = existingTreatments.map((treatment) => Number(treatment.id));
    } else {
        treatmentIds = await resolveTreatmentIdsForSpecialty(staffProfile.specialty);
        if (treatmentIds.length > 0) {
            await staffProfile.setTreatments(treatmentIds);
        }
    }

    await ensureFutureSlotsForStaff(Number(staffProfile.id), treatmentIds);
}

const UserController = {
    // --- LISTÁZÁS ---
    async index(req, res) {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] },
                include: [
                    { model: Role, as: 'role', attributes: ['id', 'name'], required: false },
                    { model: Staff, as: 'staffProfile', required: false, attributes: ['isActive', 'specialty'] }
                ],
                order: [['name', 'ASC']]
            });
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba a lekérdezés során!', details: error.message });
        }
    },

    async listPatients(req, res) {
        try {
            const patients = await User.findAll({
                where: {
                    roleId: 0
                },
                attributes: ['id', 'name', 'email'],
                order: [['name', 'ASC']]
            });

            res.status(200).json({ success: true, data: patients });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba a páciensek lekérdezésekor!', details: error.message });
        }
    },

    // --- EGY FELHASZNÁLÓ RÉSZLETEI ---
    async show(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
                include: [
                    { model: Role, as: 'role', required: false },
                    {
                        model: Staff, as: 'staffProfile',
                        include: [{ model: Consultation, as: 'treatments', through: { attributes: [] } }]
                    }
                ]
            });
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található' });
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba a felhasználó lekérésekor!' });
        }
    },

    // --- LÉTREHOZÁS ---
    async create(req, res) {
        try {
            const { name, email, password, roleId } = req.body;
            const hashedPassword = bcrypt.hashSync(password, 10);
            const newUser = await User.create({ name, email, password: hashedPassword, roleId: roleId || 0 });
            const result = newUser.toJSON();
            delete result.password;
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- SAJÁT PROFIL FRISSÍTÉSE (Ezt kereste az api.js!) ---
    async updateMyProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, email } = req.body;
            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
            await user.update({ name: name || user.name, email: email || user.email });
            res.status(200).json({ success: true, message: 'Profil frissítve!', data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- JELSZÓ MÓDOSÍTÁS (Ezt is kereste!) ---
    async updatePassword(req, res) {
        try {
            const { id } = req.params;
            const { password } = req.body;
            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
            const hashedPassword = await bcrypt.hash(password, 10);
            await user.update({ password: hashedPassword });
            res.status(200).json({ success: true, message: 'Jelszó sikeresen módosítva!' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- STÁTUSZ VÁLTÁS ---
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            const staffProfile = await Staff.findOne({ where: { userId: id } });
            if (staffProfile) {
                staffProfile.isActive = isActive;
                await staffProfile.save();

                if (isActive) {
                    await ensureStaffAvailability(staffProfile);
                }
            }
            res.status(200).json({ success: true, data: { id, isActive } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba a státusz frissítésekor!' });
        }
    },

    // --- ADATOK FRISSÍTÉSE (Admin) ---
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, email, roleId } = req.body;
            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ success: false, message: 'Felhasználó nem található!' });
            await user.update({ name: name || user.name, email: email || user.email, roleId: roleId !== undefined ? roleId : user.roleId });
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // --- TÖRLÉS ---
    async destroy(req, res) {
        try {
            const userId = req.params.id;
            const staffProfile = await Staff.findOne({ where: { userId } });
            if (staffProfile) {
                staffProfile.isActive = false;
                await staffProfile.save();
            }
            res.status(200).json({ success: true, message: 'Archiválva.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Hiba az archiválás során!' });
        }
    },

    // --- SAJÁT PROFIL LEKÉRÉSE --- 
    async getMyProfile(req, res) {
        try {
            const userId = req.user.id; 
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password', 'verificationToken'] },
                include: [
                    { model: Role, as: 'role', attributes: ['name'] },
                    {
                        model: Booking, as: 'bookings',
                        include: [
                            { model: Staff, as: 'doctor', include: [{ model: User, as: 'user', attributes: ['name'] }] },
                            { model: Slot, as: 'timeSlot' },
                            { model: Consultation, as: 'treatment' }
                        ]
                    },
                    { model: Staff, as: 'staffProfile', required: false }
                ]
            });
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

export default UserController;
