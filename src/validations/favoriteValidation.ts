import { z } from 'zod';
import { Types } from 'mongoose';

const targetTypeEnum = z.enum(['recipe', 'product', 'shop']);

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

export const addFavoriteSchema = z.object({
  body: z.object({
    targetType: targetTypeEnum,
    targetId: objectIdSchema,
  }),
});

export const getFavoritesQuerySchema = z.object({
  query: z.object({
    targetType: targetTypeEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const checkFavoriteQuerySchema = z.object({
  query: z.object({
    targetType: targetTypeEnum,
    targetId: objectIdSchema,
  }),
});

export const deleteFavoriteSchema = z.object({
  params: z.object({
    targetType: targetTypeEnum,
    targetId: objectIdSchema,
  }),
});
