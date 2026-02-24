import mongoose, { Types } from 'mongoose';
const { Schema } = mongoose;

export interface ProductDocument extends Document {
  shop: Types.ObjectId;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  reducedPrice?: number;
  category: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    reducedPrice: {
      type: Number,
      default: null,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true },
);
export const Product = mongoose.model<ProductDocument>('Product', productSchema);
