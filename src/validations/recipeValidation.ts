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
import { objectIdSchema, plainText, richText, searchQueryString } from './common';

const ingredientSchema = z.object({
  label: plainText(1, 100),
  value: z.number().positive(),
  unit: z.enum(INGREDIENT_UNITS),
  linkedProductId: z
    .string()
    .refine((val) => (val == null ? true : Types.ObjectId.isValid(val)), 'recipe.invalidProductId')
    .nullable()
    .optional(),
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
  description: richText(1, 1000),
});

export const createRecipeSchema = z.object({
  title: plainText(3, 200),
  shortDescription: richText(10, 1000),
  ingredients: jsonString(z.array(ingredientSchema).min(1)),
  instructions: jsonString(z.array(instructionSchema).min(1)),
  mealType: z.enum(MEAL_TYPES),
  difficulty: z.enum(DIFFICULTIES).nullable().optional(),
  dietaryTags: jsonString(z.array(z.string()).nullable().optional()),
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
  id: objectIdSchema,
});

export const shopRecipeSchema = z.object({
  ingredients: z
    .array(plainText(1, 100))
    .min(1, 'recipe.ingredientsRequired')
    .max(30, 'recipe.tooManyIngredients'),
});

export const recipeListQuerySchema = z.object({
  q: searchQueryString.optional(),
  mealType: z.enum(MEAL_TYPES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  dietaryTag: z.string().trim().max(50).optional(),
  dietaryTags: z.union([z.string(), z.array(z.string())]).optional(),
  authorId: objectIdSchema.optional(),
  isPublished: z.enum(['true', 'false']).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['new', 'rating', 'duration']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
