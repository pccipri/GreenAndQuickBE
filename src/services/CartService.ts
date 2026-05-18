import { Cart } from '@/schemas/CartSchema';
import { Product } from '@/schemas/ProductSchema';
import { HttpError } from '@/middlewares/errorHandler';
import { toCartDto } from '@/presenters/CartPresenter';
import { Types } from 'mongoose';

export const cartService = {
  async getCart(userId: string) {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.productId', 'name slug images price isAvailable stock')
      .exec();

    if (!cart) {
      return { userId, items: [], updatedAt: new Date() };
    }

    return toCartDto(cart);
  },

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await Product.findById(productId);
    if (!product) throw new HttpError(404, 'product.notFound');
    if (!product.isAvailable || product.stock < quantity) {
      throw new HttpError(400, 'product.insufficientStock');
    }

    let cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });

    if (!cart) {
      cart = new Cart({ userId: new Types.ObjectId(userId), items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: product._id,
        shopId: product.shopId,
        quantity,
        priceAtAdd: product.price, // Snapshot current price
      } as any);
    }

    await cart.save();
    return this.getCart(userId);
  },

  async updateItemQuantity(userId: string, productId: string, quantity: number) {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) throw new HttpError(404, 'cart.notFound');

    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

    if (itemIndex === -1) throw new HttpError(404, 'cart.itemNotFound');

    // Re-verify stock
    const product = await Product.findById(productId);
    if (product && product.stock < quantity) {
      throw new HttpError(400, 'product.insufficientStock');
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    return this.getCart(userId);
  },

  async removeItem(userId: string, productId: string) {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) throw new HttpError(404, 'cart.notFound');

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId) as any;

    await cart.save();
    return this.getCart(userId);
  },

  async clearCart(userId: string) {
    await Cart.deleteOne({ userId: new Types.ObjectId(userId) });
    return { userId, items: [], updatedAt: new Date() };
  },
};
