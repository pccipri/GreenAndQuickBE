import Stripe from 'stripe';
import { Order } from '@/schemas/OrderSchema';
import { Product } from '@/schemas/ProductSchema';
import { Cart } from '@/schemas/CartSchema';
import { User } from '@/schemas/UserSchema';
import { SavedCard } from '@/schemas/SavedCardSchema';
import { IUser } from '@/models/IUser';
import { stripe } from '..';
import mongoose, { Types } from 'mongoose';
import {
  sendOrderPlacedEmail,
  sendLowStockAlert,
  sendEmail,
  sendOrderCancelledEmail,
} from '@/utils/mailer';

export const stripeWebhookService = {
  async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const metadata = paymentIntent.metadata;
    const { userId, deliveryAddress, pickupAddress, shopGroupId, itemIds, saveCard, saveAddress } =
      metadata;

    // 1. Idempotency Check
    const existingOrder = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
    if (existingOrder) return;

    let parsedDeliveryAddress, parsedPickupAddress, parsedItemIds;

    try {
      parsedDeliveryAddress = JSON.parse(deliveryAddress || '{}');
      parsedPickupAddress = JSON.parse(pickupAddress || '{}');
      parsedItemIds = JSON.parse(itemIds || '[]');
    } catch (error) {
      console.error(
        `[Stripe Webhook] Failed to parse metadata for PaymentIntent ${paymentIntent.id}. This is likely due to the 500-character limit being exceeded for large carts.`,
        error,
      );
      return; // Stop processing to avoid creating a corrupted order
    }

    // 2. Retrieve relevant items from user's cart
    const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) return;

    const itemsToOrder = cart.items.filter((item) =>
      parsedItemIds.includes(item.productId.toString()),
    );
    if (itemsToOrder.length === 0) return;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 3. Create Order
      const [order] = await Order.create(
        [
          {
            customerId: new Types.ObjectId(userId),
            shopGroupId: shopGroupId ? new Types.ObjectId(shopGroupId) : null,
            items: itemsToOrder.map((item) => ({
              productId: item.productId,
              shopId: item.shopId,
              quantity: item.quantity,
              priceAtPurchase: item.priceAtAdd,
            })),
            totalAmount: paymentIntent.amount,
            paymentMethod: 'stripe',
            paymentStatus: 'paid',
            stripePaymentIntentId: paymentIntent.id,
            status: 'placed',
            deliveryAddress: parsedDeliveryAddress,
            pickupAddress: parsedPickupAddress,
            statusHistory: [
              {
                status: 'placed',
                changedAt: new Date(),
                changedBy: new Types.ObjectId(userId),
              },
            ],
          },
        ],
        { session },
      );

      // 4. Atomic Stock Reduction
      for (const item of itemsToOrder) {
        const product = await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: { stock: -item.quantity },
          },
          { session, new: true },
        ).populate('shopId');

        // Feature 09: Low Stock Alerts
        if (product && product.stock <= product.lowStockThreshold) {
          const shop = product.shopId as any;
          const owner = await User.findById(shop.ownerId);
          if (owner) {
            await sendLowStockAlert(owner as unknown as IUser, product.toObject() as any);
          }
        }
      }

      // 5. Cleanup Cart
      cart.items = cart.items.filter(
        (item) => !parsedItemIds.includes(item.productId.toString()),
      ) as any;
      await cart.save({ session });

      // 6. Optional: Save Card
      if (saveCard === 'true' && paymentIntent.payment_method) {
        const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
        const cardData = pm.card!;
        const existingCard = await SavedCard.findOne({ stripePaymentMethodId: pm.id }).session(
          session,
        );
        if (!existingCard) {
          const hasOtherCards = await SavedCard.exists({
            userId: new Types.ObjectId(userId),
          }).session(session);
          await SavedCard.create(
            [
              {
                userId: new Types.ObjectId(userId),
                stripePaymentMethodId: pm.id,
                last4: cardData.last4,
                brand: cardData.brand,
                expiryMonth: cardData.exp_month,
                expiryYear: cardData.exp_year,
                isDefault: !hasOtherCards,
              },
            ],
            { session },
          );
        }
      }

      // 7. Optional: Save Address
      if (saveAddress === 'true') {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { addresses: { ...parsedDeliveryAddress, isDefault: false } },
        }).session(session);
      }

      await session.commitTransaction();

      // 8. Notify User (Post-transaction)
      const user = await User.findById(userId);
      if (user) {
        await order.populate('items.productId items.shopId');
        const preferredLanguage =
          typeof (user.userSettings as any)?.preferredLanguage === 'string'
            ? (user.userSettings as any).preferredLanguage
            : 'en';
        await sendOrderPlacedEmail(
          user as unknown as IUser,
          order.toObject() as any,
          preferredLanguage,
        );
        const socketServer = (globalThis as any).io;
        if (socketServer?.to) {
          socketServer.to(user._id.toString()).emit('orderUpdate', order);
        }
      }
    } catch (error) {
      await session.abortTransaction();
      console.error(`[Stripe Webhook] Transaction failed for PI ${paymentIntent.id}:`, error);
    } finally {
      session.endSession();
    }
  },

  async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const user = await User.findById(paymentIntent.metadata.userId);
    if (user) {
      await sendEmail(
        user.email,
        'Payment Failed',
        'Your recent order payment failed. Please try again.',
      );
    }
  },

  async handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId = charge.payment_intent as string;
    if (!paymentIntentId) return;

    const order = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!order || order.paymentStatus === 'refunded') return;

    const session = await mongoose.startSession();
    session.startTransaction();

    let statusChanged = false;
    try {
      order.paymentStatus = 'refunded';

      // Sync order status if refund was initiated externally (e.g. Stripe Dashboard)
      if (order.status !== 'cancelled') {
        order.status = 'cancelled';
        order.changedBy = order.customerId; // Placeholder: System/Customer
        statusChanged = true;
      }

      await order.save({ session });

      // Stock Replenishment
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        }).session(session);
      }

      await session.commitTransaction();

      // Notify user if status was changed externally
      if (statusChanged) {
        const user = await User.findById(order.customerId);
        if (user) {
          const preferredLanguage =
            typeof (user.userSettings as any)?.preferredLanguage === 'string'
              ? (user.userSettings as any).preferredLanguage
              : 'en';

          await order.populate('items.productId items.shopId');
          await sendOrderCancelledEmail(
            user as unknown as IUser,
            order.toObject() as any,
            preferredLanguage,
            'Refund processed via payment provider.',
          );
        }
      }
    } catch (error) {
      await session.abortTransaction();
      console.error(`[Stripe Webhook] Refund handling failed for PI ${paymentIntentId}:`, error);
    } finally {
      session.endSession();
    }
  },
};
