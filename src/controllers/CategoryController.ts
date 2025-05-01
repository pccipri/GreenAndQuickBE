import { Request, Response, Router } from 'express';
import { createCategory, deleteCategory, getAllCategories, getCategoryById, updateCategory } from '../services/CategoryService';
import ICategory from '../models/ICategory';


const router = Router();

// Create a new category
router.post('/', async (req: Request, res: Response) => {
  try {
    const category: ICategory = req.body;

    const response = await createCategory(category);

    res.status(201).json(response);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to create category', error: error.message });
  }
});

// Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to fetch categories', error: error.message });
  }
});

// Get a single category by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to fetch category', error: error.message });
  }
});

// Update a category by ID
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const modifiedCategory = req.body;

    const updatedCategory = await updateCategory(id, modifiedCategory);

    if (!updatedCategory) {
      res.status(404).json({ message: 'Category not found' });
    }

    res.json(updatedCategory);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to update category', error: error.message });
  }
});

// Delete a category by ID
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedCategory = await deleteCategory(id);

    if (!deletedCategory) {
      res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Failed to delete category', error: error.message });
  }
});

export default router;
