import mongoose, { Schema, Types } from 'mongoose';

export interface FavoriteDocument extends Document {
  user: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product', required: true }],
  },
  {
    timestamps: true,
  },
);

export const Favorite = mongoose.model<FavoriteDocument>('Favorite', favoriteSchema);
