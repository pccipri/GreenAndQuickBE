import { normalizeRating } from '@/middlewares/normalizeRating';
import { normalizeTitleAndSlug } from '@/middlewares/normalizeTitleAndSlug';
import {
  DIFFICULTIES,
  DURATION_TYPES,
  INGREDIENT_UNITS,
  MEAL_TYPES,
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
} from '@/utils/constants';
import mongoose, { InferSchemaType, Model, Schema, Types } from 'mongoose';

const ingredientSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true, enum: INGREDIENT_UNITS },
  },
  { _id: false },
);

const nutritionValueSchema = new Schema(
  {
    label: { type: String, required: true, enum: NUTRIENT_LABELS },
    value: { type: Number, required: true },
    unit: { type: String, required: true, enum: NUTRIENT_UNITS },
  },
  { _id: false },
);

const nutritionPerPortionSchema = new Schema(
  {
    energyKcal: { type: Number, required: true, min: 0 },
    energyKj: { type: Number, required: true, min: 0 },

    fat: { type: Number, required: true, min: 0 },
    saturates: { type: Number, required: true, min: 0 },

    carbohydrates: { type: Number, required: true, min: 0 },
    sugars: { type: Number, required: true, min: 0 },

    protein: { type: Number, required: true, min: 0 },
    salt: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const recipeSchema = new Schema(
  {
    authorId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 1000 },
    ingredients: { type: [ingredientSchema], required: true, default: [] },
    instructions: { type: [String], required: true, default: [] },
    mealType: { type: String, required: true, enum: MEAL_TYPES, index: true },
    difficulty: { type: String, enum: DIFFICULTIES },
    tags: { type: [String], default: [], index: true },
    servings: { type: Number, required: true, min: 1 },
    nutritionPerPortion: { type: nutritionPerPortionSchema, required: false },
    duration: { type: Number, required: true, min: 1 },
    durationType: { type: String, required: true, enum: DURATION_TYPES },
    imageUrl: { type: String, required: false, trim: true },
    nutritionValues: { type: [nutritionValueSchema], required: false, default: undefined },
    isPublished: { type: Boolean, default: false, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },
    slug: { type: String, trim: true, lowercase: true, index: true },
  },
  { timestamps: true },
);

recipeSchema.index({ isPublished: 1, mealType: 1 });

recipeSchema.index(
  { title: 'text', shortDescription: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, shortDescription: 1 } },
);

recipeSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
  const update = this.getUpdate();
  if (!update) return;
  normalizeRating(update as any);
  normalizeTitleAndSlug(update as any);
  next();
});

recipeSchema.pre('validate', function () {
  if (!this.slug && this.title) {
    this.slug = String(this.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);
  }
});

export type RecipeDoc = InferSchemaType<typeof recipeSchema> & {
  _id: Types.ObjectId;
};

export const Recipe: Model<RecipeDoc> =
  mongoose.models.Recipe || mongoose.model<RecipeDoc>('Recipe', recipeSchema);
