import mongoose, { Schema, Types, Document } from 'mongoose';

export interface FavoriteDocument extends Document {
  userId: Types.ObjectId;
  targetType: 'recipe' | 'product' | 'shop';
  targetId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['recipe', 'product', 'shop'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate favorites per user/item
favoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

// Lookup index for fast retrieval of favorites by user and type
favoriteSchema.index({ userId: 1, targetType: 1 });

export const Favorite = mongoose.model<FavoriteDocument>('Favorite', favoriteSchema);
