import { Response, Request, Router } from 'express';
import { shopGroupService } from '../services/ShopGroupService';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireRole } from '@/middlewares/isAuthenticated';
import { IdParams, SlugParams } from '@/models/generic/Routes';

const router = Router();

/**
 * POST /shopGroup
 * Create a shop group (requires role 'shopOwner')
 */
router.post(
  '/',
  requireAuth,
  requireRole(['shopOwner']),
  asyncHandler(async (req: Request, res: Response) => {
    const group = await shopGroupService.create(req.user!._id, req.body);
    res.status(201).json(group);
  }),
);

/**
 * GET /shopGroup
 * List all active shop groups (Public)
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const groups = await shopGroupService.list();
    res.json(groups);
  }),
);

/**
 * GET /shopGroup/slug/:slug
 * Get shop group details by slug (Public)
 */
router.get(
  '/slug/:slug',
  asyncHandler(async (req: Request<SlugParams>, res: Response) => {
    const group = await shopGroupService.getBySlug(req.params.slug);
    res.json(group);
  }),
);

/**
 * GET /shopGroup/:id
 * Get shop group details by ID (Public)
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const group = await shopGroupService.getById(req.params.id);
    res.json(group);
  }),
);

/**
 * PUT /shopGroup/:id
 * Update shop group details (Owner or Admin)
 */
router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    const updated = await shopGroupService.update(req.params.id, req.body, req.user!._id, isAdmin);
    res.json(updated);
  }),
);

/**
 * DELETE /shopGroup/:id
 * Delete shop group (Admin or Owner)
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    await shopGroupService.remove(req.params.id, req.user!._id, isAdmin);
    res.json({ message: 'Shop group deleted successfully' });
  }),
);

export default router;
