import { Router, Request, Response } from 'express';
import { stripe } from '..';
import { stripeWebhookService } from '@/services/StripeWebhookService';
import { configEnvs } from '@/config/env';
import Stripe from 'stripe';

const router = Router();

router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, configEnvs.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    await stripeWebhookService.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
  } else if (event.type === 'payment_intent.payment_failed') {
    await stripeWebhookService.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
  } else if (event.type === 'charge.refunded') {
    await stripeWebhookService.handleChargeRefunded(event.data.object as Stripe.Charge);
  }

  res.json({ received: true });
});

export default router;
