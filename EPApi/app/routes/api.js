import Router from 'express'
const router = Router()

import AuthController from '../controllers/authController.js';
import UserController from '../controllers/userController.js';
import verifyToken from '../middleware/authjwt.js';
import StaffController from '../controllers/staffController.js';
import BookingController from '../controllers/bookingController.js';
import SlotController from '../controllers/slotController.js';
import ConsultationController from '../controllers/consultationController.js';
 
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.get('/users', [verifyToken], UserController.index)
router.get('/users/:id', [verifyToken], UserController.show)
router.put('/users/:id/password', [verifyToken], UserController.updatePassword)
router.delete('/users/:id', [verifyToken], UserController.destroy)

router.get('/staff', StaffController.index);
router.get('/staff/:id', StaffController.show);
router.post('/staff', [verifyToken], StaffController.store);
router.put('/staff/:id', [verifyToken], StaffController.update);
router.delete('/staff/:id', [verifyToken], StaffController.destroy);

// --- PUBLIKUS PROFILOK (Pácienseknek nézelődni) ---

router.get('/', StaffController.index); //admin-nak (Email, belső ID-k, teljes User profil)

router.get('/consultations', [verifyToken], ConsultationController.index);
router.get('/consultations/:id', [verifyToken], ConsultationController.show);
router.post('/consultations', [verifyToken], ConsultationController.store);
router.put('/consultations/:id',[verifyToken], ConsultationController.update);
router.delete('/consultations/:id',[verifyToken], ConsultationController.destroy);

router.get('/slots', [verifyToken], SlotController.index);
router.get('/slots/:id', [verifyToken], SlotController.show);
router.post('/slots', [verifyToken], SlotController.store);
router.put('/slots/:id', [verifyToken], SlotController.update);
router.delete('/slots/:id', [verifyToken], SlotController.destroy);

router.get('/bookings', [verifyToken], BookingController.index);
router.get('/bookings/:id', BookingController.show);
//router.get('/my-bookings', [verifyToken], BookingController.myBookings);
router.post('/bookings', [verifyToken], BookingController.store);
router.put('/bookings/:id', [verifyToken], BookingController.update);
router.delete('/bookings/:id', [verifyToken], BookingController.destroy);
 
export default router
