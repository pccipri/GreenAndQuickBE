import mongoose from 'mongoose';
import { DietaryTag } from '@/schemas/DietaryTagSchema';
import { configEnvs } from '@/config/env';
import { DIETARY_TAGS } from '@/utils/constants';

async function seedDietaryTags() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(
      `mongodb+srv://${configEnvs.MONGODB_USERNAME}:${configEnvs.MONGODB_PASSWORD}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${configEnvs.MONGODB_APP_NAME}`,
      { dbName: configEnvs.MONGODB_DB_NAME },
    );

    console.log('Connected to MongoDB.');

    const normalizedKeys = [
      ...new Set(DIETARY_TAGS.map((key) => String(key).trim().toLowerCase())),
    ];

    const result = await DietaryTag.bulkWrite(
      normalizedKeys.map((key) => ({
        updateOne: {
          filter: { key },
          update: { $setOnInsert: { key } },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    const createdCount = result.upsertedCount;
    const skippedCount = normalizedKeys.length - createdCount;

    normalizedKeys.forEach((key) => {
      console.log(`Dietary tag '${key}' ensured.`);
    });

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
