import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { requireAuth, requireRole } from '@/middlewares/isAuthenticated';
import { inventoryService } from '@/services/InventoryService';
import { updateStockSchema, updateAvailabilitySchema } from '@/validations/inventoryValidation';
import { Product } from '@/schemas/ProductSchema';
import { Shop } from '@/schemas/ShopSchema';
import { HttpError } from '@/middlewares/errorHandler';

const router = Router();

// All inventory routes require authentication and either shopOwner or admin role
router.use(requireAuth, requireRole(['shopOwner', 'admin']));

// Middleware to check product ownership for shop owners
const checkProductOwnership = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Admins bypass ownership check
    if (req.user!.role === 'admin') {
      return next();
    }

    const productId = req.params.id;
    const userId = req.user!._id;

    const product = await Product.findById(productId);
    if (!product) {
      throw new HttpError(404, 'product.notFound');
    }

    const shop = await Shop.findById(product.shopId);
    if (!shop || shop.ownerId.toString() !== userId.toString()) {
      throw new HttpError(403, 'auth.forbidden: You do not own this product.');
    }

    next();
  },
);

/**
 * PATCH /products/:id/stock
 * Update product stock manually.
 * Requires shopOwner or admin role. Shop owners must own the product.
 */
router.patch(
  '/:id/stock',
  checkProductOwnership,
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const { stock: newStockValue } = updateStockSchema.parse(req.body);

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { stock: newStockValue },
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      throw new HttpError(404, 'product.notFound');
    }

    // Trigger stock alerts logic, which also handles isAvailable changes based on stock
    await inventoryService.processStockAlerts(updatedProduct._id.toString());

    res.json(updatedProduct);
  }),
);

/**
 * PATCH /products/:id/availability
 * Toggle product availability.
 * Requires shopOwner or admin role. Shop owners must own the product.
 */
router.patch(
  '/:id/availability',
  checkProductOwnership,
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const { isAvailable } = updateAvailabilitySchema.parse(req.body);

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { isAvailable },
      { new: true },
    );

    if (!updatedProduct) {
      throw new HttpError(404, 'product.notFound');
    }

    // Re-process alerts to ensure consistency, especially if stock is 0 and availability was manually set to true
    await inventoryService.processStockAlerts(updatedProduct._id.toString());

    res.json(updatedProduct);
  }),
);

export default router;
