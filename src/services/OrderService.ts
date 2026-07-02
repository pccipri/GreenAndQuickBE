import type { IOrder } from '../models/IOrder';
import { Order } from '../schemas/OrderSchema';
import mongoose, { Types } from 'mongoose';
import { HttpError } from '@/middlewares/errorHandler';
import { stripeService } from './StripeService';
import { User } from '@/schemas/UserSchema';
import { Shop } from '@/schemas/ShopSchema';
import type { IUser } from '@/models/IUser';
import { ALLOWED_TRANSITIONS } from '@/utils/constants';
import {
  sendOrderCancelledEmail,
  sendOrderConfirmedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from '@/utils/mailer';
import type { IOrderDocument } from '@/schemas/OrderSchema';
import { inventoryService } from './InventoryService';

// Create a new order
export const createOrder = async (orderToSave: IOrder) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate and reduce stock first
    await inventoryService.checkStockAvailability(
      orderToSave.items.map((item) => ({
        productId: item.productId.toString(),
        shopId: item.shopId.toString(),
        quantity: item.quantity,
        priceAtAdd: item.priceAtPurchase,
      })),
    );
    await inventoryService.reduceStock(orderToSave.items, session);

    const [newOrder] = await Order.create([orderToSave], { session });

    await session.commitTransaction();
    return newOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Get all orders
export const getAllOrders = async (
  query: {
    status?: string;
    customerId?: string;
    shopId?: string;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'oldest';
    search?: string;
  } = {},
) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (query.status) filter.status = query.status;

  if (query.customerId) {
    if (Types.ObjectId.isValid(query.customerId)) {
      filter.customerId = new Types.ObjectId(query.customerId);
    } else {
      return { items: [], total: 0, page, limit, pages: 0 };
    }
  }

  if (query.shopId) {
    if (Types.ObjectId.isValid(query.shopId)) {
      filter['items.shopId'] = new Types.ObjectId(query.shopId);
    } else {
      return { items: [], total: 0, page, limit, pages: 0 };
    }
  }

  if (query.search) {
    if (Types.ObjectId.isValid(query.search)) {
      filter._id = new Types.ObjectId(query.search);
    } else {
      const matchingUsers = await User.find({
        $or: [
          { firstName: { $regex: query.search, $options: 'i' } },
          { lastName: { $regex: query.search, $options: 'i' } },
        ],
      }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);
      if (userIds.length > 0) filter.customerId = { $in: userIds };
      else return { items: [], total: 0, page, limit, pages: 0 };
    }
  }

  const sort: any = query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'firstName lastName email')
      .populate('items.productId', 'name slug images')
      .populate('items.shopId', 'name slug logo')
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

// Get a single order by ID
export const getOrderById = async (id: string) => {
  return await Order.findById(id)
    .populate('items.productId', 'name slug images')
    .populate('items.shopId', 'name slug logo')
    .lean();
};

// Get orders by user
export const getOrdersByUser = async (
  userId: string,
  query: { status?: string; sort?: 'newest' | 'oldest'; page?: number; limit?: number },
) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: any = { customerId: new Types.ObjectId(userId) };
  if (query.status) filter.status = query.status;

  const sort: any = query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('items.productId', 'name slug images')
      .populate('items.shopId', 'name slug logo')
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

