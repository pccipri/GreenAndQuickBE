import { Router, Request, Response } from 'express';
import { productService } from '@/services/ProductService';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth } from '@/middlewares/isAuthenticated';
import { validate } from '@/middlewares/validate';
import {
  updateProductSchema,
  productListQuerySchema,
  searchProductsQuerySchema,
  productRecipesQuerySchema,
} from '@/validations/productValidation';
import { upload } from '@/middlewares/upload';
import { Types } from 'mongoose';
import {
  deletePublicImage,
  deletePublicImageFolder,
  uploadPublicImage,
} from '@/services/PublicImageStorageService';
import { IdParams } from '@/models/generic/Routes';
import { Product } from '@/schemas/ProductSchema';
import { Shop } from '@/schemas/ShopSchema';

const router = Router();

/**
 * GET /products
 * Global product discovery (Public)
 */
router.get(
  '/',
  validate(productListQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.list(req.query as any);
    res.json(result);
  }),
);

/**
 * GET /products/search
 * Search products by ingredient name (Public)
 */
router.get(
  '/search',
  validate(searchProductsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query;
    const { items: products } = await productService.searchProductsByIngredient(
      q as string,
      Number(limit),
    );

    res.json(products);
  }),
);

/**
 * GET /products/:id
 * Get single product details (Public)
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const product = await productService.getById(req.params.id);
    res.json(product);
  }),
);

/**
 * GET /products/:id/recipes
 * List published recipes that tag this product as a linked ingredient (Public)
 */
router.get(
  '/:id/recipes',
  validate(productRecipesQuerySchema, 'query'),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { page, limit } = req.query as any;
    const result = await productService.getRecipesForProduct(req.params.id, page, limit);
    res.json(result);
  }),
);

/**
 * PATCH /products/:id
 * Update product (Owner or Admin)
 */
router.patch(
  '/:id',
  requireAuth,
  upload.array('images', 10),
  validate(updateProductSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'product.notFound' });

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      const shop = await Shop.findById(product.shopId);
      if (!shop || shop.ownerId.toString() !== req.user!._id.toString()) {
        return res.status(403).json({ error: 'auth.forbidden' });
      }
    }

    const payload = req.body;
    const imagesToDelete = payload.imagesToDelete || [];
    const imagesToKeep =
      payload.imagesToKeep || product.images.filter((img) => !imagesToDelete.includes(img));

    // Delete removed images from storage
    if (imagesToDelete.length > 0) {
      await Promise.all(imagesToDelete.map((path: string) => deletePublicImage(path)));
    }

    // Upload new images
    const newFiles = (req.files as Express.Multer.File[]) || [];
    const newImagePaths = await Promise.all(
      newFiles.map((file) =>
        uploadPublicImage({
          file: file.buffer,
          mimeType: file.mimetype,
          originalFilename: file.originalname,
          folder: `products/${product._id}`,
        }).then((res) => res.path),
      ),
    );

    payload.images = [...imagesToKeep, ...newImagePaths];

    const updated = await productService.update(req.params.id, payload, req.user!._id, isAdmin);
    res.json(updated);
  }),
);

/**
 * DELETE /products/:id
 * Delete product (Owner or Admin)
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'product.notFound' });

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      const shop = await Shop.findById(product.shopId);
      if (!shop || shop.ownerId.toString() !== req.user!._id.toString()) {
        return res.status(403).json({ error: 'auth.forbidden' });
      }
    }

    await deletePublicImageFolder(`products/${product._id}`);
    const result = await productService.remove(req.params.id);
    res.json(result);
  }),
);

export default router;
