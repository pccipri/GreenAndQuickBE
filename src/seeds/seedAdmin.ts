import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../schemas/UserSchema';
import { configEnvs } from '../config/env';

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(
      `mongodb+srv://${configEnvs.MONGODB_USERNAME}:${configEnvs.MONGODB_PASSWORD}@cluster0.ry12e.mongodb.net/?retryWrites=true&w=majority&appName=${configEnvs.MONGODB_DB_NAME}`,
      { dbName: 'Quick_Green' },
    );
    console.log('Connected successfully.');

    const adminEmail = 'admin@greenquick.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists. Skipping seed.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('AdminPassword123!', salt);

      await User.create({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        firstName: 'System',
        lastName: 'Admin',
      });

      console.log('Admin user created successfully:');
      console.log(`Email: ${adminEmail}`);
      console.log('Password: AdminPassword123!');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
