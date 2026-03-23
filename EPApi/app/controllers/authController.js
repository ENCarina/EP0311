import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import dotenvFlow from 'dotenv-flow';
import crypto from 'crypto';
import { EmailService } from '../services/emailService.js';

dotenvFlow.config();

const AuthController = {
    // 1. REGISZTRÁCIÓ
    async register(req, res) {
        try {
            const { name, email, password, confirmPassword } = req.body;

            // Alapvető validációk
            if (!name || !email || !password || !confirmPassword) {
                return res.status(400).json({ success: false, message: 'Minden mező kitöltése kötelező!' });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ success: false, message: 'A két jelszó nem egyezik!' });
            }

            const userExists = await User.findOne({ where: { email } });
            if (userExists) {
                return res.status(400).json({ success: false, message: 'Ez az email cím már foglalt!' });
            }

            // Token generálás az email megerősítéshez
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verifyUrl = `${process.env.APP_URL}verify-email/${verificationToken}`;

            // Felhasználó létrehozása
            const newUser = await User.create({
                name,
                email,
                password: bcrypt.hashSync(password, 10),
                roleId: 0, // Alapértelmezett páciens role
                verificationToken,
                verified: false,
                isActive: true
            });

            // Email küldés (nem blokkolja a választ, ha elbukik, a user már létrejött)
            EmailService.sendWelcomeEmail(newUser.email, newUser.name, verifyUrl)
                .catch(err => console.error("Email küldési hiba a regisztrációnál:", err.message));

            return res.status(201).json({
                success: true,
                message: 'Regisztráció sikeres! Kérjük, igazolja vissza email címét.',
                data: { id: newUser.id, name: newUser.name, email: newUser.email }
            });

        } catch (error) {
            return res.status(500).json({ success: false, message: 'Hiba a regisztráció során!', error: error.message });
        }
    },

    // 2. EMAIL VISSZAIGAZOLÁS
    async verifyEmail(req, res) {
        try {
            const user = await User.findOne({ where: { verificationToken: req.params.token } });
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'Érvénytelen vagy lejárt megerősítő token!' });
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
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Hiányzó email vagy jelszó!' });
            }

            const user = await User.findOne({ where: { email } });
            
            if (!user || !user.isActive) {
                return res.status(401).json({ success: false, message: 'Érvénytelen e-mail vagy inaktív fiók!' });
            }

            // Jelszó ellenőrzés
            const passwordIsValid = await bcrypt.compare(password, user.password);
            if (!passwordIsValid) {
                return res.status(401).json({ success: false, message: 'Érvénytelen jelszó!' });
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
    }
};

export default AuthController;
