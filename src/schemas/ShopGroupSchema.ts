import mongoose, { Types } from "mongoose";
import { AddressDocument, addressSchema } from "./AddressSchema";

const { Schema } = mongoose;

export interface ShopGroupDocument extends Document {
  name: string;
  description: string;
  shops: Types.ObjectId[];
  deliveryAddress: AddressDocument;
  createdAt: Date;
  updatedAt: Date;
}

const shopGroupSchema = new Schema<ShopGroupDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    shops: [{ type: Schema.Types.ObjectId, ref: 'Shop', required: true }],
    deliveryAddress: { type: addressSchema, required: true },
  },
  { timestamps: true }
);

export const ShopGroup = mongoose.model<ShopGroupDocument>('ShopGroup', shopGroupSchema);