import mongoose, { Schema, Types } from 'mongoose';
import { AddressDocument, addressSchema } from './AddressSchema';
import { OrderItem, orderItemSchema } from './OrderSchema';

export interface SubscriptionDocument extends Document {
  userId: Types.ObjectId;
  products: OrderItem[];
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDeliveryDate: Date;
  isActive: boolean;
  deliveryAddress: AddressDocument;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: { type: [orderItemSchema], required: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    nextDeliveryDate: { type: Date, required: true },
    isActive: { type: Boolean, required: true, default: true },
    deliveryAddress: { type: addressSchema, required: true },
  },
  { timestamps: true },
);

export const Subscription = mongoose.model<SubscriptionDocument>(
  'Subscription',
  subscriptionSchema,
);
