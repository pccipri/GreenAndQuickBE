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
import type { InferSchemaType, Model } from 'mongoose';
import mongoose, { Schema, Types } from 'mongoose';

const ingredientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true, enum: INGREDIENT_UNITS },
    linkedProductId: { type: Types.ObjectId, ref: 'product', required: false },
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

const recipeInstructionSchema = new Schema(
  {
    stepNumber: { type: Number, required: true, min: 1 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    imagePath: { type: String, default: null },
  },
  { _id: false },
);

const recipeSchema = new Schema(
  {
    authorId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 1000 },
    ingredients: { type: [ingredientSchema], required: true, default: [] },
    instructions: {
      type: [recipeInstructionSchema],
      required: true,
      default: [],
      validate: {
        validator: (val: any[]) => {
          const stepNumbers = val.map((v) => v.stepNumber);
          return new Set(stepNumbers).size === stepNumbers.length;
        },
        message: 'recipe.duplicateStepNumbers',
      },
    },
    mealType: { type: String, required: true, enum: MEAL_TYPES, index: true },
    difficulty: { type: String, enum: DIFFICULTIES },
    dietaryTags: { type: [String], default: [], index: true },
    servings: { type: Number, required: true, min: 1 },
    nutritionPerPortion: { type: nutritionPerPortionSchema, required: false },
    duration: { type: Number, required: true, min: 1 },
    durationType: { type: String, required: true, enum: DURATION_TYPES },
    imagePath: { type: String, default: null },
    nutritionValues: { type: [nutritionValueSchema], required: false, default: undefined },
    isPublished: { type: Boolean, default: true, index: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },
    slug: { type: String, trim: true, lowercase: true, unique: true, index: true },
  },
  { timestamps: true },
);

recipeSchema.index({ isPublished: 1, mealType: 1 });
// Index for reverse lookup: find recipes that reference a specific product
recipeSchema.index({ 'ingredients.linkedProductId': 1 });
// Index for text search on recipe title, description, and ingredient names
recipeSchema.index(
  { title: 'text', shortDescription: 'text', 'ingredients.name': 'text' },
  { weights: { title: 10, shortDescription: 1, 'ingredients.name': 2 } },
);

recipeSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function () {
  const update = this.getUpdate();
  if (!update) return;
  normalizeRating(update as any);
  normalizeTitleAndSlug(update as any);
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

recipeSchema.post(['findOneAndDelete', 'deleteOne'], async function (doc) {
  if (doc) {
    const Review = mongoose.model('review');
    await Review.deleteMany({ targetType: 'recipe', targetId: doc._id });
  }
});

export type RecipeDoc = InferSchemaType<typeof recipeSchema> & {
  _id: Types.ObjectId;
};

export const Recipe: Model<RecipeDoc> =
  mongoose.models.recipe || mongoose.model<RecipeDoc>('recipe', recipeSchema);
