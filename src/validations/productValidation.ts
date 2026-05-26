import { z } from 'zod';
import { Types } from 'mongoose';
import { jsonString } from '@/utils/helpers';

export const createProductSchema = z.object({
  shopId: z.string().refine(Types.ObjectId.isValid, 'product.invalidShopId'),
  categoryId: z.string().refine(Types.ObjectId.isValid, 'product.invalidCategoryId'),
  name: z.string().min(3, 'product.nameTooShort').max(200, 'product.nameTooLong'),
  description: z
    .string()
    .min(10, 'product.descriptionTooShort')
    .max(2000, 'product.descriptionTooLong'),
  price: z.coerce.number().min(0, 'product.priceNegative'),
  reducedPrice: z.coerce.number().min(0, 'product.reducedPriceNegative').nullable().optional(),
  isAvailable: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  stock: z.coerce.number().int().min(0, 'product.stockNegative').optional(),
  lowStockThreshold: z.coerce.number().int().min(0, 'product.lowStockThresholdNegative').optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  // For image management during updates
  // `imagesToKeep` will be an array of existing image paths that should remain
  imagesToKeep: jsonString(z.array(z.string()).optional()).optional(),
  // `imagesToDelete` will be an array of existing image paths that should be removed
  imagesToDelete: jsonString(z.array(z.string()).optional()).optional(),
  // `newImages` are handled by multer, not directly validated here
});

export const searchProductsQuerySchema = z.object({
  q: z.string().min(1, 'product.searchQueryRequired'),
  limit: z.coerce.number().int().min(1).max(30).default(10).optional(),
});

export const productListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(), // category slug
  shopId: z.string().refine(Types.ObjectId.isValid, 'product.invalidShopId').optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional(),
  available: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
