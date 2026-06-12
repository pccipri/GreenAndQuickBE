import { z } from 'zod';

/**
 * Validation schema for Shop creation including CUI.
 * CUI is a string of 2-10 digits.
 */
export const createShopSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().min(10).max(1000),
    cui: z.string().regex(/^[0-9]{2,10}$/, 'Invalid CUI format'),
    location: z
      .object({
        street: z.string(),
        city: z.string(),
        county: z.string(),
        country: z.string(),
        zipcode: z.string(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .nullable(),
      })
      .nullable(),
  }),
});

export const updateShopSchema = createShopSchema.partial();
