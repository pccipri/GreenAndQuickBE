import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import dotenv from 'dotenv';
import { configEnvs } from '@/config/env';

dotenv.config();

const transporter: Transporter = nodemailer.createTransport({
  service: configEnvs.SMTP_SERVICE,
  auth: {
    user: configEnvs.SMTP_USER,
    pass: configEnvs.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
  const mailOptions: SendMailOptions = {
    from: configEnvs.SMTP_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};

export async function sendVerificationEmail(email: string, token: string) {
  const url = `http://localhost:3000/auth/verifyRegister/${token}`;
  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: email,
    subject: 'Verify Your Account',
    html: `<p>Click <a href="${url}">here</a> to verify your account. Link expires in 1h.</p>`,
  });
}
