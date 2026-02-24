import { ISubscription } from '../models/ISubscription';
import { Subscription } from '../schemas/SubscriptionSchema';

// Create subscription
export const createSubscription = async (data: ISubscription) => {
  const subscription = new Subscription(data);
  const saved = await subscription.save();
  return saved.toJSON();
};

// Get all subscriptions
export const getAllSubscriptions = async () => {
  const subscriptions = await Subscription.find();
  return subscriptions.map((s) => s.toJSON());
};

// Get subscription by ID
export const getSubscriptionById = async (id: string) => {
  const subscription = await Subscription.findById(id);
  return subscription || null;
};

// Get subscriptions by user
export const getSubscriptionsByUser = async (userId: string) => {
  return await Subscription.find({ userId });
};

// Update subscription
export const updateSubscription = async (id: string, updatedData: Partial<ISubscription>) => {
  const updated = await Subscription.findByIdAndUpdate(id, updatedData, { new: true });
  return updated || null;
};

// Delete subscription
export const deleteSubscription = async (id: string) => {
  const deleted = await Subscription.findByIdAndDelete(id);
  return !!deleted;
};
