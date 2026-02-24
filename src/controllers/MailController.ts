import { Router, Request, Response } from 'express';
import { sendEmail } from '../utils/mailer';

const router = Router();

router.post('/sendEmail', async (req: Request, res: Response) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  try {
    await sendEmail(to, subject, text);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

export default router;
