import mongoose, { Document } from 'mongoose';
import IAddress from '../models/IAddress';
import { USER_ROLES } from '../utils/constants';
const { Schema } = mongoose;

export interface UserDocument extends Document {
  accountType: string;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  addresses: IAddress[];
}

const userSchema = new Schema({
  accountType: {
    type: String,
    enum: USER_ROLES,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  addresses: [
    {
      street: { type: String },
      city: { type: String },
      county: { type: String },
      country: { type: String },
      zipcode: { type: String },
      isDefault: { type: Number },
    },
  ],
});

export const User = mongoose.model('User', userSchema);
