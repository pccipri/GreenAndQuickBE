import mongoose from 'mongoose';
import ICategory from '../models/ICategory';
const { Schema } = mongoose;

export interface CategoryDocument extends Document, ICategory {}

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    fileType: { type: String },
    fileName: { type: String },
    size: { type: Number },
    data: { type: Buffer },
  },
});

export const Category = mongoose.model('Category', categorySchema);
