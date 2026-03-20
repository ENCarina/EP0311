import db from '../models/modrels.js'
import dotenv from 'dotenv';
dotenv.config();

const { Staff, User, Consultation } = db;
const APP_URL = process.env.APP_URL || 'http://localhost:8000';

const StaffController = {
    // 1. Publikus profilok az UI-ra
    async getPublicProfiles(req, res) {
        try {
            const profiles = await Staff.findAll({
                where: { isAvailable: true, isActive:true }, 
                attributes: ['id', 'specialty', 'bio', 'imageUrl'], 
                include: [
                    {
                        model: User,
                        as: 'user', 
                        attributes: ['name', 'email', 'roleId' ],
                        where: { isActive: true}
                    },
                    {
                        model: Consultation,
                        as: 'treatments', 
                        attributes: ['id', 'name', 'price'],
                        through: { attributes: [] } 
                    }
                ]
            });

            const formattedProfiles = profiles.map(staff => ({
                id: staff.id,
                name: staff.user ? staff.user.name : 'Névtelen szakember',
                specialty: staff.specialty,
                bio: staff.bio,
                imageUrl: staff.imageUrl 
                    ? `${APP_URL}${staff.imageUrl}` 
                    : `${APP_URL}/images/default-avatar.png`,
                treatments: staff.treatments   
            }));

            res.json({ success: true, data: formattedProfiles });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    // 2. Összes staff listázása (Adminnak)
    async index(req, res) {
        try {
            const staff = await Staff.findAll({
                include: [{
                    model: User,
                    as: 'user', 
                    attributes: ['name', 'email', 'roleId']
                }]
            });
            res.status(200).json({ success: true, data: staff });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async tryIndex(req, res) {
        const staff = await Staff.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes:['name', 'email','roleId']
            }]
        })
        res.status(200)
        res.json({
            success: true,
            data: staff
        })
    },
// 3. Egy szakember adatlapja
    async show(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id,{
                include: [{ model: User, as: 'user', attributes:['name', 'email','roleId'] },
                    {
                        model: Consultation,
                        as: 'treatments',
                        attributes: ['id', 'name', 'price'],
                        through: { attributes: [] }
                    }
                ]
            });

            if(!staff) { return res.status(404).json({ success: false, message: 'Szakember nem található' }) }
            
            res.status(200).json({ success: true, data: staff });
        }catch(error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async tryShow(req, res) {
        const staff = await Staff.findByPk(req.params.id,{
            include: [{
                model: User,
                as: 'user',
                attributes:['name', 'email','roleId']
            }]
        })
        res.status(200)
        res.json({
            success: true,
            data: staff
        })
    },
     // 4. Kezelések hozzárendelése orvoshoz
    async assignTreatments(req, res) {
        try {
            const staffId = req.params.id; 
            let { treatmentIds } = req.body;

            const staffMember = await db.Staff.findByPk(staffId);

            if (!staffMember) {
            return res.status(404).json({ success: false, message: 'Orvos nem található' });
            }
            const idsToSave = Array.isArray(treatmentIds) 
            ? treatmentIds.map(Number) 
            : (treatmentIds ? [Number(treatmentIds)] : []);

            await staffMember.setTreatments(idsToSave);

            return res.status(200).json({ 
                success: true, 
                message: 'Kezelések sikeresen frissítve!',
                count: idsToSave.length 
            });

        } catch (error) {
            console.error("AssignTreatments Hiba:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // 5. Adott orvos kezeléseinek lekérése
    async getTreatmentsForStaff(req, res) {
        try {
            const staffWithTreatments = await db.Staff.findByPk(req.params.id, {
                where: { userId: req.params.id },
                include: [{
                    model: db.Consultation,
                    as: 'treatments', 
                    attributes: ['id', 'name', 'price'],
                    through: { attributes: [] } 
                }]
            });
            if (!staffWithTreatments) return res.status(404).json({ message: "Szakember nem található a Staff táblában ezzel az ID-val." });
            res.json({ success: true, data: staffWithTreatments.treatments || [] });
        } catch (error) {
            console.error("SQL hiba a szakember kezeléseinél:", error);
            res.status(500).json({ error: error.message });
        }
    },
    // 6. Új szakember felvétele
    async store(req, res) {
        const t = await db.sequelize.transaction();
        try {
            const { name, email, password, role, specialty, bio, imageUrl } = req.body;

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                await t.rollback(); // Tranzakció leállítása, ha van ilyen email
                return res.status(400).json({ success: false, message: 'Ez az email cím már foglalt!' });
            }

            const newUser = await User.create({
            name: name,
            email: email,
            password: password || 'doctor123', 
            roleId: role || 1,
            verified: true,// nincs email megerősítést
            isActive: true 
        }, { transaction: t});

            const newStaff = await Staff.create({
                userId: newUser.id,
                specialty: specialty || 'Általános',
                bio: bio || '',
                imageUrl: imageUrl || '',
                isAvailable: true,
                isActive: true 
            }, { transaction: t});

            await t.commit();

            res.status(201).json({ success: true, data: newStaff, message: 'Szakember sikeresen létrehozva!' });
        }catch(error) {
            if (t && !t.finished) {
                await t.rollback();
            }
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async tryStore(req, res) {
        const staff = await Staff.create(req.body)
        res.status(201)
        res.json({
            success: true,
            data: staff
        })
    },
    // 7. Adatok frissítése
    async update(req, res) {
        const t = await db.sequelize.transaction();
        try {
            const idFromUrl = req.params.id;
            const { name, email, roleId, ...staffData } = req.body;
            const userId = req.body.userId || idFromUrl;

            const user = await User.findByPk(userId);
            if (!user) {
                await t.rollback();
                return res.status(404).json({ success: false, message: 'Szakember nem található!' });
            }
            await User.update({ name, email, roleId }, { where: { id: userId }, transaction: t });

            let staffMember = await Staff.findOne({ where: { userId: userId } });

            if (staffMember) {
            // Ha már orvos, csak frissítjük az adatait (pl. specialization)
                await Staff.update(staffData, { 
                    where: { userId: userId }, 
                    transaction: t 
                });
             } else {
            // HA MOST LESZ ORVOS: Létrehozzuk az új Staff rekordot
                staffMember = await Staff.create({
                    ...staffData,
                    userId: userId
                }, { transaction: t });
            }
            await t.commit();
            // 3. Visszaküldjük a teljes, frissített profilt
            const result = await Staff.findOne({
                where: { userId: userId },
                include: [{ model: User, as: 'user', attributes: ['name', 'email', 'roleId'] }]
            });

            res.status(200).json({ success: true, data: result });

        } catch (error) {
            if (t && !t.finished) {
            await t.rollback();
        }
            console.error("Update hiba:", error);
            res.status(500).json({ success: false, error: error.message });
            }
        },
       
    async tryUpdate(req, res) {
        const [recordNumber] = await Staff.update(req.body, {
            where: { id: req.params.id }
        })
        if(recordNumber == 0) {
            throw new Error('Fail! Record not found!')
        }
        const staff = await Staff.findByPk(req.params.id)
        res.status(200)
        res.json({
            success: true,
            as: 'user',
            data: staff
        })
    },
    // 8. Törlés (Inaktiválás)
    async destroy(req, res) {
        const t = await db.sequelize.transaction();
        try {
            const staffMember = await Staff.findByPk(req.params.id);
            if (!staffMember) {
                await t.rollback();
                return res.status(404).json({ success: false, message: "Személyzet nem található" });
            }
            await Staff.update(
            { isActive: false, isAvailable: false },
            { where: { id: req.params.id }, transaction: t }
            );
            await User.update(
            { isActive: false },
            { where: { id: staffMember.userId }, transaction: t }
            );
            await t.commit();
            res.status(200).json({ success: true, message: "Profil és felhasználó inaktiválva."});
        }catch (error) {
            if (t) await t.rollback();
            res.status(500).json({ success: false, error: error.message });
        }
    },
    // 9. Felhasználó előléptetése orvossá
    async promoteToStaff(req, res) {
        try {
    const { userId, specialty } = req.body; 

    let staff = await Staff.findOne({ where: { userId } });

    if (staff) {
      await staff.update({ specialty, isActive: true });
    } else {
      staff = await Staff.create({
        userId,
        specialty,
        isActive: true
      });
    }
    await User.update({ roleId: 2 }, { where: { id: userId } });

    res.status(200).json({ success: true, message: 'Sikeres előléptetés!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
}
export default StaffController
