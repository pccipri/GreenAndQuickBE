import mongoose, { Document, Schema, Types } from 'mongoose';
import { addressSchema } from './AddressSchema';
import { baseAddressSchema } from './IBaseAddressSchema';
import IAddress from '@/models/IAddress';
import { IBaseAddress } from '@/models/IBaseAddress';

export interface IOrderItemDocument extends mongoose.Document {
  productId: Types.ObjectId;
  shopId: Types.ObjectId;
  quantity: number;
  priceAtPurchase: number;
}

export interface IOrderStatusHistoryEntryDocument extends mongoose.Document {
  status: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  changedAt: Date;
  changedBy: Types.ObjectId;
}

export interface IOrderDocument extends Document {
  customerId: Types.ObjectId;
  shopGroupId: Types.ObjectId | null;
  items: IOrderItemDocument[];
  totalAmount: number;
  paymentMethod: 'cash' | 'stripe';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  stripePaymentIntentId: string | null;
  status: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  statusHistory: IOrderStatusHistoryEntryDocument[];
  deliveryAddress: IAddress;
  pickupAddress: IBaseAddress;
  createdAt: Date;
  updatedAt: Date;
}

export const orderItemSchema = new Schema<IOrderItemDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    priceAtPurchase: { type: Number, required: true, min: 0 }, // Stored in cents
  },
  { _id: false },
);

export const orderStatusHistoryEntrySchema = new Schema<IOrderStatusHistoryEntryDocument>(
  {
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopGroupId: { type: Schema.Types.ObjectId, ref: 'ShopGroup', default: null },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'stripe'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    stripePaymentIntentId: { type: String, default: null },
    deliveryAddress: { type: addressSchema, required: true },
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
    statusHistory: { type: [orderStatusHistoryEntrySchema], default: [] },
    pickupAddress: { type: baseAddressSchema, required: true },
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
