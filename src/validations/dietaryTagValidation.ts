import { z } from 'zod';

export const createDietaryTagSchema = z.object({
  key: z
    .string()
    .min(1, 'dietaryTag.keyRequired')
    .max(50, 'dietaryTag.keyTooLong')
    .regex(/^[a-z0-9\-]+$/i, 'dietaryTag.invalidKey'),
});
