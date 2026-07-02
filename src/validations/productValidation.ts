import { z } from 'zod';
import { Types } from 'mongoose';
import { jsonString } from '@/utils/helpers';
import {
  objectIdSchema,
  plainText,
  richText,
  searchQueryString,
  storagePathSchema,
} from './common';

export const createProductSchema = z.object({
  shopId: objectIdSchema,
  categoryId: objectIdSchema,
  name: plainText(3, 200),
  description: richText(10, 2000),
  price: z.coerce.number().min(0, 'product.priceNegative'),
  reducedPrice: z.coerce.number().min(0, 'product.reducedPriceNegative').nullable().optional(),
  isAvailable: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  stock: z.coerce.number().int().min(0, 'product.stockNegative').optional(),
  lowStockThreshold: z.coerce.number().int().min(0, 'product.lowStockThresholdNegative').optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  imagesToKeep: jsonString(z.array(storagePathSchema).optional()).optional(),
  imagesToDelete: jsonString(z.array(storagePathSchema).optional()).optional(),
});

export const searchProductsQuerySchema = z.object({
  q: searchQueryString,
  limit: z.coerce.number().int().min(1).max(30).default(10).optional(),
});

export const productListQuerySchema = z.object({
  search: searchQueryString.optional(),
  category: z.string().trim().max(100).optional(),
  shopId: z.string().refine(Types.ObjectId.isValid, 'product.invalidShopId').optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional(),
  available: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