// Get orders for a shop owner
export const getOrdersByShopOwner = async (
  ownerId: string,
  query: {
    status?: string;
    sort?: 'newest' | 'oldest';
    search?: string;
    page?: number;
    limit?: number;
  },
) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  // Find all shops owned by this owner
  const ownedShops = await Shop.find({ ownerId: new Types.ObjectId(ownerId) }).select('_id');
  const ownedShopIds = ownedShops.map((shop) => shop._id);

  if (ownedShopIds.length === 0) {
    return { items: [], total: 0, page, limit, pages: 0 };
  }

  const filter: any = {
    'items.shopId': { $in: ownedShopIds }, // Orders containing items from any of the owner's shops
  };

  if (query.status) filter.status = query.status;

  const sort: any = query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  if (query.search) {
    if (Types.ObjectId.isValid(query.search)) {
      filter._id = new Types.ObjectId(query.search);
    } else {
      // Search by customer name (firstName or lastName)
      const matchingUsers = await User.find({
        $or: [
          { firstName: { $regex: query.search, $options: 'i' } },
          { lastName: { $regex: query.search, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);
      if (userIds.length > 0) {
        filter.customerId = { $in: userIds };
      } else {
        // If no user matches and search isn't an ID, return no results
        return { items: [], total: 0, page, limit, pages: 0 };
      }
    }
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'firstName lastName email') // Populate customer details for potential display
      .populate('items.productId', 'name images') // Populate product details
      .populate('items.shopId', 'name slug logo') // Populate shop details
      .lean(),
    Order.countDocuments(filter),
  ]);

  // Project items to only show the portion belonging to the owner (Feature 05 Requirement)
  const projectedItems = items.map((order) => {
    const ownerItems = order.items.filter((item) =>
      ownedShopIds.some((id) => id.toString() === item.shopId._id.toString()),
    );
    return { ...order, items: ownerItems };
  });

  return {
    items: projectedItems,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Updates the status of an order, performing validations and triggering notifications.
 * This function is used by shop owners and admins.
 */
export const updateOrderStatus = async (
  id: string,
  newStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled',
  changedByUserId: string,
  isShopOwner: boolean,
  isAdmin: boolean,
  triggerRefund: boolean = false,
  reason?: string,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = (await Order.findById(id).session(session)) as IOrderDocument;
    if (!order) throw new HttpError(404, 'order.notFound');

    const oldStatus = order.status;

    // Permission check for shop owners
    if (isShopOwner && !isAdmin) {
      const ownedShops = await Shop.find({ ownerId: new Types.ObjectId(changedByUserId) }).select(
        '_id',
      );
      const ownedShopIds = ownedShops.map((shop) => shop._id.toString());

      // Allow update if the requester owns at least one shop in this order bucket
      const hasInvolvedShop = order.items.some((item) =>
        ownedShopIds.includes(item.shopId.toString()),
      );

      if (!hasInvolvedShop) {
        throw new HttpError(403, 'auth.forbidden: You are not involved in this order.');
      }
    }

    // Validate transition (unless admin is overriding)
    if (!isAdmin && !ALLOWED_TRANSITIONS[oldStatus]?.includes(newStatus)) {
      throw new HttpError(
        400,
        `order.invalidStatusTransition: Cannot go from ${oldStatus} to ${newStatus}`,
      );
    }

    // Special logic for cash payments: 'placed' to 'confirmed'
    if (oldStatus === 'placed' && newStatus === 'confirmed' && order.paymentMethod === 'cash') {
      order.paymentStatus = 'paid';
    }

    // Admin specific: Manual refund trigger
    if (
      isAdmin &&
      triggerRefund &&
      newStatus === 'cancelled' &&
      order.paymentMethod === 'stripe' &&
      order.paymentStatus === 'paid' &&
      order.stripePaymentIntentId
    ) {
      await stripeService.refundOrder(order.stripePaymentIntentId);
      order.paymentStatus = 'refunded';
    }

    order.status = newStatus;
    order.changedBy = new Types.ObjectId(changedByUserId);
    await order.save({ session });

    // Stock Replenishment if cancelled
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      await inventoryService.restoreStock(order.items, session);
    }

    await session.commitTransaction();

    // Send email notification
    const user = await User.findById(order.customerId);
    if (user) {
      // Populate order items and shop details for email
      await order.populate('items.productId items.shopId');
      const orderObj = order.toObject() as any; // Convert to plain object for mailer
      const preferredLanguage =
        typeof (user.userSettings as any)?.preferredLanguage === 'string'
          ? (user.userSettings as any).preferredLanguage
          : 'en';
      const mailUser = user as unknown as IUser;

      switch (newStatus) {
        case 'confirmed':
          await sendOrderConfirmedEmail(mailUser, orderObj, preferredLanguage);
          break;
        case 'shipped':
          await sendOrderShippedEmail(mailUser, orderObj, preferredLanguage, '#'); // Placeholder tracking link
          break;
        case 'delivered':
          await sendOrderDeliveredEmail(mailUser, orderObj, preferredLanguage);
          break;
        case 'cancelled':
          await sendOrderCancelledEmail(
            mailUser,
            orderObj,
            preferredLanguage,
            isAdmin ? reason || 'Administrative update.' : 'Shop owner update.',
          );
          break;
      }
    }

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// This `updateOrder` function is now deprecated or should be used only for non-status updates.
// For status updates, use `updateOrderStatus`.
export const updateOrder = async (id: string, modifiedOrder: Partial<IOrder>) => {
  const updatedOrder = await Order.findByIdAndUpdate(id, { $set: modifiedOrder }, { new: true });
  return updatedOrder || false;
};

/**
 * Cancels an order.
 * If paid via Stripe, initiates a refund.
 */
export const cancelOrder = async (
  orderId: string,
  userId: string,
  isAdmin: boolean = false,
  reason?: string,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new HttpError(404, 'order.notFound');

    // Permission: Owner or Admin
    if (!isAdmin && order.customerId.toString() !== userId) {
      throw new HttpError(403, 'auth.forbidden');
    }

    // Status check: only 'placed' and 'confirmed' can be cancelled by customer
    if (!['placed', 'confirmed'].includes(order.status)) {
      throw new HttpError(400, 'order.cannotCancel');
    }

    // Refund if card payment
    if (order.paymentMethod === 'stripe' && order.stripePaymentIntentId) {
      await stripeService.refundOrder(order.stripePaymentIntentId);
      order.paymentStatus = 'refunded';
    }

    order.status = 'cancelled';
    order.changedBy = new Types.ObjectId(userId);
    await order.save({ session });

    // Stock Replenishment
    await inventoryService.restoreStock(order.items, session);

    await session.commitTransaction();

    // Send cancellation email
    const customer = await User.findById(order.customerId);
    if (customer) {
      const preferredLanguage =
        typeof (customer.userSettings as any)?.preferredLanguage === 'string'
          ? (customer.userSettings as any).preferredLanguage
          : 'en';
      await sendOrderCancelledEmail(
        customer as unknown as IUser,
        order.toObject() as any,
        preferredLanguage,
        reason || 'Customer requested cancellation.',
      );
    }

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Cancels an order by a shop owner.
 * If paid via Stripe, initiates a refund.
 */
export const cancelOrderByShopOwner = async (
  orderId: string,
  shopOwnerUserId: string,
  isAdmin: boolean = false,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = (await Order.findById(orderId).session(session)) as IOrderDocument;
    if (!order) throw new HttpError(404, 'order.notFound');

    // Permission check for shop owners
    if (!isAdmin) {
      const ownedShops = await Shop.find({ ownerId: new Types.ObjectId(shopOwnerUserId) }).select(
        '_id',
      );
      const ownedShopIds = ownedShops.map((shop) => shop._id.toString());

      // Allow cancellation if the requester owns at least one shop in this order bucket
      const hasInvolvedShop = order.items.some((item) =>
        ownedShopIds.includes(item.shopId.toString()),
      );

      if (!hasInvolvedShop) {
        throw new HttpError(403, 'auth.forbidden: You are not involved in this order.');
      }
    }

    // Status check: only 'placed' and 'confirmed' can be cancelled by shop owner (before shipped)
    if (!['placed', 'confirmed'].includes(order.status)) {
      throw new HttpError(400, 'order.cannotCancelByShopOwner');
    }

    // Refund if card payment
    if (order.paymentMethod === 'stripe' && order.stripePaymentIntentId) {
      await stripeService.refundOrder(order.stripePaymentIntentId);
      order.paymentStatus = 'refunded';
    }

    order.status = 'cancelled';
    order.changedBy = new Types.ObjectId(shopOwnerUserId);
    await order.save({ session });

    // Stock Replenishment
    await inventoryService.restoreStock(order.items, session);

    await session.commitTransaction();

    // Send cancellation email
    const user = await User.findById(order.customerId);
    if (user) {
      const preferredLanguage =
        typeof (user.userSettings as any)?.preferredLanguage === 'string'
          ? (user.userSettings as any).preferredLanguage
          : 'en';
      await sendOrderCancelledEmail(
        user as unknown as IUser,
        order.toObject() as any,
        preferredLanguage,
        'Shop owner cancelled the order.',
      );
    }

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Delete an order
export const deleteOrder = async (id: string) => {
  const deletedOrder = await Order.findByIdAndDelete(id);
  return !!deletedOrder;
};
