import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedCardDocument extends Document {
  userId: Types.ObjectId;
  stripePaymentMethodId: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

const savedCardSchema = new Schema<ISavedCardDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripePaymentMethodId: { type: String, required: true, unique: true },
    last4: { type: String, required: true, minlength: 4, maxlength: 4 },
    brand: { type: String, required: true },
    expiryMonth: { type: Number, required: true, min: 1, max: 12 },
    expiryYear: {
      type: Number,
      required: true,
      min: new Date().getFullYear() - 1,
      max: new Date().getFullYear() + 20,
    }, // More robust validation
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Add an index to quickly find saved cards for a user
savedCardSchema.index({ userId: 1 });

export const SavedCard = mongoose.model<ISavedCardDocument>('SavedCard', savedCardSchema);
