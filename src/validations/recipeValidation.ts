import {
  INGREDIENT_UNITS,
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  MEAL_TYPES,
  DIFFICULTIES,
  DURATION_TYPES,
} from '@/utils/constants';
import { jsonString } from '@/utils/helpers';
import { Types } from 'mongoose';
import { z } from 'zod';

const ingredientSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.number().positive(),
  unit: z.enum(INGREDIENT_UNITS),
});

const nutritionValueSchema = z.object({
  label: z.enum(NUTRIENT_LABELS),
  value: z.number().nonnegative(),
  unit: z.enum(NUTRIENT_UNITS),
});

const nutritionPerPortionSchema = z.object({
  energyKcal: z.number().nonnegative(),
  energyKj: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  saturates: z.number().nonnegative(),
  carbohydrates: z.number().nonnegative(),
  sugars: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  salt: z.number().nonnegative(),
});

const instructionSchema = z.object({
  stepNumber: z.number().int().min(1),
  description: z.string().min(1).max(1000),
});

export const createRecipeSchema = z.object({
  title: z.string().min(3).max(200),
  shortDescription: z.string().min(10).max(1000),
  ingredients: jsonString(z.array(ingredientSchema).min(1)),
  instructions: jsonString(z.array(instructionSchema).min(1)),
  mealType: z.enum(MEAL_TYPES),
  difficulty: z.enum(DIFFICULTIES).nullable().optional(),
  tags: jsonString(z.array(z.string()).nullable().optional()),
  servings: z.coerce.number().int().min(1),
  duration: z.coerce.number().int().min(1),
  durationType: z.enum(DURATION_TYPES),
  nutritionPerPortion: jsonString(nutritionPerPortionSchema.nullable().optional()),
  nutritionValues: jsonString(z.array(nutritionValueSchema).nullable().optional()),
  isPublished: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

export const updateRecipeSchema = createRecipeSchema.partial().extend({
  removeMainImage: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  removeInstructionImages: jsonString(z.array(z.boolean())).optional(),
});

export const recipeIdParamSchema = z.object({
  id: z.string().refine(Types.ObjectId.isValid, 'recipe.invalidId'),
});

export const shopRecipeSchema = z.object({
  ingredients: z
    .array(z.string())
    .min(1, 'recipe.ingredientsRequired')
    .max(30, 'recipe.tooManyIngredients'),
});
