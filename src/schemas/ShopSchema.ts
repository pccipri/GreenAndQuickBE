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
  },
  { timestamps: true },
);

shopSchema.index({ name: 'text', description: 'text' }, { weights: { name: 10, description: 5 } });
shopSchema.index({ isActive: 1 });

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

export type ShopDoc = InferSchemaType<typeof shopSchema> & {
  _id: Types.ObjectId;
};

export const Shop: Model<ShopDoc> =
  mongoose.models.Shop || mongoose.model<ShopDoc>('Shop', shopSchema);
