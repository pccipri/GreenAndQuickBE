import mongoose, { Types } from 'mongoose';
import { HttpError } from '@/middlewares/errorHandler';
import { IReview } from '../models/IReview';
import { Review } from '../schemas/ReviewSchema';
import { Product } from '../schemas/ProductSchema';
import { Shop } from '../schemas/ShopSchema';
import { Recipe } from '../schemas/RecipeSchema';
import { User } from '@/schemas/UserSchema';
import { escapeHtml } from '@/utils/helpers';

/**
 * Recalculates and updates the averageRating and reviewCount for a target entity (Product, Shop, or Recipe).
 * This ensures that denormalized fields stay in sync without requiring expensive aggregations on reads.
 */
export const updateTargetRating = async (
  targetType: 'product' | 'shop' | 'recipe',
  targetId: string | Types.ObjectId,
) => {
  try {
    const id = typeof targetId === 'string' ? new Types.ObjectId(targetId) : targetId;

    const result = await Review.aggregate([
      { $match: { targetType, targetId: id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const stats = result[0] || { averageRating: 0, reviewCount: 0 };

    const update = {
      averageRating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: stats.reviewCount,
    };

    const models: Record<string, any> = {
      product: Product,
      shop: Shop,
      recipe: Recipe,
    };
    const TargetModel = models[targetType];

    if (TargetModel) {
      await TargetModel.findByIdAndUpdate(id, { $set: update });
    }
  } catch (error: any) {
    // Operational logging as per Step 7
    console.error(
      `[ReviewService] updateTargetRating failed for ${targetType} ${targetId}:`,
      error,
    );
  }
};

/**
 * Checks if a user is eligible to review a target and determines verified purchase status.
 * Recipes: any active user.
 * Products/Shops: verified buyers only (must have a delivered order).
 */
export const checkReviewEligibility = async (
  userId: string,
  isActive: boolean,
  targetType: 'product' | 'shop' | 'recipe',
  targetId: string | Types.ObjectId,
): Promise<{ eligible: boolean; isVerifiedPurchase: boolean }> => {
  if (!isActive) return { eligible: false, isVerifiedPurchase: false };

  if (targetType === 'recipe') {
    return { eligible: true, isVerifiedPurchase: false };
  }

  // Accessing Order model to verify purchase history
  const Order = mongoose.model('order');
  const targetField = targetType === 'product' ? 'items.productId' : 'items.shopId';

  const orderExists = await Order.exists({
    customerId: userId,
    status: 'delivered',
    [targetField]: targetId,
  });

  return { eligible: !!orderExists, isVerifiedPurchase: !!orderExists };
};

/**
 * Creates a new review after verifying eligibility and checking for duplicates.
 * Triggers denormalized rating update on success.
 */
export const createReview = async (
  authorId: string,
  isActive: boolean,
  data: Pick<IReview, 'targetType' | 'targetId' | 'rating' | 'comment'>,
) => {
  // 1. Check eligibility (Verified buyer logic for Products/Shops)
  const eligibility = await checkReviewEligibility(
    authorId,
    isActive,
    data.targetType,
    data.targetId,
  );
  if (!eligibility.eligible) {
    throw new HttpError(403, 'review.notEligible');
  }

  // 2. Check for duplicate review (One review per user per item)
  const existing = await Review.exists({
    authorId,
    targetType: data.targetType,
    targetId: data.targetId,
  });
  if (existing) {
    throw new HttpError(409, 'review.alreadyExists');
  }

  const sanitizedComment = data.comment ? escapeHtml(data.comment.trim()) : null;

  // 3. Create and save the review
  const review = new Review({
    ...data,
    authorId,
    comment: sanitizedComment,
    isVerifiedPurchase: eligibility.isVerifiedPurchase,
  });

  let saved;
  try {
    saved = await review.save();
  } catch (error: any) {
    if (error.code === 11000) {
      throw new HttpError(409, 'review.alreadyExists');
    }
    throw error;
  }

  return saved;
};

/**
 * Lists reviews for a specific target with pagination and author info.
 */
export const listReviews = async (params: {
  targetType: 'product' | 'shop' | 'recipe';
  targetId: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
}) => {
  const { targetType, targetId, page = 1, limit = 10 } = params;
  const skip = (Math.max(1, page) - 1) * limit;

  const query = { targetType, targetId: new Types.ObjectId(targetId) };

  const sortMap: Record<string, any> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
  };
  const sort = sortMap[params.sort || 'newest'];

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'firstName lastName avatarPath')
      .lean(),
    Review.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Advanced review listing for Admins.
 * Supports searching by author name or comment content and filtering by target.
 */
export const adminListReviews = async (params: {
  targetType?: 'product' | 'shop' | 'recipe';
  targetId?: string;
  authorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
}) => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (params.targetType) filter.targetType = params.targetType;
  if (params.targetId) filter.targetId = new Types.ObjectId(params.targetId);
  if (params.authorId) filter.authorId = new Types.ObjectId(params.authorId);

  if (params.search) {
    // Find users whose name matches search to filter by author name
    const matchingUsers = await User.find({
      $or: [
        { firstName: { $regex: params.search, $options: 'i' } },
        { lastName: { $regex: params.search, $options: 'i' } },
      ],
    }).select('_id');

    const userIds = matchingUsers.map((u) => u._id);

    filter.$or = [
      { comment: { $regex: params.search, $options: 'i' } },
      { authorId: { $in: userIds } },
    ];
  }

  const sortMap: Record<string, any> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highest: { rating: -1, createdAt: -1 },
    lowest: { rating: 1, createdAt: -1 },
  };
  const sort = sortMap[params.sort || 'newest'];

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'firstName lastName avatarPath email')
      .lean(),
    Review.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

// Delete review
export const deleteReview = async (id: string, requesterId: string, isAdmin: boolean) => {
  const review = await Review.findById(id);
  if (!review) throw new HttpError(404, 'review.notFound');

  // Only the author or an admin can delete a review
  if (!isAdmin && review.authorId.toString() !== requesterId) {
    throw new HttpError(403, 'auth.forbidden');
  }

  await Review.findByIdAndDelete(id);

  return true;
};

/**
 * Bulk deletes reviews by their IDs.
 * Only accessible by admins. Recalculates ratings for affected targets.
 */
export const bulkDeleteReviews = async (reviewIds: string[]) => {
  // 1. Find the reviews to get their targetType and targetId before deletion
  const reviewsToDelete = await Review.find({ _id: { $in: reviewIds } }).select(
    'targetType targetId',
  );

  if (reviewsToDelete.length === 0) {
    return { deletedCount: 0 };
  }

  // 2. Perform the bulk deletion
  const result = await Review.deleteMany({ _id: { $in: reviewIds } });

  // 3. Recalculate ratings for all affected unique targets
  const uniqueTargets = new Set(reviewsToDelete.map((r) => `${r.targetType}-${r.targetId}`));
  for (const target of uniqueTargets) {
    const [targetType, targetId] = target.split('-');
    await updateTargetRating(targetType as any, targetId);
  }

  return { deletedCount: result.deletedCount };
};

/**
 * Deletes all reviews associated with a target.
 * Internal utility for cascade cleanup.
 */
export const cleanupTargetReviews = async (
  targetType: 'product' | 'shop' | 'recipe',
  targetId: string | Types.ObjectId,
) => {
  await Review.deleteMany({ targetType, targetId });
};
