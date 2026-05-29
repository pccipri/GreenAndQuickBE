import mongoose, { Document, Schema, Types } from 'mongoose';
import { REVIEW_TARGET_TYPES } from '../utils/constants';
import { updateTargetRating } from '../services/ReviewService';

export interface ReviewDocument extends Document {
  targetType: 'product' | 'shop' | 'recipe';
  targetId: Types.ObjectId;
  authorId: Types.ObjectId;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    targetType: {
      type: String,
      required: true,
      enum: REVIEW_TARGET_TYPES,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    comment: { type: String, maxlength: 1000, default: null },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound unique index to enforce one review per user per item
reviewSchema.index({ targetType: 1, targetId: 1, authorId: 1 }, { unique: true });

// Index to speed up aggregations by target
reviewSchema.index({ targetType: 1, targetId: 1 });

// Automatically update ratings after save
reviewSchema.post('save', function (doc) {
  updateTargetRating(doc.targetType, doc.targetId).catch((err) =>
    console.error(`Failed to update target rating on save: ${err.message}`),
  );
});

// Automatically update ratings after deletion (covers multiple deletion code-paths)
reviewSchema.post(['findOneAndDelete', 'deleteOne'], function (doc: any) {
  if (doc) {
    updateTargetRating(doc.targetType, doc.targetId).catch((err: any) =>
      console.error(`Failed to update target rating on delete: ${err.message}`),
    );
  }
});

export const Review = mongoose.model<ReviewDocument>('review', reviewSchema);
