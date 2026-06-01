import Stripe from 'stripe';
import { configEnvs } from '@/config/env';

export const stripe = new Stripe(configEnvs.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
});
