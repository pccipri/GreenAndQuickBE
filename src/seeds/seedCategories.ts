import mongoose from 'mongoose';
import { Category } from '@/schemas/CategorySchema';
import { normalizeNameAndSlug } from '@/middlewares/normalizeNameAndSlug';
import { configEnvs } from '@/config/env';
import { PRODUCT_CATEGORIES } from '@/utils/constants';

async function seedCategories() {
  console.log('Starting category seeding...');

  try {
    await mongoose.connect(
      `mongodb+srv://${configEnvs.MONGODB_USERNAME}:${configEnvs.MONGODB_PASSWORD}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${configEnvs.MONGODB_APP_NAME}`,
      { dbName: configEnvs.MONGODB_DB_NAME },
    );
    console.log('MongoDB connected for seeding.');

    let createdCount = 0;
    let skippedCount = 0;

    for (const categoryName of PRODUCT_CATEGORIES) {
      const slug = normalizeNameAndSlug(categoryName);
      const existingCategory = await Category.findOne({ $or: [{ name: categoryName }, { slug }] });

      if (existingCategory) {
        console.log(`Category "${categoryName}" already exists. Skipping.`);
        skippedCount++;
      } else {
        await Category.create({ name: categoryName, slug });
        console.log(`Category "${categoryName}" created.`);
        createdCount++;
      }
    }

    console.log(`Category seeding complete: ${createdCount} created, ${skippedCount} skipped.`);
  } catch (error) {
    console.error('Error during category seeding:', error);
    process.exit(1); // Exit with a non-zero code to indicate failure
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

seedCategories();
