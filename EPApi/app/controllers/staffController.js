import db from '../models/modrels.js'

const { Staff, User, Consultation } = db;

const StaffController = {
    // 1. Publikus profilok az UI-ra
    async getPublicProfiles(req, res) {
        try {
            const profiles = await Staff.findAll({
                where: { isAvailable: true }, 
                attributes: ['id', 'specialty', 'bio', 'imageUrl'], 
                include: [
                    {
                        model: User,
                        as: 'staffProfile', 
                        attributes: ['name', 'email', 'roleId' ]
                    },
                    {
                        model: Consultation,
                        as: 'services', 
                        attributes: ['id', 'name', 'price'],
                        through: { attributes: [] } 
                    }
                ]
            });

            const formattedProfiles = profiles.map(staff => ({
                id: staff.id,
                name: staff.staffProfile ? staff.staffProfile.name : 'Névtelen orvos',
                specialty: staff.specialty,
                bio: staff.bio,
                imageUrl: staff.imageUrl,
                services: staff.services
            }));

            res.json({ success: true, data: formattedProfiles });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async index(req, res) {
        try {
            const staff = await Staff.findAll({
                include: [{
                    model: User,
                    as: 'staffProfile', 
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
                as: 'staffProfile',
                attributes:['name', 'email','roleId']
            }]
        })
        res.status(200)
        res.json({
            success: true,
            data: staff
        })
    },
    async show(req, res) {
        try {
            const staff = await Staff.findByPk(req.params.id,{
                include: [{
                    model: User,
                    as: 'staffProfile',
                    attributes:['name', 'email','roleId']
                }]
            })
            if(!staff) { return res.status(404).json({ success: false, message: 'Staff not found' }) }
            res.status(200).json({ success: true, data: staff });
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },
    async tryShow(req, res) {
        const staff = await Staff.findByPk(req.params.id,{
            include: [{
                model: User,
                as: 'staffProfile',
                attributes:['name', 'email','roleId']
            }]
        })
        res.status(200)
        res.json({
            success: true,
            data: staff
        })
    },
    async store(req, res) {
        try {
            const { name, email, password, role, specialty, bio, imageUrl } = req.body;
            const newUser = await User.create({
            name: name,
            email: email,
            password: password || 'doctor123', 
            roleId: role || 1,
            verified: true // Ha nem akarsz email megerősítést, legyen alapból igaz
        });
            const newStaff = await Staff.create({
            userId: newUser.id,
            specialty: specialty,
            bio: bio,
            imageUrl: imageUrl,
            isAvailable: true
        });

            res.status(201).json({ success: true, data: newStaff, message: 'Szakember és felhasználó sikeresen létrehozva!' });
        }catch(error) {
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
    async update(req, res) {
        try {
            const [recordNumber] = await Staff.update(req.body, {
                where: { id: req.params.id }
            });
            if (recordNumber === 0) {
                return res.status(404).json({ success: false, message: 'Fail! Record not found!' });
            }
            const staff = await Staff.findByPk(req.params.id, {
                include: [{ model: User, as: 'staffProfile', attributes: ['name', 'email'] }]
            });
            res.status(200).json({ success: true, data: staff });
        }catch(error) {
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
            as: 'staffProfile',
            data: staff
        })
    },
    async destroy(req, res) {
        try {
            const result = await Staff.destroy({ where: { id: req.params.id } });
            res.status(200).json({ success: true, data: result });
        }catch(error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async tryDestroy(req, res) {
        const staff = await Staff.destroy({
            where: { id: req.params.id }
        })
        res.status(200).json({
            success: true,
            as: 'staffProfile',
            data: staff
        })
    }
}

export default StaffController
