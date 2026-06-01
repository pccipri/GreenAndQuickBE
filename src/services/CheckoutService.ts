import { Cart } from '@/schemas/CartSchema';
import { Order } from '@/schemas/OrderSchema';
import { Shop } from '@/schemas/ShopSchema';
import { ShopGroup } from '@/schemas/ShopGroupSchema';
import { HttpError } from '@/middlewares/errorHandler';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { IBaseAddress } from '@/models/IBaseAddress';
import { stripe } from '@/libs/stripe';
import { stripeService } from './StripeService';
import { inventoryService } from './InventoryService';
import { IOrderBucket } from '../models/ICheckout';

export const checkoutService = {
  /**
   * Splits the user's cart into order buckets based on pickup addresses (shops or shop groups).
   */
  async resolvePickupPoints(userId: string): Promise<IOrderBucket[]> {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) }).populate(
      'items.productId',
    );

    if (!cart || cart.items.length === 0) {
      throw new HttpError(400, 'checkout.cartEmpty');
    }

    await inventoryService.checkStockAvailability(cart.items);

    const buckets: Map<string, IOrderBucket> = new Map();

    for (const item of cart.items) {
      const shop = await Shop.findById(item.shopId);
      const product = item.productId as any;
      if (!shop) throw new HttpError(404, 'checkout.shopNotFound');

      // Check if shop belongs to an active ShopGroup (Feature 10)
      const shopGroup = await ShopGroup.findOne({ shops: shop._id, isActive: true });

      let bucketKey: string;
      let pickupAddress: IBaseAddress;
      let shopGroupId: Types.ObjectId | null = null;

      if (shopGroup) {
        bucketKey = shopGroup._id.toString();
        pickupAddress = shopGroup.pickupAddress;
        shopGroupId = shopGroup._id;
      } else {
        bucketKey = `shop-${shop._id.toString()}`;
        if (!shop.location) throw new HttpError(400, 'checkout.shopNoLocation');

        // Map IShopLocation to IBaseAddress (omit coordinates)
        const { street, city, county, country, zipcode } = shop.location;
        pickupAddress = { street, city, county, country, zipcode };
      }

      const existingBucket = buckets.get(bucketKey);
      const bucket: IOrderBucket = existingBucket || {
        shopGroupId,
        pickupAddress,
        items: [],
        totalAmount: 0,
      };

      bucket.items.push({
        productId: product._id,
        shopId: shop._id,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtAdd, // Using the snapshot from the cart
      });

      bucket.totalAmount += item.priceAtAdd * item.quantity;
      buckets.set(bucketKey, bucket);
    }

    return Array.from(buckets.values());
  },

  async checkoutCash(userId: string, deliveryAddress: any) {
    const buckets = await this.resolvePickupPoints(userId);
    const createdOrders = [];
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const bucket of buckets) {
        const [order] = await Order.create(
          [
            {
              customerId: new Types.ObjectId(userId),
              shopGroupId: bucket.shopGroupId,
              items: bucket.items,
              totalAmount: bucket.totalAmount,
              paymentMethod: 'cash',
              paymentStatus: 'pending',
              status: 'placed',
              deliveryAddress,
              pickupAddress: bucket.pickupAddress,
              statusHistory: [
                { status: 'placed', changedAt: new Date(), changedBy: new Types.ObjectId(userId) },
              ],
            },
          ],
          { session },
        );

        await inventoryService.reduceStock(bucket.items, session);
        createdOrders.push(order);
      }

      // Clear user's cart
      await Cart.deleteOne({ userId: new Types.ObjectId(userId) }).session(session);

      await session.commitTransaction();
      return createdOrders;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async checkoutCard(
    userId: string,
    userEmail: string,
    userName: string,
    deliveryAddress: any,
    saveCard: boolean = false,
    saveAddress: boolean = false,
  ) {
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart || cart.items.length === 0) {
      throw new HttpError(400, 'checkout.cartEmpty');
    }
    await inventoryService.checkStockAvailability(cart.items); // Pre-check stock for all items

    const buckets = await this.resolvePickupPoints(userId);
    const stripeCustomerId = await stripeService.getOrCreateStripeCustomer(
      userId,
      userEmail,
      userName,
    );

    const paymentIntentResponses = [];

    for (const [index, bucket] of buckets.entries()) {
      const intent = await stripe.paymentIntents.create({
        amount: bucket.totalAmount,
        currency: 'ron',
        customer: stripeCustomerId,
        metadata: {
          userId: userId.toString(),
          bucketIndex: index.toString(),
          deliveryAddress: JSON.stringify(deliveryAddress),
          pickupAddress: JSON.stringify(bucket.pickupAddress),
          shopGroupId: bucket.shopGroupId?.toString() || '',
          itemIds: JSON.stringify(bucket.items.map((i) => i.productId.toString())),
          saveCard: saveCard.toString(),
          saveAddress: saveAddress.toString(),
        },
      });

      paymentIntentResponses.push({
        clientSecret: intent.client_secret,
        bucketSummary: {
          totalAmount: bucket.totalAmount,
          itemCount: bucket.items.length,
          pickupAddress: bucket.pickupAddress,
        },
      });
    }

    return paymentIntentResponses;
  },
};
