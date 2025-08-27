import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter: Transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string
): Promise<void> => {
  const mailOptions: SendMailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};
