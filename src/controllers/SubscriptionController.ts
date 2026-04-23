import { Response, Request, Router } from 'express';
import {
  createSubscription,
  deleteSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionsByUser,
  updateSubscription,
} from '../services/SubscriptionService';

const router = Router();

// Create subscription
router.post('/', async (req: Request, res: Response) => {
  try {
    const subscription = await createSubscription(req.body);
    res.status(201).json(subscription);
  } catch (error: any) {
    res.status(400).json({ error: 'subscription.createFailed' });
  }
});

// Get all subscriptions
router.get('/', async (_req, res) => {
  try {
    const subscriptions = await getAllSubscriptions();
    res.json(subscriptions);
  } catch (error: any) {
    res.status(500).json({ error: 'subscription.fetchAllFailed' });
  }
});

// Get subscription by ID
router.get('/:id', async (req, res) => {
  try {
    const subscription = await getSubscriptionById(req.params.id);
    if (!subscription) res.status(404).json({ error: 'subscription.notFound' });
    res.json(subscription);
  } catch (error: any) {
    res.status(500).json({ error: 'subscription.fetchFailed' });
  }
});

// Get subscriptions by user
router.get('/user/:userId', async (req, res) => {
  try {
    const subscriptions = await getSubscriptionsByUser(req.params.userId);
    res.json(subscriptions);
  } catch (error: any) {
    res.status(500).json({ error: 'subscription.fetchByUserFailed' });
  }
});

// Update subscription
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateSubscription(req.params.id, req.body);
    if (!updated) res.status(404).json({ error: 'subscription.notFound' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: 'subscription.updateFailed' });
  }
});

// Delete subscription
router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteSubscription(req.params.id);
    if (!success) res.status(404).json({ error: 'subscription.notFound' });
    res.json({ message: 'Subscription deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'subscription.deleteFailed' });
  }
});

export default router;
