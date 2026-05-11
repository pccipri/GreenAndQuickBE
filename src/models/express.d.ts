import { IUser } from './IUser';

declare global {
  namespace Express {
    // augment the User interface that Passport uses
    // This makes req.user automatically typed as IUser
    interface User extends IUser {}
  }
}

export {};
