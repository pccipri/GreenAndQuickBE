import { Request, Response, Router } from 'express';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from '../services/CategoryService';
import ICategory from '../models/ICategory';
import { IdParams } from '@/models/generic/Routes';

const router = Router();

// Create a new category
router.post('/', async (req: Request, res: Response) => {
  try {
    const category: ICategory = req.body;
    const id = await createCategory(category);
    res.status(201).json({ id });
  } catch (error: any) {
    res.status(500).json({ error: 'category.createFailed' });
  }
});

// Get all categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'category.fetchAllFailed' });
  }
});

// Get a category by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) res.status(404).json({ error: 'category.notFound' });
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ error: 'category.fetchFailed' });
  }
});

// Update a category by ID
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const updated = await updateCategory(req.params.id, req.body);
    if (!updated) res.status(404).json({ error: 'category.notFound' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'category.updateFailed' });
  }
});

// Delete a category by ID
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const deleted = await deleteCategory(req.params.id);
    if (!deleted) res.status(404).json({ error: 'category.notFound' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'category.deleteFailed' });
  }
});

export default router;
