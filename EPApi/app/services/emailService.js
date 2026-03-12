import nodemailer from 'nodemailer';
import dotenvFlow from 'dotenv-flow';
dotenvFlow.config();

const transporter = nodemailer.createTransport({
    host: "smtp.freemail.hu", 
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    },
    tls: { 
        rejectUnauthorized: false, 
        //ciphers: 'SSLv3'
    },
});

const COLORS = {
    darkBlue: '#002C5A', // Alapszín
    silver: '#C0C0C0',   // Szegélyek, kiegészítők
    white: '#FFFFFF',    // Háttér
    text: '#333333',    // Főszöveg
    lightGray: '#F5F7FA' // Kiemelt dobozok háttere
};

export const EmailService = {
    async sendWelcomeEmail(userEmail, userName) {
        try {
            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: 'Üdvözlünk az ElitPort rendszerében!',
                html: `
                <div style="font-family: Arial, sans-serif; color: ${COLORS.text}; max-width: 600px; margin: auto; border: 1px solid ${COLORS.silver}; background-color: ${COLORS.white}; padding: 20px;"> 
                    <div style="text-align: center; border-bottom: 3px solid ${COLORS.darkBlue}; padding-bottom: 20px; margin-bottom: 20px;">
                        <h1 style="color: ${COLORS.darkBlue}; margin: 0; font-size: 24px;">Üdvözlünk!</h1>
                    </div>
                    
                    <h2 style="color: ${COLORS.darkBlue}; font-size: 18px;">Kedves ${userName}!</h2>
                    <p style="font-size: 16px; line-height: 1.5;">
                        Köszönjük, hogy regisztráltál az <strong>Elit Klinika</strong> online rendszerébe. 
                        Mostantól egyszerűen, néhány kattintással foglalhatsz időpontot szakorvosainkhoz.
                    </p>
                    
                    <p style="margin-top: 30px; line-height: 1.5;">Várjuk szeretettel!</p>
                    
                    <hr style="border: 0; border-top: 1px solid ${COLORS.silver}; margin-top: 40px; margin-bottom: 10px;">
                    <p style="font-size: 12px; color: ${COLORS.darkBlue}; text-align: center; margin: 0;">Ez egy automatikus üzenet az ElitPort rendszeréből.</p>
                </div>
                `
            });
            console.log('Üdvözlő email elküldve:', info.messageId);
            return info;
        } catch (error) {
            console.error('Regisztrációs email hiba:', error);
            throw error; 
        }
    },

    async sendBookingConfirmation(userEmail, bookingData) {
        try {
            const mailOptions = {
                from: `"Elit Klinika" <${process.env.EMAIL_USER}>`, 
                to: userEmail,
                subject: 'Sikeres időpontfoglalás - ElitPort',
                html: `
                <div style="font-family: Arial, sans-serif; color: ${COLORS.text}; max-width: 600px; margin: auto; border: 1px solid ${COLORS.silver}; background-color: ${COLORS.white}; padding: 0;"> 
                    <div style="background-color: ${COLORS.darkBlue}; padding: 20px; text-align: center;">
                        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 24px;">Foglalás visszaigazolása</h1>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="font-size: 16px; line-height: 1.5;">Tisztelt Páciensünk!</p>
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 25px;">Sikeresen rögzítettük az időpontját az <strong>Elit Klinikán</strong>:</p>
                        
                        <div style="background-color: ${COLORS.lightGray}; border: 1px solid ${COLORS.silver}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 16px; line-height: 1.8;">
                                <li><strong style="color: ${COLORS.darkBlue};">Vizsgálat:</strong> ${bookingData.name || 'Orvosi vizsgálat'}</li>
                                <li><strong style="color: ${COLORS.darkBlue};">Dátum/Időpont:</strong> ${bookingData.appointment_date || 'Hamarosan pontosítjuk'}</li>
                                <li><strong style="color: ${COLORS.darkBlue};">Ár:</strong> ${bookingData.price ? bookingData.price + ' Ft' : '-'}</li>
                                <li><strong style="color: ${COLORS.darkBlue};">Megjegyzés:</strong> ${bookingData.notes || '-'}</li>
                            </ul>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.5;">Kérjük, érkezzen 10 perccel a megbeszélt időpont előtt.</p>
                        <p style="font-size: 16px; line-height: 1.5; margin-top: 30px;">Várjuk szeretettel!</p>
                    </div>
                    
                    <div style="background-color: ${COLORS.lightGray}; border-top: 1px solid ${COLORS.silver}; padding: 15px; text-align: center;">
                        <p style="font-size: 12px; color: ${COLORS.darkBlue}; margin: 0;">Ez egy automatikus üzenet, kérjük ne válaszoljon rá.</p>
                        <p style="font-size: 10px; color: ${COLORS.text}; margin-top: 5px;">© 2026 Elit Klinika - ElitPort</p>
                    </div>
                </div>
                `,
            };

            const info = await transporter.sendMail(mailOptions); 
            console.log('Foglalási email elküldve:', info.messageId);
            return info;
        } catch (error) {
            console.error('Foglalási email hiba:', error);
            throw error; 
        }
    }
};

export const sendEmail = EmailService.sendWelcomeEmail;
