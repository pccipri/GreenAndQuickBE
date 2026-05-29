import { Router, Request, Response } from 'express';
import { requireAuth, requireActiveUser, requireRole } from '@/middlewares/isAuthenticated';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { validate } from '@/middlewares/validate';
import {
  createReviewSchema,
  listReviewsQuerySchema,
  reviewIdParamSchema,
  bulkDeleteReviewsSchema,
  adminListReviewsQuerySchema,
} from '@/validations/reviewValidation';
import {
  createReview,
  deleteReview,
  listReviews,
  adminListReviews,
  bulkDeleteReviews,
} from '../services/ReviewService';
import { toReviewDto } from '@/presenters/ReviewPresenter';
import { IdParams } from '@/models/generic/Routes';

const router = Router();

/**
 * GET /reviews
 * List reviews for a specific target with pagination (Public)
 */
router.get(
  '/',
  validate(listReviewsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await listReviews(req.query as any);
    res.json({
      ...result,
      reviews: result.reviews.map(toReviewDto),
    });
  }),
);

/**
 * POST /reviews
 * Create a review (requires auth + isActive)
 */
router.post(
  '/',
  requireAuth,
  requireActiveUser,
  validate(createReviewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const review = await createReview(req.user!._id, req.user!.isActive, req.body);
    // Convert to DTO to ensure consistent output format
    res.status(201).json(toReviewDto(review));
  }),
);

/**
 * DELETE /reviews/:id
 * Delete a review (Author or Admin)
 */
router.delete(
  '/:id',
  requireAuth,
  requireActiveUser,
  validate(reviewIdParamSchema, 'params'),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    await deleteReview(req.params.id, req.user!._id, isAdmin);
    res.status(204).end();
  }),
);

/**
 * GET /reviews/admin
 * List and search all reviews (Admin only)
 */
router.get(
  '/admin',
  requireAuth,
  requireActiveUser,
  requireRole(['admin']),
  validate(adminListReviewsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await adminListReviews(req.query as any);
    res.json({
      ...result,
      reviews: result.reviews.map(toReviewDto),
    });
  }),
);

/**
 * DELETE /admin/reviews
 * Bulk delete reviews (Admin only)
 */
router.delete(
  '/admin',
  requireAuth,
  requireActiveUser,
  requireRole(['admin']),
  validate(bulkDeleteReviewsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;
    const result = await bulkDeleteReviews(ids);
    res.json(result);
  }),
);

export default router;
