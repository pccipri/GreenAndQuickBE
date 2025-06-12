import { IReview } from "../models/IReview";
import { Review } from "../schemas/ReviewSchema";

// Create a review
export const createReview = async (reviewData: IReview) => {
  const review = new Review(reviewData);
  const saved = await review.save();
  return saved.toJSON();
};

// Get all reviews
export const getAllReviews = async () => {
  const reviews = await Review.find();
  return reviews.map((review) => review.toJSON());
};

// Get a single review by ID
export const getReviewById = async (id: string) => {
  const review = await Review.findById(id);
  return review || null;
};

// Get reviews by user
export const getReviewsByUser = async (userId: string) => {
  return await Review.find({ user: userId });
};

// Get reviews by product
export const getReviewsByProduct = async (productId: string) => {
  return await Review.find({ product: productId });
};

// Get reviews by shop
export const getReviewsByShop = async (shopId: string) => {
  return await Review.find({ shop: shopId });
};

// Update review
export const updateReview = async (id: string, updatedData: Partial<IReview>) => {
  const updated = await Review.findByIdAndUpdate(id, updatedData, { new: true });
  return updated || null;
};

// Delete review
export const deleteReview = async (id: string) => {
  const deleted = await Review.findByIdAndDelete(id);
  return !!deleted;
};