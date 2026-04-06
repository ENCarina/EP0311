import { Router } from 'express'; 
const router = Router();

import AuthController from '../controllers/authController.js';
import UserController from '../controllers/userController.js';
import verifyToken from '../middleware/authjwt.js';
import StaffController from '../controllers/staffController.js';
import BookingController from '../controllers/bookingController.js';
import SlotController from '../controllers/slotController.js';
import ConsultationController from '../controllers/consultationController.js';
import checkRole from '../middleware/checkRole.js';

// --- AUTH ---
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// --- MY PROFILE ---
router.get('/profile/me', [verifyToken], UserController.getMyProfile); 
router.put('/profile/update', [verifyToken], UserController.updateMyProfile);

// --- USERS (Admin) ---
router.get('/users', [verifyToken, checkRole(2)], UserController.index);
router.get('/users/:id', [verifyToken], UserController.show);

router.post('/users/:id/password', [verifyToken, checkRole(2)], UserController.updatePassword);
router.post('/users/:id/status', [verifyToken, checkRole(2)], UserController.updateStatus);
router.put('/users/:id', [verifyToken, checkRole(2)], UserController.update);
router.delete('/users/:id', [verifyToken, checkRole(2)], UserController.destroy);


// --- STAFF (Szakemberek) ---
router.get('/staff', StaffController.index); 
router.get('/staff/public', StaffController.getPublicProfiles); 
router.get('/staff/:id/treatments', StaffController.getTreatmentsForStaff); 
router.post('/staff/:id/treatments', [verifyToken, checkRole(2)], StaffController.assignTreatments);
router.get('/staff/:id', StaffController.show);
router.post('/staff', [verifyToken, checkRole(2)], StaffController.store);
router.put('/staff/:id', [verifyToken, checkRole(2)], StaffController.update);
router.delete('/staff/:id', [verifyToken, checkRole(2)], StaffController.destroy);

router.post('/staff/promote', [verifyToken, checkRole(2)], StaffController.promoteToStaff);

// --- CONSULTATIONS, SLOTS, BOOKINGS (Maradnak változatlanul) ---
router.get('/consultations', ConsultationController.index);
router.get('/consultations/:id', ConsultationController.show);
router.post('/consultations', [verifyToken, checkRole(2)], ConsultationController.store);
router.put('/consultations/:id', [verifyToken, checkRole(2)], ConsultationController.update);
router.delete('/consultations/:id', [verifyToken, checkRole(2)], ConsultationController.destroy);

router.get('/slots', SlotController.index);
router.get('/slots/:id', [verifyToken], SlotController.show);
router.post('/slots', [verifyToken, checkRole(1)], SlotController.store);
router.post('/slots/generate', [verifyToken], SlotController.bulkGenerate);
router.put('/slots/:id', [verifyToken], SlotController.update);
router.delete('/slots/:id', [verifyToken], SlotController.destroy);

router.get('/bookings', [verifyToken], BookingController.index);
router.get('/bookings/:id', [verifyToken], BookingController.show);
router.post('/bookings', [verifyToken], BookingController.store);
router.put('/bookings/:id', [verifyToken], BookingController.update);
router.delete('/bookings/:id', [verifyToken], BookingController.destroy);

export default router;