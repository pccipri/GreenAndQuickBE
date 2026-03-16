import mongoose, { Document } from 'mongoose';
import { addressSchema } from './AddressSchema';

const { Schema } = mongoose;
export interface UserDocument extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'shopOwner';
  firstName: string;
  avatarPath: string | null;
  lastName: string;
  phoneNumber: string;
  addresses: (typeof addressSchema)[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    avatarPath: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin', 'shopOwner'], required: true },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    addresses: [addressSchema],
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = mongoose.model<UserDocument>('User', userSchema);
