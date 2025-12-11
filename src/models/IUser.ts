import IAddress from './IAddress';

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'shopOwner';
  firstName: string;
  lastName: string;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  phoneNumber: string;
  isVerified: boolean;
}

export interface ICreateUserDTO {
  username: string;
  email: string;
  password: string;
}

