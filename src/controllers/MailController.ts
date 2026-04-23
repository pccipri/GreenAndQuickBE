import { Router, Request, Response } from 'express';
import { sendEmail } from '../utils/mailer';

const router = Router();

router.post('/sendEmail', async (req: Request, res: Response) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    res.status(400).json({ error: 'mail.missingFields' });
    return;
  }

  try {
    await sendEmail(to, subject, text);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'mail.sendFailed' });
  }
});

export default router;
