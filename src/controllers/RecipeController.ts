import { asyncHandler } from '../middlewares/asyncHandler';
import { recipeService } from '@/services/RecipeService';
import { requireAuth } from '@/middlewares/isAuthenticated';
import { IdParams, SlugParams } from '@/models/generic/Routes';
import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /recipes
 * List recipes (published for public; published + own drafts for authed)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const authorId = req.user?._id || null;
    const result = await recipeService.list(authorId, req.query as any);
    res.json(result);
  }),
);

/**
 * GET /recipes/slug/:slug
 * Fetch recipe by slug (draft visible only to owner)
 */
router.get(
  '/slug/:slug',
  requireAuth,
  asyncHandler(async (req: Request<SlugParams>, res: Response) => {
    const authorId = req.user?._id || null;
    const doc = await recipeService.getBySlug(authorId, req.params.slug);
    res.json(doc);
  }),
);

/**
 * GET /recipes/:id
 * Fetch recipe by id (draft visible only to owner)
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const authorId = req.user?._id || null;
    const doc = await recipeService.getById(authorId, req.params.id);
    res.json(doc);
  }),
);

/**
 * POST /recipes
 * Create a recipe (requires auth)
 */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const doc = await recipeService.create(req.user!._id, req.body);
    res.status(201).json(doc);
  }),
);

/**
 * PATCH /recipes/:id
 * Update a recipe (requires auth + owner)
 */
router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const doc = await recipeService.update(req.user!._id, req.params.id, req.body);
    res.json(doc);
  }),
);

/**
 * DELETE /recipes/:id
 * Delete a recipe (requires auth + owner)
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const result = await recipeService.remove(req.user!._id, req.params.id);
    res.json(result);
  }),
);

export default router;
