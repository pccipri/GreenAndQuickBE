import mongoose from 'mongoose';
import IProduct from '../models/IProduct';
import ICategory from '../models/ICategory';
const { Schema } = mongoose;

export interface ProductDocument extends Omit<Document, 'location'>, IProduct<string | ICategory> {}

const productSchema = new Schema<ProductDocument>({
  name: { type: String, required: true },
  image: {
    fileType: { type: String },
    fileName: { type: String },
    size: { type: Number },
    data: { type: Buffer },
  },
  price: { type: Number, required: true },
  reducedPrice: { type: Number, default: null },
  // TO-DO: To be replaced after the locations feature is implemented
  location: { type: String, default: null },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
});

export const Product = mongoose.model('Product', productSchema);
