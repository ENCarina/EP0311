import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'
import dotenvFlow from 'dotenv-flow'
import crypto from 'crypto'
import { sendEmail} from '../services/emailService.js'

dotenvFlow.config() 

const AuthController = {
    async register(req, res) {        
        var clientError = false;
        try {
            if(!req.body.name ||
                !req.body.email ||
                !req.body.password ||
                !req.body.password_confirmation) {
                clientError = true
                throw new Error('Error! Bad request data!')
            }
            if(req.body.password != req.body.password_confirmation) {
                clientError = true
                throw new Error('Error! The two password is not same!')
            }
            const user = await User.findOne({
                where: { name: req.body.name }
            })
            if(user) {
                clientError = true
                throw new Error('Error! User already exists: ' + user.name)
            }
            await AuthController.tryRegister(req, res)

        } catch (error) {
            if (clientError) {
                res.status(400)
            }else {
                res.status(500)
            }            
            await res.json({
                success: false,
                message: 'Error! User creation failed!',
                error: error.message
            })            
        }
    },
    async tryRegister(req, res) {
        try {
            const verificationToken = crypto.randomBytes(32).toString('hex')
            const verifyUrl = process.env.APP_URL + 'verify-email/' + verificationToken
        
            const user = {
                name: req.body.name,
                email: req.body.email,
                password: bcrypt.hashSync(req.body.password),
                roleId:0, 
                verificationToken: verificationToken,
                verified: false //explicit
            }
            const result = await User.create(user)

            if (typeof sendEmail !== 'undefined') {
                sendEmail({
                    to: req.body.email,
                    subject: 'Regisztráció',
                    html: `Regisztráció megerősítése:<br>${verifyUrl}`
                }).catch (err =>{
                    console.error("Email hiba:", err.message);
                });
            }

            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        } 
    },

    async verifyEmail(req, res) {
        try {
            const user = await User.findOne({
            where: { verificationToken: req.params.token }
            })
            if(!user) {
                return res.status(404).json({success: false, message: 'Error! User not found!'});
            }
        user.verified = true
        await user.save()

        res.status(200).json({
            success: true,
            message: 'The email is verified!',
        })
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async login(req, res) {
        
        try {
            const { email, password } = req.body;

            if(!email || !password) {
                return res.status(400).json({
                success: false,
                message: 'Hiányzó email vagy jelszó!'
                });
            }
            const user = await User.findOne({ where: { email } });

            if(!user) {
                return res.status(404).json({
                success: false,
                message: 'Ezzel az email címmel nincs regisztrált felhasználó!'
                });
            }
            if (user.verified === false || user.verified == 0) {
                /*return res.status(401).json({
                success: false,
                message: 'Kérjük, igazolja vissza email címét a bejelentkezéshez!'
                });
                */
               console.log("Figyelem: A felhasználó nincs aktiválva, de a fejlesztés miatt átengedjük.");
            }

            const passwordIsValid = await bcrypt.compare(password, user.password);
            
            if(!passwordIsValid) {
                return res.status(401).json({
                success: false,
                message: 'Érvénytelen jelszó!'
                });
            }
            return AuthController.tryLogin(req, res, user);

        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({
                success: false,
                message: 'Hiba történt a bejelentkezés során!',
                error: error.message
            })
        }
    },
    async tryLogin(req, res, user) {
        try {
        const secretKey = process.env.APP_KEY || 'default_secret_key';
        var token = jwt.sign(
            { id: user.id , roleId: user.roleId}, 
            secretKey, {
            expiresIn: 86400 //24 óra
        })
        res.status(200).json({
            success: true,
            id: user.id,
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            accessToken: token
        });
    } catch (jwtError) {
        console.error("JWT hiba:", jwtError);
        return res.status(500).json({ 
            success: false, 
            message: "Hiba a token generálása közben!" 
        });
    }           
}
}

export default AuthController
