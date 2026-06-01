import { Router, Request, Response } from 'express';
import * as FavoriteService from '@/services/FavoriteService';
import { requireAuth, requireActiveUser } from '@/middlewares/isAuthenticated';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { validate } from '@/middlewares/validate';
import {
  addFavoriteSchema,
  getFavoritesQuerySchema,
  checkFavoriteQuerySchema,
  deleteFavoriteSchema,
} from '@/validations/favoriteValidation';

const router = Router();

// All favorites routes require authentication and an active user
router.use(requireAuth, requireActiveUser);

/**
 * POST /favorites
 * Add a new favorite
 */
router.post(
  '/',
  validate(addFavoriteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { targetType, targetId } = req.body;
    const userId = req.user!._id;

    const favorite = await FavoriteService.addFavorite(userId, targetType, targetId);
    res.status(201).json(favorite);
  }),
);

/**
 * GET /favorites
 * List user's favorites by type with pagination
 */
router.get(
  '/',
  validate(getFavoritesQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { targetType, page, limit } = req.query as any;
    const userId = req.user!._id;

    const favorites = await FavoriteService.listFavorites(
      userId,
      targetType,
      Number(page),
      Number(limit),
    );
    res.json(favorites);
  }),
);

/**
 * GET /favorites/check
 * Check if a specific item is favorited by the current user
 */
router.get(
  '/check',
  validate(checkFavoriteQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { targetType, targetId } = req.query as any;
    const userId = req.user!._id;

    const result = await FavoriteService.isFavorited(userId, targetType, targetId);
    res.json(result);
  }),
);

/**
 * DELETE /favorites/:targetType/:targetId
 * Remove a favorite
 */
router.delete(
  '/:targetType/:targetId',
  validate(deleteFavoriteSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { targetType, targetId } = req.params as { targetType: string; targetId: string };
    const userId = req.user!._id;

    const deleted = await FavoriteService.removeFavorite(userId, targetType, targetId);

    if (!deleted) {
      return res.status(404).json({ error: 'favorite.notFound' });
    }

    res.status(204).send();
  }),
);

export default router;
