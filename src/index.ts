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

dotenv.config();

export const stripe = new Stripe(configEnvs.STRIPE_SECRET_KEY);

const app = express();

app.use(express.json());

const corsOptions = {
  origin: configEnvs.CORS_WHITELIST_URL,
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(passport.initialize());
app.use(errorHandler);

app.use('/api', apiController);

app.listen(configEnvs.PORT, () => {
  console.log(`Server is running on port ${configEnvs.PORT}`);

  connectToDatabase(
    `mongodb+srv://${configEnvs.MONGODB_USERNAME}:${configEnvs.MONGODB_PASSWORD}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${configEnvs.MONGODB_DB_NAME}`,
  );
  ensureStorageBuckets().catch((error) => {
    console.error(error);
  });
});
