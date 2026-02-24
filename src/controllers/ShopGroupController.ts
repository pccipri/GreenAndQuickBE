import { Response, Request, Router } from 'express';
import {
  createShopGroup,
  deleteShopGroup,
  getAllShopGroups,
  getShopGroupById,
  updateShopGroup,
} from '../services/ShopGroupService';

const router = Router();

// Create shop group
router.post('/', async (req: Request, res: Response) => {
  try {
    const group = await createShopGroup(req.body);
    res.status(201).json(group);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create shop group', error: error.message });
  }
});

// Get all shop groups
router.get('/', async (_req, res) => {
  try {
    const groups = await getAllShopGroups();
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch shop groups', error: error.message });
  }
});

// Get shop group by ID
router.get('/:id', async (req, res) => {
  try {
    const group = await getShopGroupById(req.params.id);
    if (!group) res.status(404).json({ message: 'Shop group not found' });
    res.json(group);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch shop group', error: error.message });
  }
});

// Update shop group
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateShopGroup(req.params.id, req.body);
    if (!updated) res.status(404).json({ message: 'Shop group not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update shop group', error: error.message });
  }
});

// Delete shop group
router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteShopGroup(req.params.id);
    if (!success) res.status(404).json({ message: 'Shop group not found' });
    res.json({ message: 'Shop group deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete shop group', error: error.message });
  }
});

export default router;
