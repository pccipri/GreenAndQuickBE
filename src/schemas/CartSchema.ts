import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICartItemDocument extends Document {
  productId: Types.ObjectId;
  shopId: Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

export interface ICartDocument extends Document {
  userId: Types.ObjectId;
  items: ICartItemDocument[]; // Use array of subdocuments
}

export const cartItemSchema = new Schema<ICartItemDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtAdd: { type: Number, required: true, min: 0 }, // Stored in cents
  },
  { _id: false }, // Cart items are subdocuments, no need for their own _id
);

const cartSchema = new Schema<ICartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }, // Mongoose will manage createdAt and updatedAt
);

export const Cart = mongoose.model<ICartDocument>('Cart', cartSchema);
