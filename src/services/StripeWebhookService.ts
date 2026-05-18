import Stripe from 'stripe';
import { Order } from '@/schemas/OrderSchema';
import { Product } from '@/schemas/ProductSchema';
import { Cart } from '@/schemas/CartSchema';
import { User } from '@/schemas/UserSchema';
import { SavedCard } from '@/schemas/SavedCardSchema';
import { stripe } from '..';
import { Types } from 'mongoose';
import { sendEmail } from '@/utils/mailer';

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

    // 3. Create Order
    const order = await Order.create({
      customerId: new Types.ObjectId(userId),
      shopGroupId: shopGroupId ? new Types.ObjectId(shopGroupId) : null,
      items: itemsToOrder.map((item) => ({
        productId: item.productId,
        shopId: item.shopId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtAdd, // Use snapshot from cart
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
    });

    // 4. Atomic Stock Reduction
    for (const item of itemsToOrder) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // 5. Cleanup Cart (remove only the items that were paid for)
    cart.items = cart.items.filter(
      (item) => !parsedItemIds.includes(item.productId.toString()),
    ) as any;
    await cart.save();

    // 6. Optional: Save Card
    if (saveCard === 'true' && paymentIntent.payment_method) {
      const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
      const cardData = pm.card!;

      // Check if card is already saved
      const existingCard = await SavedCard.findOne({ stripePaymentMethodId: pm.id });
      if (!existingCard) {
        const hasOtherCards = await SavedCard.exists({ userId: new Types.ObjectId(userId) });
        await SavedCard.create({
          userId: new Types.ObjectId(userId),
          stripePaymentMethodId: pm.id,
          last4: cardData.last4,
          brand: cardData.brand,
          expiryMonth: cardData.exp_month,
          expiryYear: cardData.exp_year,
          isDefault: !hasOtherCards,
        });
      }
    }

    // 7. Optional: Save Address
    if (saveAddress === 'true') {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { addresses: { ...parsedDeliveryAddress, isDefault: false } },
      });
    }

    // 8. Notify User
    const user = await User.findById(userId);
    if (user) {
      await sendEmail(
        user.email,
        'Order Confirmed',
        `Your order #${order._id} has been placed successfully.`,
      );
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

    await Order.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { paymentStatus: 'refunded' },
    );

    console.log(`Order associated with PI ${paymentIntentId} marked as refunded.`);
  },
};
