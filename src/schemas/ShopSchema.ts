import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';
import { normalizeNameAndSlug } from '@/middlewares/normalizeNameAndSlug';

const shopSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    logo: { type: String, default: null },
    coverImage: { type: String, default: null },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    location: {
      type: new Schema(
        {
          street: { type: String, required: true },
          city: { type: String, required: true },
          county: { type: String, required: true },
          country: { type: String, required: true },
          zipcode: { type: String, required: true },
          coordinates: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null },
          },
        },
        { _id: false },
      ),
      default: null,
    },
    isActive: { type: Boolean, default: true, index: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

shopSchema.index({ name: 'text', description: 'text' }, { weights: { name: 10, description: 5 } });

shopSchema.pre('validate', function () {
  if (this.isNew || this.isModified('name')) {
    this.slug = normalizeNameAndSlug(this.name);
  }
});

shopSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  const update = this.getUpdate() as any;
  if (update && update.name) {
    update.slug = normalizeNameAndSlug(update.name);
  }
});

shopSchema.post(['findOneAndDelete', 'deleteOne'], async function (doc) {
  if (doc) {
    const Review = mongoose.model('review');
    // When a shop is deleted, we remove shop reviews.
    // Note: Product reviews are handled separately by the Product schema cascade.
    await Review.deleteMany({ targetType: 'shop', targetId: doc._id });
  }
});

export type ShopDoc = InferSchemaType<typeof shopSchema> & {
  _id: Types.ObjectId;
};

export const Shop: Model<ShopDoc> =
  mongoose.models.shop || mongoose.model<ShopDoc>('shop', shopSchema);
