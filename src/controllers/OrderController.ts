import { Request, Response, Router } from "express";
import { IOrder } from "../models/IOrder";
import { createOrder, deleteOrder, getAllOrders, getOrderById, getOrdersByUser, updateOrder } from "../services/OrderService";

const router = Router();

// Create a new order
router.post('/', async (req: Request, res: Response) => {
  try {
    const order: IOrder = req.body;
    const response = await createOrder(order);
    res.status(201).json(response);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Get all orders
router.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

// Get orders by user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const orders = await getOrdersByUser(req.params.userId);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Update order
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedOrder = await updateOrder(req.params.id, req.body);
    if (!updatedOrder) {
       res.status(404).json({ message: 'Order not found' });
    }
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
});

// Delete order
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteOrder(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
});

export default router;