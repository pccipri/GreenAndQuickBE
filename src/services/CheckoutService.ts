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
import { IOrderBucket, IOrderBucketInternal } from '../models/ICheckout';

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

    const cartShopIds: Set<string> = new Set();
    for (const item of cart.items) {
      cartShopIds.add(item.shopId.toString());
    }

    // Fetch all shops involved in the cart
    const shopsInCart = await Shop.find({
      _id: { $in: Array.from(cartShopIds).map((id) => new Types.ObjectId(id)) },
    }).lean();
    const shopMap: Map<string, (typeof shopsInCart)[0]> = new Map(
      shopsInCart.map((shop) => [shop._id.toString(), shop]),
    );

    // Fetch all active shop groups that any of the cart shops belong to
    const allRelevantShopGroups = await ShopGroup.find({
      shops: { $in: Array.from(cartShopIds) },
      isActive: true,
    }).lean();

    // Map each shop in the cart to the groups it belongs to
    const shopToPotentialGroupsMap: Map<string, Types.ObjectId[]> = new Map();
    for (const shopId of cartShopIds) {
      const groupsForShop = allRelevantShopGroups
        .filter((group) => group.shops.some((s) => s.equals(shopId)))
        .map((group) => group._id);
      shopToPotentialGroupsMap.set(shopId.toString(), groupsForShop);
    }

    // Determine the assigned group for each shop based on the "prefer grouping" heuristic
    const shopToAssignedGroupMap: Map<string, Types.ObjectId | null> = new Map();
    for (const shopId of cartShopIds) {
      const potentialGroups = shopToPotentialGroupsMap.get(shopId) || [];

      if (potentialGroups.length === 0) {
        shopToAssignedGroupMap.set(shopId.toString(), null); // Independent shop
      } else if (potentialGroups.length === 1) {
        shopToAssignedGroupMap.set(shopId.toString(), potentialGroups[0]);
      } else {
        // Heuristic: choose the group that contains the highest number of other shops from the cart
        let bestGroup: Types.ObjectId | null = null;
        let maxSharedShops = -1;

        for (const groupId of potentialGroups) {
          const group = allRelevantShopGroups.find((g) => g._id.equals(groupId));
          if (group) {
            let sharedShopsCount = 0;
            for (const memberShopId of group.shops) {
              if (cartShopIds.has(memberShopId.toString()) && !memberShopId.equals(shopId)) {
                sharedShopsCount++;
              }
            }

            if (sharedShopsCount > maxSharedShops) {
              maxSharedShops = sharedShopsCount;
              bestGroup = groupId;
            }
          }
        }
        shopToAssignedGroupMap.set(shopId.toString(), bestGroup);
      }
    }

    const buckets: Map<string, IOrderBucketInternal> = new Map();

    for (const item of cart.items) {
      const shop = shopMap.get(item.shopId.toString());
      const product = item.productId as any;
      if (!shop) throw new HttpError(404, 'checkout.shopNotFound');

      let bucketKey: string;
      let pickupAddress: IBaseAddress;
      let shopGroupId: Types.ObjectId | null = null;

      const assignedGroupId = shopToAssignedGroupMap.get(shop._id.toString());

      if (assignedGroupId) {
        const group = allRelevantShopGroups.find((g) => g._id.equals(assignedGroupId));
        if (!group) throw new HttpError(500, 'checkout.assignedGroupNotFound'); // Should not happen
        bucketKey = group._id.toString();
        pickupAddress = group.pickupAddress;
        shopGroupId = group._id;
      } else {
        bucketKey = `shop-${shop._id.toString()}`;
        if (!shop.location) throw new HttpError(400, 'checkout.shopNoLocation');
        const { street, city, county, country, zipcode } = shop.location;
        pickupAddress = { street, city, county, country, zipcode };
      }

      const existingBucket = buckets.get(bucketKey);
      const bucket: IOrderBucketInternal = existingBucket || {
        shopGroupId,
        pickupAddress,
        items: [],
        totalAmount: 0,
        shopIdsInBucket: new Set(),
      };

      bucket.items.push({
        productId: new Types.ObjectId(product._id), // Ensure ObjectId
        shopId: new Types.ObjectId(shop._id), // Ensure ObjectId
        quantity: item.quantity,
        priceAtPurchase: item.priceAtAdd, // Using the snapshot from the cart
      });
      bucket.shopIdsInBucket.add(shop._id);
      bucket.totalAmount += item.priceAtAdd * item.quantity;
      buckets.set(bucketKey, bucket);
    }

    return Array.from(buckets.values());
  },

  async checkoutCash(userId: string, deliveryAddress: any) {
    const buckets: IOrderBucket[] = await this.resolvePickupPoints(userId);
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

    const buckets: IOrderBucket[] = await this.resolvePickupPoints(userId);
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
