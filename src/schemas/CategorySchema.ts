import mongoose from 'mongoose';
const { Schema } = mongoose;

export interface CategoryDocument extends Document {
  name: string;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>({
  name: { type: String, required: true, unique: true },
  isGlobal: { type: Boolean, default: false }
}, { timestamps: true });

export const Category = mongoose.model<CategoryDocument>('Category', categorySchema);