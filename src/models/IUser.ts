import IAddress from './IAddress';

export default interface IUser {
  accountType: string;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  addresses: IAddress[];
}
