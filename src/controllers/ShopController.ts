import { Router, Request, Response } from 'express';
import { shopService } from '@/services/ShopService';
import { productService } from '@/services/ProductService';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireRole } from '@/middlewares/isAuthenticated';
import { validate } from '@/middlewares/validate';
import { createShopSchema, updateShopSchema } from '@/validations/shopValidation';
import { upload } from '@/middlewares/upload';
import { Types } from 'mongoose';
import {
  deletePublicImage,
  deletePublicImageFolder,
  replacePublicImage,
  uploadPublicImage,
} from '@/services/PublicImageStorageService';
import { createProductSchema } from '@/validations/productValidation';
import { IdParams, SlugParams } from '@/models/generic/Routes';
import { Shop } from '@/schemas/ShopSchema';
import { AnafClient } from '@/libs/anafClient';

const router = Router();

/**
 * GET /shops
 * List all active shops (Public)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await shopService.list(req.query as any);
    res.json(result);
  }),
);

/**
 * GET /shops/:slug
 * Get shop details by slug (Public)
 */
router.get(
  '/:slug',
  asyncHandler(async (req: Request<SlugParams>, res: Response) => {
    const shop = await shopService.getBySlug(req.params.slug);
    res.json(shop);
  }),
);

/**
 * POST /shops
 * Create a shop (requires role 'shopOwner')
 */
router.post(
  '/',
  requireAuth,
  requireRole(['shopOwner']),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  validate(createShopSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const shopId = new Types.ObjectId();
    const files = (req.files as any) || {};

    const logoFile = files.logo?.[0];
    const coverFile = files.coverImage?.[0];

    try {
      // Validate CUI via ANAF before proceeding
      const anafData = await AnafClient.validateCui(payload.cui);

      // Enrich payload with verified business data
      payload.name = anafData.name;
      payload.nrRegCom = anafData.nrRegCom;
      payload.cui = anafData.cui;
      payload.location = { ...payload.location, ...anafData.location };

      if (logoFile) {
        const uploadedLogo = await uploadPublicImage({
          file: logoFile.buffer,
          mimeType: logoFile.mimetype,
          originalFilename: logoFile.originalname,
          folder: `shops/${shopId}`,
        });
        payload.logo = uploadedLogo.path;
      }

      if (coverFile) {
        const uploadedCover = await uploadPublicImage({
          file: coverFile.buffer,
          mimeType: coverFile.mimetype,
          originalFilename: coverFile.originalname,
          folder: `shops/${shopId}`,
        });
        payload.coverImage = uploadedCover.path;
      }

      const shop = await shopService.create(req.user!._id, { ...payload, _id: shopId });
      res.status(201).json(shop);
    } catch (error) {
      await deletePublicImageFolder(`shops/${shopId}`);
      throw error;
    }
  }),
);

/**
 * PATCH /shops/:id
 * Update shop details (Owner or Admin)
 */
router.patch(
  '/:id',
  requireAuth,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  validate(updateShopSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const isAdmin = req.user?.role === 'admin';
    const existingShop = await Shop.findOne(
      isAdmin ? { _id: req.params.id } : { _id: req.params.id, ownerId: req.user!._id },
    );

    if (!existingShop) return res.status(404).json({ error: 'shop.notFound' });

    const payload = req.body;
    const files = (req.files as any) || {};

    // Handle image replacements
    if (files.logo?.[0]) {
      const logoFile = files.logo[0];
      const result = existingShop.logo
        ? await replacePublicImage({
            path: existingShop.logo,
            file: logoFile.buffer,
            mimeType: logoFile.mimetype,
          })
        : await uploadPublicImage({
            file: logoFile.buffer,
            mimeType: logoFile.mimetype,
            originalFilename: logoFile.originalname,
            folder: `shops/${req.params.id}`,
          });
      payload.logo = result.path;
    }

    if (files.coverImage?.[0]) {
      const coverFile = files.coverImage[0];
      const result = existingShop.coverImage
        ? await replacePublicImage({
            path: existingShop.coverImage,
            file: coverFile.buffer,
            mimeType: coverFile.mimetype,
          })
        : await uploadPublicImage({
            file: coverFile.buffer,
            mimeType: coverFile.mimetype,
            originalFilename: coverFile.originalname,
            folder: `shops/${req.params.id}`,
          });
      payload.coverImage = result.path;
    }

    const shop = await shopService.update(req.params.id, payload, req.user!._id, isAdmin);
    res.json(shop);
  }),
);

/**
 * GET /shops/:shopId/products
 * List products for a specific shop (Public)
 */
router.get(
  '/:id/products',
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const result = await productService.list({ ...req.query, shopId: req.params.id } as any);
    res.json(result);
  }),
);

/**
 * POST /shops/:shopId/products
 * Create a product for a shop (Owner or Admin)
 */
router.post(
  '/:id/products',
  requireAuth,
  upload.array('images', 10),
  validate(createProductSchema),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: 'shop.notFound' });

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && shop.ownerId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ error: 'auth.forbidden' });
    }

    const payload = req.body;
    const productId = new Types.ObjectId();
    const files = (req.files as Express.Multer.File[]) || [];

    try {
      const imagePaths = await Promise.all(
        files.map((file) =>
          uploadPublicImage({
            file: file.buffer,
            mimeType: file.mimetype,
            originalFilename: file.originalname,
            folder: `products/${productId}`,
          }).then((res) => res.path),
        ),
      );

      payload.images = imagePaths;
      const product = await productService.create({ ...payload, _id: productId, shopId: shop._id });
      res.status(201).json(product);
    } catch (error) {
      await deletePublicImageFolder(`products/${productId}`);
      throw error;
    }
  }),
);

/**
 * DELETE /shops/:id
 * Soft delete shop (Admin only)
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole(['admin']),
  asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const result = await shopService.softDelete(req.params.id);
    res.json(result);
  }),
);

export default router;
