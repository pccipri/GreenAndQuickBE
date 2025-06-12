import mongoose, { Schema, Types } from "mongoose";

export interface ReviewDocument extends Document {
  user: Types.ObjectId;
  product?: Types.ObjectId;
  shop?: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
    rating: { type: Number, required: true },
    comment: { type: String }
  },
  { timestamps: true }
);

// exactly one of `product` or `shop` must be set
reviewSchema.pre('validate', function (next) {
  const hasProduct = !!this.product;
  const hasShop = !!this.shop;

  if (hasProduct === hasShop) {
    return next(
      new mongoose.Error.ValidationError(Error('Review must be associated with either a product or a shop, but not both.'))
    );
  }

  next();
});

export const Review = mongoose.model<ReviewDocument>('Review', reviewSchema);