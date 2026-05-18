import { Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId;
  shopId: Types.ObjectId;
  quantity: number;
  priceAtAdd: number; // in cents
}

export interface ICart {
  _id: string;
  userId: string;
  items: ICartItem[];
}
