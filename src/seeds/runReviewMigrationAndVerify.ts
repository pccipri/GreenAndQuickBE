import { connectToDatabase } from '../config/db';
import mongoose from 'mongoose';
import { ReviewsAndRatingsMigration } from './backfillRatings';

async function run() {
  const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
  await connectToDatabase(mongoUrl);

  try {
    // Run the migration
    await ReviewsAndRatingsMigration();

    // Verify Order indexes
    console.log('Verifying Order collection indexes...');
    const Order = mongoose.model('order');
    const orderIndexes = await Order.collection.indexes();
    console.log(
      'Order indexes:',
      orderIndexes.map((i: any) => i.key),
    );

    // Verify denormalized fields exist on a sample of documents
    const Product = mongoose.model('product');
    const Shop = mongoose.model('shop');
    const Recipe = mongoose.model('recipe');

    console.log('Checking sample documents for denormalized fields...');
    const [p, s, r] = await Promise.all([
      Product.findOne().select('averageRating reviewCount').lean(),
      Shop.findOne().select('averageRating reviewCount').lean(),
      Recipe.findOne().select('averageRating reviewCount').lean(),
    ]);

    console.log('Product sample:', p || 'no products');
    console.log('Shop sample:', s || 'no shops');
    console.log('Recipe sample:', r || 'no recipes');

    console.log('Verification complete.');
  } catch (err) {
    console.error('Migration/verification failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
