import nodemailer from 'nodemailer';
import dotenvFlow from 'dotenv-flow';
import log from '../utils/logger.js';
dotenvFlow.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, 
  port: process.env.EMAIL_PORT || 2525,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  },
  tls: { 
    rejectUnauthorized: false, 
  }
});

const COLORS = {
  darkBlue: '#002C5A', 
  silver: '#C0C0C0',   
  white: '#FFFFFF',    
  text: '#333333',    
  lightGray: '#F5F7FA' 
};

export const EmailService = {
  async sendWelcomeEmail(userEmail, userName, verifyUrl, lang = 'hu') {
    const content = {
      hu: {
        sub: 'Üdvözlünk az ElitPort rendszerében!',
        h1: 'Üdvözlünk!',
        p1: `Kedves ${userName}! Köszönjük, hogy regisztráltál az <strong>Elit Klinika</strong> online rendszerébe. Már csak egy lépés választ el a teljes hozzáféréstől.`,
        btn: 'Email cím megerősítése',
        foot: 'Ha a gomb nem működik, másold be ezt a linket:',
        auto: 'Ez egy automatikus üzenet az ElitPort rendszeréből.'
      },
      en: {
        sub: 'Welcome to the ElitPort system!',
        h1: 'Welcome!',
        p1: `Dear ${userName}! Thank you for registering at <strong>Elit Clinic</strong> online system. You are just one step away from full access.`,
        btn: 'Verify Email Address',
        foot: 'If the button does not work, copy this link:',
        auto: 'This is an automated message from the ElitPort system.'
      }
    }[lang] || content.hu;

    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: content.sub,
        html: `
                <div style="font-family: Arial, sans-serif; color: ${COLORS.text}; max-width: 600px; margin: auto; border: 1px solid ${COLORS.silver}; background-color: ${COLORS.white}; padding: 20px;"> 
                    <div style="text-align: center; border-bottom: 3px solid ${COLORS.darkBlue}; padding-bottom: 20px; margin-bottom: 20px;">
                        <h1 style="color: ${COLORS.darkBlue}; margin: 0; font-size: 24px;">${content.h1}</h1>
                    </div>
                    <p style="font-size: 16px; line-height: 1.5;">${content.p1}</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verifyUrl}" style="background: ${COLORS.darkBlue}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            ${content.btn}
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #666;">${content.foot} ${verifyUrl}</p>
                    <hr style="border: 0; border-top: 1px solid ${COLORS.silver}; margin-top: 40px; margin-bottom: 10px;">
                    <p style="font-size: 11px; color: ${COLORS.darkBlue}; text-align: center;">${content.auto}</p>
                    </div>`
      });
      log(`SUCCESS - Welcome email sent to: ${userEmail}`);
      return info;
    } catch (error) {
      log(`ERROR - Email failed to ${userEmail}: ${error.message}`);
      throw error; 
    }
  },

  async sendBookingConfirmation(userEmail, bookingData, lang = 'hu') {
    const subjects = {
      hu: 'Sikeres időpontfoglalás - ElitPort',
      en: 'Booking Confirmation - ElitPort'
    };
    try {
      const info = await transporter.sendMail({
        from: `"Elit Klinika" <${process.env.EMAIL_USER}>`, 
        to: userEmail,
        subject: subjects[lang] || subjects.hu,
        html: `
                <div style="font-family: Arial, sans-serif; color: ${COLORS.text}; max-width: 600px; margin: auto; border: 1px solid ${COLORS.silver}; background-color: ${COLORS.white}; padding: 0;"> 
                    <div style="background-color: ${COLORS.darkBlue}; padding: 20px; text-align: center;">
                        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 24px;">
                            ${lang === 'hu' ? 'Foglalás visszaigazolása' : 'Booking Confirmation'}
                        </h1>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="font-size: 16px;">${lang === 'hu' ? 'Tisztelt Páciensünk!' : 'Dear Patient!'}</p>
                        <p>${lang === 'hu' ? 'Sikeresen rögzítettük az időpontját az <strong>Elit Klinikán</strong>:' : 'Your appointment has been successfully recorded at <strong>Elit Clinic</strong>:'}</p>
                        
                        <div style="background-color: ${COLORS.lightGray}; border: 1px solid ${COLORS.silver}; padding: 20px; border-radius: 8px;">
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 16px; line-height: 1.8;">
                                <li><strong style="color: ${COLORS.darkBlue};">${lang === 'hu' ? 'Vizsgálat' : 'Treatment'}:</strong> ${bookingData.name || '-'}</li>
                                <li><strong style="color: ${COLORS.darkBlue};">${lang === 'hu' ? 'Dátum/Időpont' : 'Date/Time'}:</strong> ${bookingData.appointment_date || '-'}</li>
                                <li><strong style="color: ${COLORS.darkBlue};">${lang === 'hu' ? 'Ár' : 'Price'}:</strong> ${bookingData.price ? bookingData.price + (lang === 'hu' ? ' Ft' : ' HUF') : '-'}</li>
                                <li><strong style="color: ${COLORS.darkBlue};">${lang === 'hu' ? 'Megjegyzés' : 'Notes'}:</strong> ${bookingData.notes || '-'}</li>
                            </ul>
                        </div>
                        <p style="margin-top: 20px;">${lang === 'hu' ? 'Kérjük, érkezzen 10 perccel előbb.' : 'Please arrive 10 minutes before your appointment.'}</p>
                        <p style="margin-top: 30px;">${lang === 'hu' ? 'Várjuk szeretettel!' : 'We look forward to seeing you!'}</p>
                    </div>
                    
                    <div style="background-color: ${COLORS.lightGray}; border-top: 1px solid ${COLORS.silver}; padding: 15px; text-align: center;">
                        <p style="font-size: 11px;">${lang === 'hu' ? 'Ez egy automatikus üzenet, kérjük ne válaszoljon rá.' : 'This is an automated message, please do not reply.'}</p>
                    </div>
                </div>
                `
      });
      return info;
    } catch (error) {
      throw new Error('EMAILS.MESSAGES.SEND_ERROR', { cause: error });
    }
  },
  async sendPasswordResetEmail(userEmail, resetUrl, lang = 'hu') {
    const subjects = {
      hu: 'Jelszó visszaállítás - ElitPort',
      en: 'Password Reset - ElitPort'
    };
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: subjects[lang] || subjects.hu,
        html: `
                <div style="font-family: Arial, sans-serif; color: ${COLORS.text}; max-width: 600px; margin: auto; border: 1px solid ${COLORS.silver}; background-color: ${COLORS.white}; padding: 0;"> 
                    <div style="background-color: ${COLORS.darkBlue}; padding: 20px; text-align: center;">
                        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 24px;">
                            ${lang === 'hu' ? 'Jelszó visszaállítás' : 'Password Reset'}
                        </h1>
                    </div>
                    
                    <div style="padding: 30px;">
                        <p style="font-size: 16px;">${lang === 'hu' ? 'Tisztelt Felhasználó!' : 'Dear User!'}</p>
                        <p>${lang === 'hu' 
    ? 'Úgy értesültünk, hogy elfelejtette jelszavát. Ha Ön kérte a visszaállítást, kattintson az alábbi gombra:' 
    : 'We received a request to reset your password. If you made this request, please click the button below:'}
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: ${COLORS.darkBlue}; color: ${COLORS.white}; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                ${lang === 'hu' ? 'Új jelszó megadása' : 'Reset Password'}
                            </a>
                        </div>
                        
                        <p style="font-size: 13px; color: #666;">
                            ${lang === 'hu' 
    ? 'A biztonság érdekében ez a link <strong>30 perc múlva lejár</strong>. Ha nem Ön kérte, hagyja figyelmen kívül.' 
    : 'For security reasons, this link will <strong>expire in 30 minutes</strong>. If you did not request this, please ignore this email.'}
                        </p>
                    </div>
                </div>
                `
      });
      return info;
    } catch (error) {
      log(`EMAIL_ERROR: ${userEmail} - ${error.message}`);
      throw new Error('EMAILS.MESSAGES.SEND_ERROR', { cause: error });
    }
  },
};

export const sendEmail = EmailService.sendWelcomeEmail;
