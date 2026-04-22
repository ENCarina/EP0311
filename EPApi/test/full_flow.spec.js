import supertest from 'supertest';
import app from '../app/app.js';
import { expect } from 'chai';
import db from '../app/models/modrels.js';
import bcrypt from 'bcryptjs';

describe('🏗️ Teljes Rendszer Felépítése (Üres Adatbázis Teszt)', () => {
    let token, adminId, testConsultationId, testStaffId, testSlotId;
    const adminEmail = `system_admin_${Date.now()}@ep.com`;

    before(async function() {
        this.timeout(5000);
        try {
            // Szerepkörök létrehozása (mivel az adatbázis üres)
            await db.Role.bulkCreate([
                { id: 0, name: 'user' },
                { id: 1, name: 'staff' },
                { id: 2, name: 'admin' }
            ], { ignoreDuplicates: true });

            // Admin létrehozása a DB-ben
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            const admin = await db.User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                roleId: 2, 
                verified: true,
                isActive: true
            });
            adminId = admin.id;

            
            const res = await supertest(app).post('/api/login').send({
                email: adminEmail,
                password: 'admin123'
            });
            token = res.body.accessToken;
        } catch (error) {
            console.error('🔴 SETUP HIBA:', error);
            this.skip();
        }
    });

    it('1. SZAKASZ: Új szolgáltatás (Consultation) létrehozása', async () => {
        const res = await supertest(app)
            .post('/api/consultations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Általános Kivizsgálás',
                specialty: 'GENERAL',
                duration: 30,
                price: 15000
            });
        expect(res.status).to.equal(201);
        testConsultationId = res.body.data?.id || res.body.id;
    });
    it('2. SZAKASZ: Új orvos létrehozása (User + Staff egyben)', async () => {
        const res = await supertest(app)
            .post('/api/staff')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Dr. Teszt Orvos',
                email: `doctor_${Date.now()}@ep.com`, 
                password: 'doctor123',
                specialty: 'DENTISTRY',
                bio: 'Ez egy automatizált teszt során létrehozott szakmai profil.',
                roleId: 1, // Staff role
                treatmentIds: [testConsultationId] 
            });

        if (res.status !== 201) {
            console.log('🔴 HIBA:', res.body);
        }

        expect(res.status).to.equal(201);
        testStaffId = res.body.data.id; 
    });

    it('3. SZAKASZ: Egyedi Idősáv létrehozása és Foglalás', async () => {
        const slotRes = await supertest(app)
            .post('/api/slots')
            .set('Authorization', `Bearer ${token}`)
            .send({
                staffId: testStaffId,
                consultationId: testConsultationId,
                date: '2026-12-01',
                startTime: '10:00:00',
                endTime: '11:00:00',
                isAvailable: true
            });
        
        expect(slotRes.status).to.equal(201);
        const slotId = slotRes.body.data?.id || slotRes.body.id;

        // 2. Végrehajtjuk a foglalást
        const bookingRes = await supertest(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Teszt Foglalás',
                patientId: adminId,
                staffId: testStaffId,
                consultationId: testConsultationId,
                slotId: slotId,
                startTime: '2026-12-01T10:00:00.000Z',
                duration: 30,
                price: 15000
            });

        expect(bookingRes.status).to.equal(201);
    }); 
    
    it('4. SZAKASZ: Végleges Foglalás végrehajtása (Szigorú validációval)', async () => {
        const uniqueStartTime = '14:00:00'; 
        
        const freshSlotRes = await supertest(app)
            .post('/api/slots')
            .set('Authorization', `Bearer ${token}`)
            .send({
                staffId: testStaffId,
                consultationId: testConsultationId,
                date: '2026-12-05', 
                startTime: uniqueStartTime,
                endTime: '14:30:00',
                isAvailable: true
            });
        
        const freshSlotId = freshSlotRes.body.data?.id || freshSlotRes.body.id;

        // 2. Foglalás beküldése
        const res = await supertest(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                slotId: freshSlotId, 
                name: 'Teszt Páciens',
                staffId: testStaffId,
                consultationId: testConsultationId,
                startTime: '2026-12-05 14:00:00',
                duration: 30,
                price: 15000
            });

        if (res.status !== 201) {
            console.log('🔴 FOGLALÁS ELUTASÍTVA:', res.body);
        }

        expect(res.status).to.equal(201);
        expect(res.body.success).to.be.true;
    });
});