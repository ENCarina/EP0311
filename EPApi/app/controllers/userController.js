import bcrypt from 'bcryptjs'
import User from '../models/user.js'
import { Op } from 'sequelize'

const UserController = {
    async index(req, res) {
        try {
            await UserController.tryIndex(req, res)
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!'
            })
        }
    },
    async tryIndex(req, res) {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        })
        res.status(200)
        res.json({
            success: true,
            data: users
        })
    },
    async show(req, res) {
        try {
            await UserController.tryShow(req, res)
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!'
            })
        }
    },
    async tryShow(req, res) {
        const user = await User.findByPk(req.params.id)
        res.status(200)
        res.json({
            success: true,
            data: user
        })
    },
    async create(req, res) {
        let clientError = false;
        try {
            const { name, email, password, confirmPassword } = req.body;

            if(!name || !email || !password || !confirmPassword) {
                clientError = true;
                throw new Error('Error! Hiányzó adatok!')
            }
            if(password != confirmPassword) {
                clientError = true
                throw new Error('Error! A két jelszó nem egyezik!')
            }
            const existinguser = await User.findOne({
                where: { 
                    [Op.or]: [{ name: name }, { email: email }]
            }
        });
            if(existinguser) {
                clientError = true;
                const field = existingUser.name === name ? 'név' : 'email';
                throw new Error(`Error! Ez a ${field} már foglalt!`);
            }            
            await UserController.tryCreate(req, res);

        }catch(error) {
           res.status(clientError ? 400 : 500).json({
                success: false,
                message: 'Error! A művelet sikertelen!',
                error: error.message
            });
        }
    },
    async tryCreate(req, res) {
        const newUser = {
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            roleId: req.body.roleId || 1
        }        
        const userData = await User.create(newUser)
        const result = userData.toJSON();
        delete result.password;
        
        res.status(201).json({
            success: true,
            data: result
        })
    },
    async updatePassword(req, res) {
        let clientError = false;
        try {
            if(!req.body.password || !req.body.confirmPassword) {
                clientError = true
                throw new Error('Error! Hiányzó jelszó mezők!')
            }
            if(req.body.password != req.body.confirmPassword) {
                clientError = true
                throw new Error('Error! A két jelszó nem egyezik!')
            }
            await UserController.tryUpdatePassword(req, res)
        }catch(error) {
           res.status(clientError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    },

    async tryUpdatePassword(req, res) {
        const user = await User.findByPk(req.params.id);
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'Error! User not found!'
            })
        }

        user.password = bcrypt.hashSync(req.body.password, 10)
        await user.save()
        res.status(200)
        res.json({
            success: true,
            message: 'Password sikeresen frissítve!'
        });
    },
    async destroy(req, res) {
        try {
            await UserController.tryDestroy(req, res)
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },
    async tryDestroy(req, res) {
        const user = await User.destroy({
            where: { id: req.params.id }
        })
        res.status(200)
        res.json({
            success: true,
            data: user
        })
    }
}

export default UserController
