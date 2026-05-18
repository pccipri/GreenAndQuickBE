import express from 'express';
import { connectToDatabase } from './config/db';
import { configEnvs } from './config/env';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import apiController from './config/v1';
import Stripe from 'stripe';
import cookieParser from 'cookie-parser';
import passport from './config/passport';
import { errorHandler } from './middlewares/errorHandler';
import { ensureStorageBuckets } from './libs/supabase/supabaseBuckets';
import './config/i18n'; // Initialize i18n

dotenv.config();

export const stripe = new Stripe(configEnvs.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
});

const app = express();

const corsOptions = {
  origin: configEnvs.CORS_WHITELIST_URL,
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Special middleware for Stripe Webhook to capture raw body
// This MUST be defined before express.json()
app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (req.originalUrl === '/api/webhooks/stripe') {
    bodyParser.raw({ type: 'application/json' })(req, res, next);
  } else if (req.originalUrl.startsWith('/api')) {
    express.json()(req, res, next);
  } else {
    next();
  }
});
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api', apiController);
app.use(errorHandler);

app.listen(configEnvs.PORT, () => {
  console.log(`Server is running on port ${configEnvs.PORT}`);

  connectToDatabase(
    `mongodb+srv://${configEnvs.MONGODB_USERNAME}:${configEnvs.MONGODB_PASSWORD}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${configEnvs.MONGODB_DB_NAME}`,
  );
  ensureStorageBuckets().catch((error) => {
    console.error(error);
  });
});
