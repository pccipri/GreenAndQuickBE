import mongoose from 'mongoose';
import { Product } from '../schemas/ProductSchema';
import { Shop } from '../schemas/ShopSchema';
import { Recipe } from '../schemas/RecipeSchema';
import { Review } from '../schemas/ReviewSchema';
import { updateTargetRating } from '../services/ReviewService';

/**
 * Migration script for Reviews & Ratings.
 * Handles data backfilling and ensuring indexes on collections not directly managed in this feature's scope.
 */
export async function ReviewsAndRatingsMigration() {
  console.log('--- Starting Reviews and Ratings Migration ---');

  try {
    // 1. Ensure indexes on Order collection for eligibility checks
    console.log('Ensuring indexes on Order collection...');
    const Order = mongoose.model('order');
    await Order.collection.createIndex({ customerId: 1, status: 1 });
    await Order.collection.createIndex({ 'items.productId': 1 });
    await Order.collection.createIndex({ 'items.shopId': 1 });

    // 2. Initialize missing denormalized fields on existing targets
    console.log('Initializing denormalized fields on Products, Shops, and Recipes...');

    await Promise.all([
      Product.updateMany(
        { averageRating: { $exists: false } },
        { $set: { averageRating: 0, reviewCount: 0 } },
      ),
      Shop.updateMany(
        { averageRating: { $exists: false } },
        { $set: { averageRating: 0, reviewCount: 0 } },
      ),
      Recipe.updateMany(
        { averageRating: { $exists: false } },
        { $set: { averageRating: 0, reviewCount: 0 } },
      ),
    ]);

    console.log('Field initialization complete.');

    // 3. Recompute ratings for all targets that already have reviews
    console.log('Recomputing ratings for active targets...');
    const targets = await Review.aggregate([
      { $group: { _id: { targetId: '$targetId', targetType: '$targetType' } } },
    ]);

    console.log(`Found ${targets.length} unique targets requiring recomputation.`);

    for (const target of targets) {
      const { targetId, targetType } = target._id;
      await updateTargetRating(targetType, targetId);
    }

    console.log('--- Reviews and Ratings Migration Completed Successfully ---');
  } catch (error) {
    console.error('Reviews and Ratings Migration failed:', error);
    throw error;
  }
}
