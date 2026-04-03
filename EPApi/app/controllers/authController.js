import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import dotenvFlow from 'dotenv-flow';
import crypto from 'crypto';
import { EmailService } from '../services/emailService.js';
import db from '../models/modrels.js';
import { Op } from 'sequelize';

dotenvFlow.config();

const AuthController = {
    // 1. REGISZTRÁCIÓ
    async register(req, res) {
        const lang = req.headers['accept-language'] || 'hu';
        try {
            const { name, email, password, confirmPassword } = req.body;

            // Validációk kódokkal
            if (!name || !email || !password || !confirmPassword) {
                return res.status(400).json({ success: false, message: 'AUTH.MISSING_FIELDS' });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ success: false, message: 'AUTH.PASSWORD_MISMATCH' });
            }

            const userExists = await db.User.findOne({ where: { email } });
            if (userExists) {
                return res.status(400).json({ success: false, message: 'AUTH.EMAIL_ALREADY_TAKEN' });
            }
            
            // Token generálás az email megerősítéshez
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verifyUrl = `${process.env.APP_URL}/verify-email/${verificationToken}`;

            // Felhasználó létrehozása
            const newUser = await db.User.create({
                name,
                email,
                password: bcrypt.hashSync(password, 10),
                roleId: 0, 
                verificationToken: verificationToken,
                verified: false,
                isActive: true
            });

            // Email küldés (háttérben, nem blokkolja a választ)
            EmailService.sendWelcomeEmail(newUser.email, newUser.name, verifyUrl, lang)
                .catch(err => console.error("Email error during registration:", err.message));

            return res.status(201).json({
                success: true,
                message: 'AUTH.REGISTRATION_SUCCESS_VERIFY',
                data: { id: newUser.id, name: newUser.name, email: newUser.email }
            });

        } catch (error) {
            console.error("REGISTRATION ERROR:", error);
            return res.status(500).json({ success: false, message: 'AUTH.ERROR_GENERAL' });
        }
    },

    // 2. EMAIL VISSZAIGAZOLÁS
    async verifyEmail(req, res) {
        try {
            const user = await db.User.findOne({ where: { verificationToken: req.params.token } });
            
            if (!user) {
                return res.status(400).json({ success: false, message: 'AUTH.INVALID_TOKEN' });
            }

            user.verified = true;
            user.verificationToken = null;
            await user.save();

            return res.status(200).json({ success: true, message: 'AUTH.EMAIL_VERIFIED_SUCCESS' });
        } catch (error) {
            console.error("VERIFY ERROR:", error);
            return res.status(500).json({ success: false, message: 'AUTH.ERROR_GENERAL' });
        }
    },

    // 3. BEJELENTKEZÉS
    async login(req, res) {
        try {
            const { email, password, lang } = req.body;
            const currentLang = lang || 'hu';

            const user = await db.User.findOne({ where: { email } });

            if (!user) {
                return res.status(401).json({ success: false, message: 'AUTH.INVALID_CREDENTIALS' });
            }

            if (user.isActive === false) { 
                return res.status(401).json({ success: false, message: 'AUTH.ACCOUNT_INACTIVE' });
            }

            const passwordIsValid = await bcrypt.compare(password, user.password);

            if (!passwordIsValid) {
                return res.status(401).json({ success: false, message: 'AUTH.INVALID_CREDENTIALS' });
            } 

            if (!user.verified) {
                return res.status(403).json({ success: false, message: 'AUTH.EMAIL_NOT_VERIFIED' });
            }

            // Token generálás
            const secretKey = process.env.APP_KEY || 'default_secret_key';
            const token = jwt.sign(
                { id: user.id, roleId: user.roleId },
                secretKey,
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                success: true,
                accessToken: token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roleId: user.roleId
                }
            });

        } catch (error) {
            console.error("LOGIN ERROR:", error);
            return res.status(500).json({ success: false, message: 'AUTH.ERROR_GENERAL' });
        }
    },

    // 4. ELFELEJTETT JELSZÓ
    async forgotPassword(req, res) {
        try {
            const { email, lang } = req.body;
            const userLang = lang || 'hu';

            if (!email) {
                return res.status(400).json({ success: false, message: 'AUTH.EMAIL_REQUIRED' });
            }

            const user = await db.User.findOne({ where: { email } });

            // Biztonsági okokból: ugyanazt a választ adjuk, ha nincs user
            if (!user) {
                return res.status(200).json({ success: true, message: 'AUTH.FORGOT_PASSWORD_SENT' });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; 
            await user.save();

            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password/${resetToken}`;

            EmailService.sendPasswordResetEmail(user.email, resetUrl, userLang)
                .catch(err => console.error("Email error during forgot password:", err.message));

            return res.status(200).json({
                success: true,
                message: 'AUTH.FORGOT_PASSWORD_SENT'
            });

        } catch (error) {
            console.error("FORGOT PASSWORD ERROR:", error);
            return res.status(500).json({ success: false, message: 'AUTH.ERROR_GENERAL' });
        }
    },

    // 5. JELSZÓ VISSZAÁLLÍTÁS
    async resetPassword(req, res) {
        try {
           const { token, password, password_confirmation } = req.body;

           if (!token) {
            return res.status(400).json({ success: false, message: 'AUTH.TOKEN_REQUIRED' });
            }

            if (!password || password !== password_confirmation) {
                return res.status(400).json({ success: false, message: 'AUTH.PASSWORD_MISMATCH' });
            }

            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            const user = await db.User.findOne({
                where: {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: { [Op.gt]: Date.now() } 
                }
            });

            if (!user) {
                return res.status(400).json({ success: false, message: 'AUTH.INVALID_OR_EXPIRED_TOKEN' });
            }

            user.password = bcrypt.hashSync(password, 10);
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'AUTH.PASSWORD_RESET_SUCCESS'
            });

        } catch (error) {
            console.error("RESET PASSWORD ERROR:", error);
            return res.status(500).json({ success: false, message: 'AUTH.ERROR_GENERAL' });
        }
    }      
};

export default AuthController;
