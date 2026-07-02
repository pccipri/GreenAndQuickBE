import { z } from 'zod';
import { REVIEW_TARGET_TYPES } from '../utils/constants';
import { objectIdSchema, optionalSafeSearchString, plainText } from './common';

const reviewTargetTypeEnum = z.enum(REVIEW_TARGET_TYPES);

export const createReviewSchema = z.object({
  targetType: reviewTargetTypeEnum,
  targetId: objectIdSchema,
  rating: z.number().int().min(1).max(5, {
    message: 'Rating must be an integer between 1 and 5',
  }),
  comment: z.union([z.null(), plainText(1, 1000)]).optional(),
});

export const listReviewsQuerySchema = z.object({
  targetType: reviewTargetTypeEnum,
  targetId: objectIdSchema,
  page: z
    .preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1))
    .optional(),
  limit: z
    .preprocess((val) => (val ? Number(val) : 10), z.number().int().min(1).max(100).default(10))
    .optional(),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest').optional(),
});

export const reviewIdParamSchema = z.object({
  id: objectIdSchema,
});

export const bulkDeleteReviewsSchema = z.object({
  ids: z.array(objectIdSchema).min(1, { message: 'At least one review ID is required' }),
});

export const adminListReviewsQuerySchema = z.object({
  targetType: reviewTargetTypeEnum.optional(),
  targetId: objectIdSchema.optional(),
  authorId: objectIdSchema.optional(),
  search: optionalSafeSearchString,
  page: z
    .preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1))
    .optional(),
  limit: z
    .preprocess((val) => (val ? Number(val) : 20), z.number().int().min(1).max(100).default(20))
    .optional(),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest').optional(),
});
