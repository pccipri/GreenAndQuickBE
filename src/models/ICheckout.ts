import { Types } from 'mongoose';
import { IBaseAddress } from './IBaseAddress';
import { IOrderItem } from './IOrder';

export interface IOrderBucketInternal {
  shopGroupId: Types.ObjectId | null;
  pickupAddress: IBaseAddress;
  items: Array<{
    productId: Types.ObjectId;
    shopId: Types.ObjectId;
    quantity: number;
    priceAtPurchase: number;
  }>;
  totalAmount: number;
  shopIdsInBucket: Set<Types.ObjectId>; // Added for heuristic
}

export interface IOrderBucket {
  shopGroupId: Types.ObjectId | null;
  pickupAddress: IBaseAddress;
  items: IOrderItem[];
  totalAmount: number;
}
