import { jsonString } from '@/utils/helpers';
import { z } from 'zod';

const shopLocationSchema = z.object({
  street: z.string().min(1, 'shop.location.streetRequired'),
  city: z.string().min(1, 'shop.location.cityRequired'),
  county: z.string().min(1, 'shop.location.countyRequired'),
  country: z.string().min(1, 'shop.location.countryRequired'),
  zipcode: z.string().min(1, 'shop.location.zipcodeRequired'),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .nullable()
    .optional(),
});

export const createShopSchema = z.object({
  name: z.string().min(3, 'shop.nameTooShort').max(100, 'shop.nameTooLong'),
  description: z.string().min(10, 'shop.descriptionTooShort').max(1000, 'shop.descriptionTooLong'),
  location: jsonString(shopLocationSchema).nullable().optional(),
});

export const updateShopSchema = createShopSchema.partial();
