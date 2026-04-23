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
import { ICreateProductDTO } from '../models/IProduct';
import { IdParams } from '@/models/generic/Routes';
import { upload } from '@/middlewares/upload';
import {
  deletePublicImage,
  replacePublicImage,
  uploadPublicImage,
} from '@/services/PublicImageStorageService';
import { ProductDocument } from '@/schemas/ProductSchema';

const router = Router();

// Create a new product
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const product: ICreateProductDTO = req.body;
    const id = await createProduct(product);

    if (req.file) {
      const uploadedProductImage = await uploadPublicImage({
        file: req.file.buffer,
        mimeType: req.file.mimetype,
        originalFilename: req.file.originalname,
        folder: `products/${id}`,
      });

      product.imagePath = uploadedProductImage.path;
    }

    res.status(201).json({ id });
  } catch (error: any) {
    res.status(500).json({ error: 'product.createFailed' });
  }
});

// Get all products
router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await getAllProducts();

    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'product.fetchAllFailed' });
  }
});

// Get a single product by ID
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) res.status(404).json({ error: 'product.notFound' });
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: 'product.fetchFailed' });
  }
});

// Get products by shop ID
router.get('/shop/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id: shopId } = req.params;
    const products = await getProductsByShop(shopId);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'product.fetchByShopFailed' });
  }
});

// Get products by category ID
router.get('/category/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const { id: categoryId } = req.params;
    const products = await getProductsByCategory(categoryId);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'product.fetchByCategoryFailed' });
  }
});

// Search products by name
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (typeof q !== 'string') {
      res.status(400).json({ error: 'product.invalidQuery' });
    }

    const products = await searchProductsByName(q as string);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'product.searchFailed' });
  }
});

// Update a product by ID
router.put('/:id', upload.single('image'), async (req: Request<IdParams>, res: Response) => {
  try {
    const existingProduct: ProductDocument | null = (await getProductById(
      req.params.id,
      true,
    )) as ProductDocument;

    if (!existingProduct) {
      return res.status(404).json({ error: 'product.notFound' });
    }

    const payload: any = { ...req.body };

    // Remove image explicitly
    if (payload.removeImage === 'true' || payload.removeImage === true) {
      if (existingProduct.imagePath) {
        await deletePublicImage(existingProduct.imagePath);
      }

      payload.imagePath = null;
      payload.image = null;
    }

    // Upload or replace image if a new file is provided
    if (req.file) {
      if (existingProduct.imagePath) {
        const replacedImage = await replacePublicImage({
          path: existingProduct.imagePath,
          file: req.file.buffer,
          mimeType: req.file.mimetype,
        });

        payload.imagePath = replacedImage.path;
        payload.image = replacedImage.publicUrl;
      } else {
        const uploadedImage = await uploadPublicImage({
          file: req.file.buffer,
          mimeType: req.file.mimetype,
          originalFilename: req.file.originalname,
          folder: `products/${req.params.id}`,
        });

        payload.imagePath = uploadedImage.path;
        payload.image = uploadedImage.publicUrl;
      }
    }

    const updated = await updateProduct(req.params.id, req.body);
    if (!updated) res.status(404).json({ error: 'product.notFound' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'product.updateFailed' });
  }
});

// Delete a product by ID
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
  try {
    const deleted = await deleteProduct(req.params.id);
    if (!deleted) res.status(404).json({ error: 'product.notFound' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'product.deleteFailed' });
  }
});

export default router;
