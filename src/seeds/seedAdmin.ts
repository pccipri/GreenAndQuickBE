import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../schemas/UserSchema';
import { configEnvs } from '../config/env';
import {
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_FIRST_NAME,
  SEED_ADMIN_LAST_NAME,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_USERNAME,
  USER_ROLES,
} from '../utils/constants';

function shouldAllowProductionSeed(): boolean {
  return configEnvs.NODE_ENV === 'production' && configEnvs.ALLOW_PRODUCTION_SEED === true;
}

async function seedAdmin() {
  try {
    if (configEnvs.NODE_ENV === 'production' && !shouldAllowProductionSeed()) {
      console.error(
        'Refusing to seed admin in production. Set ALLOW_PRODUCTION_SEED=true to override.',
      );
      return;
    }

    if (shouldAllowProductionSeed()) {
      console.warn('WARNING: Production admin seeding override is enabled.');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(
      `mongodb+srv://${configEnvs.MONGODB_USERNAME}:${configEnvs.MONGODB_PASSWORD}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${configEnvs.MONGODB_APP_NAME}`,
      { dbName: configEnvs.MONGODB_DB_NAME },
    );
    console.log('Connected successfully.');

    const existingAdmin = await User.findOne({ email: SEED_ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seed.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, salt);

      await User.create({
        username: SEED_ADMIN_USERNAME,
        email: SEED_ADMIN_EMAIL,
        password: hashedPassword,
        role: USER_ROLES[1],
        isActive: true,
        firstName: SEED_ADMIN_FIRST_NAME,
        lastName: SEED_ADMIN_LAST_NAME,
      });

      console.log('Admin user created successfully:');
      console.log(`Email: ${SEED_ADMIN_EMAIL}`);
      console.log(`Password: ${SEED_ADMIN_PASSWORD}`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
