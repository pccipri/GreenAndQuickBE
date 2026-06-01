import { Product } from '@/schemas/ProductSchema';
import { ICartItem } from '@/models/ICart'; // Defined in Project interfaces
import { HttpError } from '@/middlewares/errorHandler';
import { User } from '@/schemas/UserSchema';
import { Shop } from '@/schemas/ShopSchema';
import { sendLowStockAlert, sendOutOfStockAlert } from '@/utils/mailer';
import mongoose from 'mongoose';
import { IUser } from '@/models/IUser';

type StockAdjustmentItem = { productId: string | mongoose.Types.ObjectId; quantity: number };

export class InventoryService {
  /**
   * Atomically reduces stock for a list of items.
   * Uses a query filter to ensure stock never drops below zero.
   */
  async reduceStock(items: StockAdjustmentItem[], session?: mongoose.ClientSession) {
    for (const item of items) {
      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true, session },
      );

      if (!result) {
        throw new HttpError(400, `inventory.insufficientStock: ${item.productId}`);
      }

      await this.processStockAlerts(result._id.toString(), session);
    }
  }

  /**
   * Restores stock (e.g., after an order cancellation).
   */
  async restoreStock(items: StockAdjustmentItem[], session?: mongoose.ClientSession) {
    for (const item of items) {
      const product = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } },
        { new: true, session },
      );

      if (product) {
        await this.processStockAlerts(product._id.toString(), session);
      }
    }
  }

  /**
   * Validates that all items in a cart are available and in stock.
   */
  async checkStockAvailability(items: ICartItem[]) {
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    const errors: any[] = [];
    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.productId.toString());

      if (!product || !product.isAvailable || product.stock < item.quantity) {
        errors.push({
          productId: item.productId,
          reason: !product
            ? 'notFound'
            : !product.isAvailable
              ? 'unavailable'
              : 'insufficientStock',
          currentStock: product?.stock || 0,
        });
      }
    }

    if (errors.length > 0) {
      throw new HttpError(400, 'inventory.validationFailed', { details: errors });
    }
  }

  /**
   * Evaluates stock levels to toggle availability and send email alerts.
   */
  async processStockAlerts(productId: string, session?: mongoose.ClientSession) {
    // If session is provided, use it; otherwise, standard find
    const product = session
      ? await Product.findById(productId).session(session)
      : await Product.findById(productId);

    if (!product) return;

    const shop = await Shop.findById(product.shopId).session(session || null);
    if (!shop) return;

    const owner = await User.findById(shop.ownerId).session(session || null);
    if (!owner) return;

    const { stock, lowStockThreshold, lowStockEmailSentAt } = product;

    if (stock === 0) {
      const update: any = { isAvailable: false };
      if (!lowStockEmailSentAt) {
        update.lowStockEmailSentAt = new Date();
      }
      await Product.findByIdAndUpdate(productId, update, { session });

      if (!lowStockEmailSentAt) {
        await sendOutOfStockAlert(owner as unknown as IUser, product);
      }
    } else if (stock <= lowStockThreshold && !lowStockEmailSentAt) {
      await Product.findByIdAndUpdate(productId, { lowStockEmailSentAt: new Date() }, { session });
      await sendLowStockAlert(owner as unknown as IUser, product);
    } else if (stock > lowStockThreshold && lowStockEmailSentAt) {
      // Auto-reveal: Reset alert tracker and ensure product is available
      await Product.findByIdAndUpdate(
        productId,
        {
          lowStockEmailSentAt: null,
          isAvailable: true,
        },
        { session },
      );
    }
  }
}

export const inventoryService = new InventoryService();
