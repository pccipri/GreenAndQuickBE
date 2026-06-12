import { SavedCard } from '@/schemas/SavedCardSchema';
import { Types } from 'mongoose';
import { HttpError } from '@/middlewares/errorHandler';
import { stripeService } from './StripeService';
import { stripe } from '@/libs/stripe';

export const savedCardService = {
  async list(userId: string) {
    return SavedCard.find({ userId: new Types.ObjectId(userId) }).sort({ isDefault: -1 });
  },

  async attach(userId: string, userEmail: string, userName: string, paymentMethodId: string) {
    const stripeCustomerId = await stripeService.getOrCreateStripeCustomer(
      userId,
      userEmail,
      userName,
    );

    const pm = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    const cardData = pm.card!;
    const hasOtherCards = await SavedCard.exists({ userId: new Types.ObjectId(userId) });

    const savedCard = await SavedCard.create({
      userId: new Types.ObjectId(userId),
      stripePaymentMethodId: pm.id,
      last4: cardData.last4,
      brand: cardData.brand,
      expiryMonth: cardData.exp_month,
      expiryYear: cardData.exp_year,
      isDefault: !hasOtherCards,
    });

    return savedCard;
  },

  async remove(userId: string, cardId: string) {
    const card = await SavedCard.findOne({ _id: cardId, userId: new Types.ObjectId(userId) });
    if (!card) throw new HttpError(404, 'card.notFound');

    await stripe.paymentMethods.detach(card.stripePaymentMethodId);
    await card.deleteOne();

    // If we deleted the default, make another one default
    if (card.isDefault) {
      const remaining = await SavedCard.findOne({ userId: new Types.ObjectId(userId) });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }
    return { success: true };
  },

  async setDefault(userId: string, cardId: string) {
    const card = await SavedCard.findOne({ _id: cardId, userId: new Types.ObjectId(userId) });
    if (!card) throw new HttpError(404, 'card.notFound');

    await SavedCard.updateMany({ userId: new Types.ObjectId(userId) }, { isDefault: false });

    card.isDefault = true;
    await card.save();
    return card;
  },
};
