import mongoose, { Schema, Types } from "mongoose";
import { AddressDocument, addressSchema } from "./AddressSchema";
interface SubscriptionProduct {
  productId: Types.ObjectId;
  quantity: number;
}

export interface SubscriptionDocument extends Document {
  userId: Types.ObjectId;
  products: SubscriptionProduct[];
  frequency: 'daily' | 'weekly' | 'monthly';
  nextDeliveryDate: Date;
  isActive: boolean;
  deliveryAddress: AddressDocument;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionProductSchema = new Schema<SubscriptionProduct>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: { type: [subscriptionProductSchema], required: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    nextDeliveryDate: { type: Date, required: true },
    isActive: { type: Boolean, required: true, default: true },
    deliveryAddress: { type: addressSchema, required: true },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema);