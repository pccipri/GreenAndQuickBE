import { z } from 'zod';

/**
 * Validation schema for updating product stock levels.
 */
export const updateStockSchema = z.object({
  stock: z.number().int().min(0),
});

/**
 * Validation schema for toggling product availability.
 */
export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});
