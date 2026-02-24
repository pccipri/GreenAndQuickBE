export interface IRefreshToken {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}
