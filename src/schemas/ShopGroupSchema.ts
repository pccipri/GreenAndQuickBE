import mongoose, { Document, Schema, Types } from 'mongoose';
import { baseAddressSchema } from './IBaseAddressSchema';
import { IBaseAddress } from '@/models/IBaseAddress';

export interface ShopGroupDocument extends Document {
  name: string;
  slug: string;
  description: string | null;
  ownerId: Types.ObjectId;
  shops: Types.ObjectId[];
  pickupAddress: IBaseAddress;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shopGroupSchema = new Schema<ShopGroupDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shops: [{ type: Schema.Types.ObjectId, ref: 'Shop', required: true }],
    pickupAddress: { type: baseAddressSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ShopGroup = mongoose.model<ShopGroupDocument>('ShopGroup', shopGroupSchema);
