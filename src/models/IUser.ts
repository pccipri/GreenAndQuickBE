import IAddress from './IAddress';
import { Types } from 'mongoose';
import { IUserSettings } from './IUserSettings';

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'customer' | 'admin' | 'shopOwner';
  firstName: string | null;
  lastName: string | null;
  avatarPath: string | null;
  addresses: IAddress[];
  userSettings?: Types.ObjectId | IUserSettings;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber: string | null;
  googleId: string | null;
  isActive: boolean;
}

export interface UserSettingsDto {
  userId: string;
  preferredLanguage: 'en' | 'ro';
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDto extends Omit<IUser, '_id' | 'avatarPath' | 'password' | 'userSettings'> {
  id: string;
  avatarUrl: string | null;
  userSettings?: UserSettingsDto;
}

export type ICreateUserDTO = Omit<IUser, '_id' | 'createdAt' | 'updatedAt' | 'isActive'>;
