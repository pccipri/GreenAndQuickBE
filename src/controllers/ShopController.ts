import { Request, Response, Router } from "express";
import { createShop, deleteShop, getAllShops, getShopById, getShopByOwner, updateShop } from "../services/ShopService";

const router = Router();

// Create shop
router.post('/', async (req: Request, res: Response) => {
  try {
    const shop = await createShop(req.body);
    res.status(201).json(shop);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create shop', error: error.message });
  }
});

// Get all shops
router.get('/', async (_req, res) => {
  try {
    const shops = await getAllShops();
    res.json(shops);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch shops', error: error.message });
  }
});

// Get shop by ID
router.get('/:id', async (req, res) => {
  try {
    const shop = await getShopById(req.params.id);
    if (!shop) res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch shop', error: error.message });
  }
});

// Get shop by owner
router.get('/owner/:owner', async (req, res) => {
  try {
    const shop = await getShopByOwner(req.params.owner);
    if (!shop) res.status(404).json({ message: 'Shop not found for this owner' });
    res.json(shop);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch owner shop', error: error.message });
  }
});

// Update shop
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateShop(req.params.id, req.body);
    if (!updated) res.status(404).json({ message: 'Shop not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update shop', error: error.message });
  }
});

// Delete shop
router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteShop(req.params.id);
    if (!success) res.status(404).json({ message: 'Shop not found' });
    res.json({ message: 'Shop deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete shop', error: error.message });
  }
});

export default router;