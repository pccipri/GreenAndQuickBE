import { z } from 'zod';
import { objectIdSchema, optionalSafeSearchString } from './common';

export const orderListQuerySchema = z.object({
  status: z.string().trim().max(50).optional(),
  customerId: objectIdSchema.optional(),
  shopId: objectIdSchema.optional(),
  search: optionalSafeSearchString,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(['newest', 'oldest']).optional(),
});
