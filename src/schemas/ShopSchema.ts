import mongoose, { Types } from 'mongoose';
import { addressSchema } from './AddressSchema';

const { Schema } = mongoose;

export interface ShopDocument extends Document {
  name: string;
  description: string;
  // imageUrl: string;
  owner: Types.ObjectId;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<ShopDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    // imageUrl: { type: String, required: true },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // ✅ Enforce one shop per user
    },
    categories: { type: [String], required: true, default: [] },
  },
  { timestamps: true },
);

export const Shop = mongoose.model<ShopDocument>('Shop', shopSchema);
