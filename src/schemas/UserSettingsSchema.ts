import mongoose, { Schema } from 'mongoose';
import { IUserSettings } from '../models/IUserSettings';

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ro'],
      default: 'en',
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  {
    timestamps: true,
  },
);

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
export default UserSettingsSchema;
