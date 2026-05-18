import { Request, Response, Router } from 'express';
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  getOrdersByShop,
  updateOrder,
} from '../services/OrderService';
import { IdParams } from '@/models/generic/Routes';
import { requireAuth, requireRole, requireActiveUser } from '@/middlewares/isAuthenticated';
import { asyncHandler } from '@/middlewares/asyncHandler';

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

// Get all orders
router.get(
  '/',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (_req: Request, res: Response) => {
    const orders = await getAllOrders();
    res.json(orders);
  }),
);

// Get order by ID
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'order.notFound' });
    }
    res.json(order);
  }),
);

// Get orders by user
router.get(
  '/user/:id',
  requireAuth,
  requireActiveUser,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    // Only the user themselves or an admin can fetch these orders
    if (req.user!.role !== 'admin' && req.user!._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'auth.forbidden' });
    }

    const orders = await getOrdersByUser(req.params.id);
    res.json(orders);
  }),
);

// Get orders by shop (for Shop Owners)
router.get(
  '/shop/:id',
  requireAuth,
  requireActiveUser,
  requireRole(['shopOwner', 'admin']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const orders = await getOrdersByShop(req.params.id);
    res.json(orders);
  }),
);

// Update payment status (e.g. mark cash as paid)
router.patch(
  '/:id/payment-status',
  requireAuth,
  requireActiveUser,
  requireRole(['shopOwner', 'admin']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { paymentStatus } = req.body;
    const updatedOrder = await updateOrder(
      req.params.id,
      { paymentStatus },
      req.user!._id.toString(),
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'order.notFound' });
    }

    res.json(updatedOrder);
  }),
);

// Update order
router.put(
  '/:id',
  requireAuth,
  requireActiveUser,
  requireRole(['admin', 'shopOwner']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const updatedOrder = await updateOrder(req.params.id, req.body, req.user!._id.toString());
    if (!updatedOrder) {
      return res.status(404).json({ error: 'order.notFound' });
    }
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
