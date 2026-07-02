import { z } from 'zod';
import { plainText, richText } from './common';

/**
 * Validation schema for Shop creation including CUI.
 * CUI is a string of 2-10 digits.
 */
export const createShopSchema = z.object({
  name: plainText(2, 100),
  description: richText(10, 1000),
  cui: z.string().regex(/^[0-9]{2,10}$/, 'Invalid CUI format'),
  location: z
    .object({
      street: plainText(1, 200),
      city: plainText(1, 100),
      county: plainText(1, 100),
      country: plainText(1, 100),
      zipcode: plainText(1, 20),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .nullable(),
    })
    .nullable(),
});

export const updateShopSchema = createShopSchema.partial();
