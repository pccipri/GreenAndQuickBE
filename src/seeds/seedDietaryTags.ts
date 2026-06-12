import mongoose from 'mongoose';
import { DietaryTag } from '@/schemas/DietaryTagSchema';
import { configEnvs } from '@/config/env';

const dietaryTags = [
  'vegan',
  'vegetarian',
  'glutenFree',
  'dairyFree',
  'halal',
  'kosher',
  'lowCalorie',
];

async function seedDietaryTags() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(
      `mongodb+srv://${configEnvs.MONGODB_USERNAME}:${configEnvs.MONGODB_PASSWORD}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${configEnvs.MONGODB_DB_NAME}`,
      { dbName: 'Quick_Green' },
    );

    console.log('Connected to MongoDB.');

    let createdCount = 0;
    let skippedCount = 0;

    for (const key of dietaryTags) {
      const normalizedKey = String(key).trim().toLowerCase();
      const existing = await DietaryTag.findOne({ key: normalizedKey });
      if (existing) {
        skippedCount++;
        console.log(`Dietary tag '${normalizedKey}' already exists. Skipping.`);
        continue;
      }

      await DietaryTag.create({ key: normalizedKey });
      createdCount++;
      console.log(`Created dietary tag '${normalizedKey}'.`);
    }

    console.log(`Dietary tag seeding complete. ${createdCount} created, ${skippedCount} skipped.`);
  } catch (error) {
    console.error('Error during dietary tag seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

seedDietaryTags();
