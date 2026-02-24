import mongoose, { Schema, Types } from 'mongoose';
import { addressSchema } from './AddressSchema';

export interface OrderItem {
  productId: Types.ObjectId;
  quantity: number;
}

export interface OrderDocument extends Document {
  userId: Types.ObjectId;
  shopGroupId: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  paymentOption: 'cash' | 'stripe';
  deliveryOption: 'fanCourier';
  deliveryAddress: typeof addressSchema;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new Schema<OrderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopGroupId: { type: Schema.Types.ObjectId, ref: 'ShopGroup', required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    paymentOption: { type: String, enum: ['cash', 'stripe'], required: true },
    deliveryOption: { type: String, enum: ['fanCourier'], required: true },
    deliveryAddress: { type: addressSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export const Order = mongoose.model<OrderDocument>('Order', orderSchema);
