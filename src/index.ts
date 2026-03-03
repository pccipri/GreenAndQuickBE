import express from 'express';
import { connectToDatabase } from './config/db';
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

const PORT = process.env.PORT || 3001;
const name = process.env.MONGODB_USERNAME || 'username';
const password = process.env.MONGODB_PASSWORD || 'password';
const dbName = process.env.MONGODB_DB_NAME || 'dbName';
const ALLOWED_URL = process.env.CORS_WHITELIST_URL || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key';
export const PASSPORT_SECRET = process.env.PASSPORT_SECRET || 'mySecret';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'api_key_placeholder');

const app = express();

app.use(express.json());

const corsOptions = {
  origin: ALLOWED_URL,
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  connectToDatabase(
    `mongodb+srv://${name}:${password}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${dbName}`,
  );
  ensureStorageBuckets().catch((error) => {
    console.error(error);
  });
});
