import mongoose from 'mongoose'

// Function to connect to MongoDB
export async function connectToDatabase(mongodbUrl: string) {
  try {
    await mongoose.connect(mongodbUrl, { dbName: 'Quick_Green' })
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
  }
}
