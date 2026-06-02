import { Response, Request, Router } from 'express';
import { shopGroupService } from '../services/ShopGroupService';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireRole } from '@/middlewares/isAuthenticated';
import { IdParams, SlugParams, IdParamsWithOptionalId } from '@/models/generic/Routes';
import {
  createGroupSchema,
  updateGroupSchema,
  inviteShopSchema,
  respondInviteSchema,
} from '@/validations/shopGroupValidation';
import { validate } from '@/middlewares/validate'; // Assuming a validate middleware exists

const router = Router();

/**
 * POST /shopGroup
 * Create a shop group (requires role 'shopOwner')
 */
router.post(
  '/',
  requireAuth,
  requireRole(['shopOwner']),
  validate(createGroupSchema),
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
  asyncHandler(async (req, res) => {
    const { search, page, limit } = req.query;
    const result = await shopGroupService.list(
      search as string,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 10,
    );
    res.json(result);
  }),
);

/**
 * GET /shop-groups/me/invitations
 * List pending invitations received by the current shop owner
 * Defined before /:slug to prevent collision
 */
router.get(
  '/me/invitations',
  requireAuth,
  requireRole(['shopOwner']),
  asyncHandler(async (req: Request, res: Response) => {
    const invitations = await shopGroupService.getInvitationsForShop(req.user!._id);
    res.json(invitations);
  }),
);

/**
 * GET /shop-groups/:slug
 * Get shop group details by slug (Public)
 */
router.get(
  '/:slug',
  asyncHandler(async (req: Request<SlugParams>, res: Response) => {
    const group = await shopGroupService.getBySlug(req.params.slug);
    res.json(group);
  }),
);

/**
 * PATCH /shop-groups/:id
 * Update shop group details (Owner or Admin)
 */
router.patch(
  '/:id',
  requireAuth,
  validate(updateGroupSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    const updated = await shopGroupService.update(req.params.id, req.body, req.user!._id, isAdmin);
    res.json(updated);
  }),
);

/**
 * DELETE /shop-groups/:id
 * Deactivate shop group (Admin or Owner) - Soft delete
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    await shopGroupService.deactivateGroup(req.params.id, req.user!._id, isAdmin);
    res.json({ message: 'Shop group deactivated successfully' });
  }),
);

/**
 * DELETE /shop-groups/:id/shops/:shopId
 * Remove a shop from group or leave group (Group owner or the shop owner leaving)
 */
router.delete(
  '/:id/shops/:shopId',
  requireAuth,
  requireRole(['shopOwner']),
  asyncHandler(async (req: Request<IdParams & { shopId: string }>, res: Response) => {
    await shopGroupService.leaveGroup(req.params.id, req.params.shopId, req.user!._id);
    res.json({ message: 'Shop successfully removed from group' });
  }),
);

/**
 * POST /shop-groups/:id/invitations
 * Send invitation to a shop (Group owner only)
 */
router.post(
  '/:id/invitations',
  requireAuth,
  requireRole(['shopOwner']),
  validate(inviteShopSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { shopId } = req.body;
    const invitation = await shopGroupService.sendInvitation(req.params.id, shopId, req.user!._id);
    res.status(201).json(invitation);
  }),
);

/**
 * GET /shop-groups/:id/invitations
 * List invitations for a group (Group owner only)
 */
router.get(
  '/:id/invitations',
  requireAuth,
  requireRole(['shopOwner']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { status } = req.query;
    const invitations = await shopGroupService.getInvitationsForGroup(
      req.params.id,
      req.user!._id,
      status as string,
    );
    res.json(invitations);
  }),
);

/**
 * PATCH /shop-groups/:groupId/invitations/:invitationId
 * Respond to invitation (Invited shop owner only)
 */
router.patch(
  '/:groupId/invitations/:invitationId',
  requireAuth,
  requireRole(['shopOwner']),
  validate(respondInviteSchema),
  asyncHandler(
    async (
      req: Request<IdParamsWithOptionalId & { groupId: string; invitationId: string }>,
      res: Response,
    ) => {
      const { status } = req.body;
      const invitation = await shopGroupService.respondToInvitation(
        req.params.invitationId,
        req.user!._id,
        status,
      );
      res.json(invitation);
    },
  ),
);

export default router;
