import mongoose, { Schema } from "mongoose";
import ILocation from "../models/ILocation";

export interface LocationDocument extends Document, ILocation {}

const locationSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Replace 'User' with the actual user model once created
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
});

export const Location = mongoose.model<LocationDocument>('Location', locationSchema);
