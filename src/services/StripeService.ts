import { User } from '@/schemas/UserSchema';
import { HttpError } from '@/middlewares/errorHandler';
import { stripe } from '@/libs/stripe';

export const stripeService = {
  /**
   * Retrieves an existing Stripe Customer ID for a given user, or creates a new one if it doesn't exist.
   * The created customer ID is then saved to the user's profile in the database.
   * This function ensures that every user interacting with Stripe has an associated Stripe Customer object.
   * @param userId The MongoDB ObjectId of the user.
   * @param userEmail The email of the user, used for creating a new Stripe Customer.
   * @param userName The full name of the user (optional), used for creating a new Stripe Customer.
   * @returns A Promise that resolves to the Stripe Customer ID.
   * @throws HttpError if the user is not found or if there's an error interacting with Stripe.
   */
  async getOrCreateStripeCustomer(
    userId: string,
    userEmail: string,
    userName?: string,
  ): Promise<string> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new HttpError(404, 'User not found.');
      }

      if (user.stripeCustomerId) {
        return user.stripeCustomerId; // Return existing customer ID
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: userName,
          metadata: { userId: userId.toString() }, // Link to our internal user ID
        });
        user.stripeCustomerId = customer.id;
        await user.save(); // Save the new Stripe customer ID to the user's profile
        return customer.id;
      }
    } catch (error: any) {
      console.error('Error in getOrCreateStripeCustomer:', error);
      throw new HttpError(500, 'Failed to get or create Stripe customer.');
    }
  },

  /**
   * Issues a full refund for a given Stripe Payment Intent.
   * This is used when a card-paid order is cancelled.
   * @param paymentIntentId The Stripe Payment Intent ID associated with the order.
   * @returns A Promise that resolves to the Stripe Refund object.
   * @throws HttpError if the refund fails or the payment intent is invalid.
   */
  async refundOrder(paymentIntentId: string) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
      return refund;
    } catch (error: any) {
      console.error('Stripe Refund Error:', error);
      // Common errors: refund already exists, payment_intent not found, or not succeeded
      throw new HttpError(400, error.message || 'Failed to process Stripe refund.');
    }
  },
};
