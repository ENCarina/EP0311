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
        try {
            const { name, email, password, confirmPassword } = req.body;

            // validációk
            if (!name || !email || !password || !confirmPassword) {
                return res.status(400).json({ success: false, message: 'Minden mező kitöltése kötelező!' });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ success: false, message: 'A két jelszó nem egyezik!' });
            }

            const userExists = await db.User.findOne({ where: { email } });
            if (userExists) {
                return res.status(400).json({ success: false, message: 'Ez az email cím már foglalt!' });
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
                verificationToken:verificationToken,
                verified: false,
                isActive: true
            });

            // Email küldés 
            EmailService.sendWelcomeEmail(newUser.email, newUser.name, verifyUrl)
                .catch(err => console.error("Email küldési hiba a regisztrációnál:", err.message));

            return res.status(201).json({
                success: true,
                message: 'Regisztráció sikeres! Kérjük, igazolja vissza email címét.',
                data: { id: newUser.id, name: newUser.name, email: newUser.email }
            });

        } catch (error) {
            console.error("REGISZTRÁCIÓS HIBA:", error);
            return res.status(500).json({ success: false, message: 'Hiba a regisztráció során!', error: error.message });
        }
    },

    // 2. EMAIL VISSZAIGAZOLÁS
    async verifyEmail(req, res) {
        try {
            const user = await User.findOne({ where: { verificationToken: req.params.token } });
            
            if (!user) {
                return res.status(400).json({ success: false, message: 'Érvénytelen vagy lejárt megerősítő token!' });
            }

            user.verified = true;
            user.verificationToken = null;
            await user.save();

            return res.status(200).json({ success: true, message: 'Email cím sikeresen visszaigazolva!' });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // 3. BEJELENTKEZÉS
    async login(req, res) {
        try {
            const { email, password } = req.body

            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.status(401).json({ success: false, message: 'Érvénytelen e-mail!' });
            }

            if (user.isActive === false) { 
                return res.status(401).json({ success: false, message: 'Inaktív fiók!' });
            }

            const passwordIsValid = await bcrypt.compare(password, user.password);

            if (!passwordIsValid) {
                return res.status(401).json({ success: false, message: 'Érvénytelen jelszó!'});
            } 

            if (!user.verified) {
            return res.status(403).json({ 
                success: false, 
                message: 'Kérjük, igazolja vissza email címét a belépés előtt!' 
            });
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
            return res.status(500).json({ success: false, message: 'Hiba a bejelentkezés során!', error: error.message });
        }
    },
     // 4. ELFELEJTETT JELSZÓ - Token generálás és Email küldés
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email megadása kötelező!' });
            }

            const user = await db.User.findOne({ where: { email } });

            if (!user) {
                return res.status(200).json({ success: true, message: 'Ha létezik fiók ezzel az email címmel, elküldtük a tájékoztatót.' });
            }

            // Token generálás (32 bájtos véletlen string)
            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // Hash-eljük a tokent mielőtt mentjük 
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Mentés az adatbázisba (30 perc lejárattal)
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; 
            await user.save();

            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password/${resetToken}`;

            // Email küldés
            EmailService.sendPasswordResetEmail(user.email, resetUrl)
                .catch(err => console.error("Email hiba elfelejtett jelszónál:", err.message));

            return res.status(200).json({
                success: true,
                message: 'A jelszó visszaállító linket elküldtük az email címére.'
            });

        } catch (error) {
            console.error("FORGOT PASSWORD HIBA:", error);
            return res.status(500).json({ success: false, message: 'Hiba a folyamat során!' });
        }
    },

    // 5. JELSZÓ VISSZAÁLLÍTÁS - Új jelszó mentése
    async resetPassword(req, res) {
        try {
            const { token } = req.params;
            const { password, confirmPassword } = req.body;

            if (!password || password !== confirmPassword) {
                return res.status(400).json({ success: false, message: 'A jelszavak nem egyeznek!' });
            }

            // A kapott tokent is hash-eljük, hogy összevessük a tárolttal
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            // Keresés érvényes és még le nem járt token alapján
            const user = await db.User.findOne({
                where: {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: { [Op.gt]: Date.now() } 
                }
            });

            if (!user) {
                return res.status(400).json({ success: false, message: 'A link érvénytelen vagy lejárt!' });
            }

            // Új jelszó mentése (bcrypt-tel hash-elve)
            user.password = bcrypt.hashSync(password, 10);
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'A jelszó sikeresen megváltoztatva! Most már bejelentkezhet.'
            });

        } catch (error) {
            console.error("RESET PASSWORD HIBA:", error);
            return res.status(500).json({ success: false, message: 'Hiba a jelszó visszaállítása során!' });
        }
    }      
};

export default AuthController;
