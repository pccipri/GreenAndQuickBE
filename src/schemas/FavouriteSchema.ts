import mongoose, { Schema, Types } from "mongoose";

export interface FavouriteDocument extends Document {
  user: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const favouriteSchema = new Schema<FavouriteDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product', required: true }],
}, {
  timestamps: true,
});

export const Favourite = mongoose.model<FavouriteDocument>('Favourite', favouriteSchema);