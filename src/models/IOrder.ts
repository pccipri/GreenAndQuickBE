import IAddress from './IAddress';
import { IBaseAddress } from './IBaseAddress'; // Assuming IBaseAddress is defined elsewhere or will be created
import { Types } from 'mongoose';

export interface IOrderItem {
  productId: Types.ObjectId;
  shopId: Types.ObjectId;
  quantity: number;
  priceAtPurchase: number; // in cents
}

export interface IOrderStatusHistoryEntry {
  status: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  changedAt: Date;
  changedBy: Types.ObjectId; // ref to User (customer, shop owner, or admin)
}

export interface IOrder {
  _id: string;
  customerId: Types.ObjectId;
  shopGroupId: Types.ObjectId | null;
  items: IOrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'stripe';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  stripePaymentIntentId: string | null;
  status: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  statusHistory: IOrderStatusHistoryEntry[];
  deliveryAddress: IAddress;
  pickupAddress: IBaseAddress;
  createdAt: Date;
  updatedAt: Date;
}
