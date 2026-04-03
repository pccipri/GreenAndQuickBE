import IAddress from './IAddress';

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'shopOwner';
  firstName: string | null;
  lastName: string | null;
  avatarPath: string | null;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  phoneNumber: string | null;
  googleId: string | null;
  isVerified: boolean;
}

export interface UserDto extends Omit<IUser, '_id' | 'avatarPath' | 'password'> {
  id: string;
  avatarUrl: string | null;
}

export type ICreateUserDTO = Omit<IUser, '_id' | 'createdAt' | 'updatedAt' | 'isVerified'>;
