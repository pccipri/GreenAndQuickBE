import express from "express";
import cors from "cors";
import dotenv from 'dotenv'
import bodyParser from "body-parser";
import apiController from "./config/v1";
import { connectToDatabase } from "./config/db";

dotenv.config();

const PORT = process.env.PORT || 3001;
const name = process.env.name || "username"
const password = process.env.password || "password"
const dbName = process.env.dbName || "dbName"
const ALLOWED_URL = process.env.CORS_WHITELIST_URL || '';

const app = express();

const corsOptions = {
    origin: ALLOWED_URL,
    credentials: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api', apiController);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  connectToDatabase(`mongodb+srv://${name}:${password}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${dbName}`);
});


