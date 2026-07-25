import { z } from 'zod';
import { objectIdSchema } from './common';

export const createDietaryTagSchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'dietaryTag.keyRequired')
    .max(50, 'dietaryTag.keyTooLong')
    .regex(/^[a-z0-9\-]+$/, 'dietaryTag.invalidKey'),
});

export const dietaryTagIdParamSchema = z.object({
  id: objectIdSchema,
});
