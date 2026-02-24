import { Request, Response, Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsByShop,
  searchProductsByName,
  updateProduct,
} from '../services/ProductService';
import IProduct from '../models/IProduct';
import { IdParams } from '@/models/generic/Routes';

const router = Router();

// Create a new product
router.post('/', async (req: Request, res: Response) => {
  try {
    const product: IProduct = req.body;
    const id = await createProduct(product);
    res.status(201).json({ id });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Get all products
router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get a single product by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Get products by shop ID
router.get('/shop/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id: shopId } = req.params;
    const products = await getProductsByShop(shopId);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch products by shop', error: error.message });
  }
});

// Get products by category ID
router.get('/category/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id: categoryId } = req.params;
    const products = await getProductsByCategory(categoryId);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch products by category', error: error.message });
  }
});

// Search products by name
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (typeof q !== 'string') {
      res.status(400).json({ message: 'Query must be a string' });
    }

    const products = await searchProductsByName(q as string);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to search products', error: error.message });
  }
});

// Update a product by ID
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Delete a product by ID
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const deleted = await deleteProduct(req.params.id);
    if (!deleted) res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
});

export default router;
