import { Types } from 'mongoose';

export interface ISavedCard {
  _id: string;
  userId: Types.ObjectId;
  stripePaymentMethodId: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: Date;
}
