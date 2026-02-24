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
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
});

// Get all categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

// Get a category by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
});

// Update a category by ID
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const updated = await updateCategory(req.params.id, req.body);
    if (!updated) res.status(404).json({ message: 'Category not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
});

// Delete a category by ID
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const deleted = await deleteCategory(req.params.id);
    if (!deleted) res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
});

export default router;
