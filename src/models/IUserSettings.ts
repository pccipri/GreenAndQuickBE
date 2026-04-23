import { Document, Types } from 'mongoose';

export interface IUserSettings extends Document {
  userId: Types.ObjectId;
  preferredLanguage: 'en' | 'ro';
  currency?: string; // For future use
  createdAt: Date;
  updatedAt: Date;
}
