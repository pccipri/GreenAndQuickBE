import express from "express";
import { connectToDatabase } from "./config/db";
import cors from "cors";
import dotenv from 'dotenv'
import bodyParser from "body-parser";
import apiController from "./config/v1";
import session from 'express-session';
import passport from "passport";

dotenv.config();

const PORT = process.env.PORT || 3001;
const name = process.env.MONGODB_USERNAME || "username"
const password = process.env.MONGODB_PASSWORD || "password"
const dbName = process.env.MONGODB_DB_NAME || "dbName"
const ALLOWED_URL = process.env.CORS_WHITELIST_URL || '';
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key';
export const PASSPORT_SECRET = process.env.PASSPORT_SECRET || 'mySecret';


const app = express();

app.use(express.json());

const corsOptions = {
    origin: ALLOWED_URL,
    credentials: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(
  session({
    secret: PASSPORT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Set session expiration time to 3 hour
      maxAge: 3 * 60 * 60 * 1000,
      // Set session expiration time to 3 seconds (Testing purposes)
      // maxAge: 3000,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api', apiController);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  connectToDatabase(`mongodb+srv://${name}:${password}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${dbName}`);
});


