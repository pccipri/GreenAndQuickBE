import mongoose, { Types } from 'mongoose';

const { Schema } = mongoose;

export interface InventoryItemDocument extends Document {
  productId: Types.ObjectId;
  shopId: Types.ObjectId;
  stock: number;
  lowStockThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<InventoryItemDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
  },
  { timestamps: true },
);

export const InventoryItem = mongoose.model<InventoryItemDocument>(
  'InventoryItem',
  inventoryItemSchema,
);
