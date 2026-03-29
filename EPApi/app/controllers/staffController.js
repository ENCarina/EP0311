import db from '../models/modrels.js';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const { Staff, User, Consultation, Slot } = db;

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

            await transaction.commit();
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