import { stripe } from '@/libs/stripe';
import { Router } from 'express';
import path from 'path';

const router = Router();

router.get('/payments', async (req, res) => {
  const paymentIntents = await stripe.paymentIntents.list({
    limit: 3,
  });
  res.json(paymentIntents);
});

const resolve = path.resolve;

router.get('/success', async (req, res) => {
  const path = resolve(process.env.STATIC_DIR + '/success.html');
  res.sendFile(path);
});

export default router;
