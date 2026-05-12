import mongoose, { Model } from 'mongoose';
import { normalizeNameAndSlug } from '@/middlewares/normalizeNameAndSlug';
const { Schema } = mongoose;

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
  },
  { timestamps: true },
);

categorySchema.pre('validate', function () {
  if (this.isNew || this.isModified('name')) {
    this.slug = normalizeNameAndSlug(this.name);
  }
});

categorySchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  const update = this.getUpdate() as any;
  if (update && update.name) {
    update.slug = normalizeNameAndSlug(update.name);
  }
});

export const Category: Model<CategoryDocument> = mongoose.model<CategoryDocument>(
  'Category',
  categorySchema,
);
