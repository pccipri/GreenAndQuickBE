import { Request, Response, Router } from 'express';
import {
  cancelOrder,
  createOrder,
  cancelOrderByShopOwner,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  getOrdersByShopOwner,
  updateOrderStatus,
} from '../services/OrderService';
import { IdParams } from '@/models/generic/Routes';
import { requireAuth, requireRole, requireActiveUser } from '@/middlewares/isAuthenticated';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { HttpError } from '@/middlewares/errorHandler';
import { Types } from 'mongoose';
import { Shop } from '@/schemas/ShopSchema';

const router = Router();

// Create a new order
// NOTE: Orders should primarily be created via /checkout or Stripe Webhooks.
// This endpoint is restricted to Admins for manual entries.
router.post(
  '/',
  requireAuth,
  requireActiveUser,
  requireRole(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const response = await createOrder(req.body);
    res.status(201).json(response);
  }),
);

/**
 * GET /orders
 * List current user's orders with pagination and filtering
 */
router.get(
  '/',
  requireAuth,
  requireActiveUser,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const { status, sort, page, limit } = req.query;

    const result = await getOrdersByUser(userId, {
      status: status as string,
      sort: sort as 'newest' | 'oldest',
      page: Number(page),
      limit: Number(limit),
    });

    res.json(result);
  }),
);

/**
 * GET /orders/admin
 * List all orders across all shops (Admin only)
 */
router.get(
  '/admin',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, customerId, shopId, page, limit, sort, search } = req.query;
    const orders = await getAllOrders({
      status: status as string,
      customerId: customerId as string,
      shopId: shopId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as 'newest' | 'oldest',
      search: search as string,
    });
    res.json(orders);
  }),
);

/**
 * PATCH /orders/admin/:id/status
 * Override order status (Admin only)
 */
router.patch(
  '/admin/:id/status',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { status, triggerRefund, reason } = req.body;
    const updatedOrder = await updateOrderStatus(
      req.params.id,
      status,
      req.user!._id.toString(),
      false, // isShopOwner
      true, // isAdmin
      triggerRefund === true || triggerRefund === 'true',
      reason,
    );
    res.json(updatedOrder);
  }),
);

// Get order by ID
router.get(
  '/:id',
  requireAuth,
  requireActiveUser,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const order = await getOrderById(req.params.id);
    if (!order) {
      throw new HttpError(404, 'order.notFound');
    }

    // Permission check: Owner, Admin, or involved Shop Owner
    const isOwner = order.customerId.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';

    let isShopOwner = false;
    if (req.user!.role === 'shopOwner') {
      const ownedShops = await Shop.find({ ownerId: new Types.ObjectId(req.user!._id) }).select(
        '_id',
      );
      const ownedShopIds = ownedShops.map((s) => s._id.toString());
      // Allow viewing if the shop owner has at least one item in this order
      isShopOwner = order.items.some((item: any) => ownedShopIds.includes(item.shopId.toString()));
    }

    if (!isOwner && !isAdmin && !isShopOwner) {
      throw new HttpError(403, 'auth.forbidden');
    }

    res.json(order);
  }),
);

/**
 * POST /orders/:id/cancel
 * Cancel a 'placed' or 'confirmed' order
 */
router.post(
  '/:id/cancel',
  requireAuth,
  requireActiveUser,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { reason } = req.body;
    const order = await cancelOrder(
      req.params.id,
      req.user!._id.toString(),
      req.user!.role === 'admin',
      reason,
    );
    res.json(order);
  }),
);

// Shop Owner Endpoints
/**
 * GET /shop/orders
 * List orders for the current shop owner's shops with pagination and filtering
 */
router.get(
  '/shop/orders',
  requireAuth,
  requireRole(['shopOwner', 'admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!._id.toString();
    const { status, sort, search, page, limit } = req.query;

    const result = await getOrdersByShopOwner(ownerId, {
      status: status as string,
      sort: sort as 'newest' | 'oldest',
      search: search as string,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  }),
);

/**
 * POST /shop/orders/:id/cancel
 * Shop owner cancels a 'placed' or 'confirmed' order
 */
router.post(
  '/shop/orders/:id/cancel',
  requireAuth,
  requireRole(['shopOwner', 'admin']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const order = await cancelOrderByShopOwner(
      req.params.id,
      req.user!._id.toString(),
      req.user!.role === 'admin',
    );
    res.json(order);
  }),
);

/**
 * PATCH /shop/orders/:id/status
 * Update order status (Shop Owner only)
 */
router.patch(
  '/shop/orders/:id/status',
  requireAuth,
  requireRole(['shopOwner', 'admin']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { status } = req.body;
    const updatedOrder = await updateOrderStatus(
      req.params.id,
      status,
      req.user!._id.toString(),
      true, // isShopOwner
      req.user!.role === 'admin',
    );
    res.json(updatedOrder);
  }),
);

// Delete order
router.delete(
  '/:id',
  requireAuth,
  requireActiveUser,
  requireRole(['admin']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const deleted = await deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'order.notFound' });
    }
    res.json({ message: 'Order deleted successfully' });
  }),
);

export default router;
