import { Request, Response, Router } from 'express';
import { IOrder } from '../models/IOrder';
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  updateOrder,
} from '../services/OrderService';
import { IdParams } from '@/models/generic/Routes';

const router = Router();

// Create a new order
router.post('/', async (req: Request, res: Response) => {
  try {
    const order: IOrder = req.body;
    const response = await createOrder(order);
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({ error: 'order.createFailed' });
  }
});

// Get all orders
router.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: 'order.fetchAllFailed' });
  }
});

// Get order by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'order.notFound' });
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: 'order.fetchFailed' });
  }
});

// Get orders by user
router.get('/user/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id: userId } = req.params;
    const orders = await getOrdersByUser(userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: 'order.fetchByUserFailed' });
  }
});

// Update order
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const updatedOrder = await updateOrder(req.params.id, req.body);
    if (!updatedOrder) {
      res.status(404).json({ error: 'order.notFound' });
    }
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ error: 'order.updateFailed' });
  }
});

// Delete order
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const deleted = await deleteOrder(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'order.notFound' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'order.deleteFailed' });
  }
});

export default router;
