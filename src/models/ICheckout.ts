import { Types } from 'mongoose';
import { IBaseAddress } from './IBaseAddress';
import { IOrderItem } from './IOrder';

export interface IOrderBucket {
  shopGroupId: Types.ObjectId | null;
  pickupAddress: IBaseAddress;
  items: IOrderItem[];
  totalAmount: number;
}
