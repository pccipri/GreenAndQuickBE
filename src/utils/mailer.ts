import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import dotenv from 'dotenv';
import i18next from 'i18next';
import '../config/i18n';
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

export async function sendVerificationEmail(
  email: string,
  token: string,
  language: string = 'en',
  userName: string = 'there',
) {
  const url = `http://localhost:3000/auth/verifyRegister/${token}`;
  const subject = i18next.t('verifySubject', { ns: 'emails', lng: language });
  const body = i18next
    .t('verifyBody', {
      ns: 'emails',
      lng: language,
      userName,
      link: url,
    })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: email,
    subject,
    html: `<div>${body}</div>`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  language: string = 'en',
  userName: string = 'there',
) {
  const url = `${configEnvs.PASSWORD_RESET_URL}/${token}`;
  const subject = i18next.t('resetPasswordSubject', { ns: 'emails', lng: language });
  const body = i18next
    .t('resetPasswordBody', {
      ns: 'emails',
      lng: language,
      userName,
      link: url,
    })
    .replace(/\n/g, '<br/>');

  await transporter.sendMail({
    from: configEnvs.SMTP_USER,
    to: email,
    subject,
    html: `<div>${body}</div>`,
  });
}
