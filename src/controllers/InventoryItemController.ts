import { Router, Request, Response } from 'express';
import {
  adjustInventoryStock,
  createInventoryItem,
  deleteInventoryItem,
  getAllInventoryItems,
  getInventoryByProduct,
  getInventoryByShop,
  getInventoryItemById,
  getLowStockItems,
  updateInventoryItem,
} from '../services/InventoryItemService';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const item = await createInventoryItem(req.body);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: 'inventory.createFailed' });
  }
});

router.get('/', async (_req, res) => {
  try {
    const items = await getAllInventoryItems();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: 'inventory.fetchAllFailed' });
  }
});

router.get('/lowStock', async (_req, res) => {
  try {
    const items = await getLowStockItems();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: 'inventory.fetchLowStockFailed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await getInventoryItemById(req.params.id);
    if (!item) res.status(404).json({ error: 'inventory.notFound' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: 'inventory.fetchFailed' });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const items = await getInventoryByProduct(req.params.productId);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: 'inventory.fetchByProductFailed' });
  }
});

router.get('/shop/:shopId', async (req, res) => {
  try {
    const items = await getInventoryByShop(req.params.shopId);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: 'inventory.fetchByShopFailed' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await updateInventoryItem(req.params.id, req.body);
    if (!updated) res.status(404).json({ error: 'inventory.notFound' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: 'inventory.updateFailed' });
  }
});

router.patch('/:id/adjust', async (req, res) => {
  try {
    const { delta } = req.body;
    const updated = await adjustInventoryStock(req.params.id, delta);
    if (!updated) res.status(404).json({ error: 'inventory.notFound' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: 'inventory.adjustFailed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteInventoryItem(req.params.id);
    if (!success) res.status(404).json({ error: 'inventory.notFound' });
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'inventory.deleteFailed' });
  }
});

export default router;
