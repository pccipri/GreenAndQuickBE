import { Router, Request, Response } from 'express';
import { createReview, deleteReview, getAllReviews, getReviewById, getReviewsByProduct, getReviewsByShop, getReviewsByUser, updateReview } from "../services/ReviewService";

const router = Router();

// Create review
router.post('/', async (req: Request, res: Response) => {
  try {
    const review = await createReview(req.body);
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create review', error: error.message });
  }
});

// Get all reviews
router.get('/', async (_req, res) => {
  try {
    const reviews = await getAllReviews();
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
});

// Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const review = await getReviewById(req.params.id);
    if (!review) res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch review', error: error.message });
  }
});

// Get reviews by user
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await getReviewsByUser(req.params.userId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch user reviews', error: error.message });
  }
});

// Get reviews by product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await getReviewsByProduct(req.params.productId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch product reviews', error: error.message });
  }
});

// Get reviews by shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const reviews = await getReviewsByShop(req.params.shopId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch shop reviews', error: error.message });
  }
});

// Update review
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateReview(req.params.id, req.body);
    if (!updated) res.status(404).json({ message: 'Review not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update review', error: error.message });
  }
});

// Delete review
router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteReview(req.params.id);
    if (!success) res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
});

export default router;