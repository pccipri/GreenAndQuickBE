import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';
import { normalizeNameAndSlug } from '@/middlewares/normalizeNameAndSlug';

const productSchema = new Schema(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 220 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    images: {
      type: [String],
      default: [],
      validate: [(val: string[]) => val.length <= 10, 'product.maxImagesExceeded'],
    }, // Max 10 images
    price: { type: Number, required: true, min: 0, set: (v: number) => Math.round(v) }, // Store in cents, ensure integer
    reducedPrice: {
      type: Number,
      default: null,
      min: 0,
      set: (v: number | null) => (v !== null ? Math.round(v) : null),
    },
    isAvailable: { type: Boolean, default: true, index: true },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true },
);

productSchema.index({ shopId: 1, slug: 1 }, { unique: true });
productSchema.index(
  { name: 'text', description: 'text' },
  { weights: { name: 10, description: 5 } },
);

productSchema.pre('validate', function () {
  if (this.isNew || this.isModified('name')) {
    this.slug = normalizeNameAndSlug(this.name);
  }
});

productSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  const update = this.getUpdate() as any;
  if (update && update.name) {
    update.slug = normalizeNameAndSlug(update.name);
  }
});

export type ProductDoc = InferSchemaType<typeof productSchema> & {
  _id: Types.ObjectId;
};

export const Product: Model<ProductDoc> =
  mongoose.models.Product || mongoose.model<ProductDoc>('Product', productSchema);
