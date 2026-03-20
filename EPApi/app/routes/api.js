import Router from 'express'
const router = Router()

import AuthController from '../controllers/authController.js';
import UserController from '../controllers/userController.js';
import verifyToken from '../middleware/authjwt.js';
import StaffController from '../controllers/staffController.js';
import BookingController from '../controllers/bookingController.js';
import SlotController from '../controllers/slotController.js';
import ConsultationController from '../controllers/consultationController.js';
import checkRole from '../middleware/checkRole.js';

 
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.get('/verify-email/:token', AuthController.verifyEmail)

router.post('/users/:id/password', [verifyToken, checkRole(2)], UserController.updatePassword);

router.get('/users', [verifyToken, checkRole(2)], UserController.index);
router.get('/users/:id', [verifyToken], UserController.show);
//router.post('/profile/password', [verifyToken], UserController.updateMyPassword);

// Archiválás (Soft delete)
router.delete('/users/:id', [verifyToken, checkRole(2)], UserController.destroy);
// ÚJ: Státusz váltás (Az isActive switch-hez a táblázatban)
router.post('/users/:id/status', [verifyToken, checkRole(2)], UserController.updateStatus);
// ÚJ: Általános adatok (név, email) módosítása
router.put('/users/:id/', [verifyToken, checkRole(2)], UserController.update);
// --- STAFF (Szakemberek) ---
router.get('/staff', [verifyToken], StaffController.index);
router.post('/staff/promote', [verifyToken, checkRole(2)], StaffController.promoteToStaff);
router.post('/staff', [verifyToken, checkRole(2)], StaffController.store);
router.get('/staff/:id/treatments', StaffController.getTreatmentsForStaff);
// KEZELÉSEK
router.post('/staff/:id/treatments', [verifyToken, checkRole(2)], StaffController.assignTreatments);

router.post('/staff/assignTreatments', [verifyToken, checkRole(2)], StaffController.assignTreatments);

// Egyedi szakember műveletek
router.get('/staff/:id', StaffController.show);
router.post('/staff/:id', [verifyToken, checkRole(2)], StaffController.update);
router.put('/staff/:id', [verifyToken, checkRole(2)], StaffController.update);
router.delete('/staff/:id', [verifyToken, checkRole(2)], StaffController.destroy);

router.get('/admin/all-users', [verifyToken, checkRole(2)], StaffController.index);

router.get('/consultations', ConsultationController.index);
router.get('/consultations/:id', ConsultationController.show);
router.post('/consultations', [verifyToken, checkRole(2)], ConsultationController.store);
router.post('/consultations/:id',[verifyToken, checkRole(2)], ConsultationController.update);
router.put('/consultations/:id', [verifyToken, checkRole(2)], ConsultationController.update);
router.delete('/consultations/:id',[verifyToken, checkRole(2)], ConsultationController.destroy);

router.get('/slots', [verifyToken], SlotController.index);
router.get('/slots/:id', [verifyToken], SlotController.show);
router.post('/slots', [verifyToken], SlotController.store);
router.post('/slots/:id', [verifyToken], SlotController.update);
router.delete('/slots/:id', [verifyToken], SlotController.destroy);

router.get('/bookings', [verifyToken], BookingController.index);
router.get('/bookings/:id', BookingController.show);
//router.get('/my-bookings', [verifyToken], BookingController.myBookings);
router.post('/bookings', [verifyToken], BookingController.store);
router.post('/bookings/:id', [verifyToken], BookingController.update);
router.delete('/bookings/:id', [verifyToken], BookingController.destroy);
 
export default router
