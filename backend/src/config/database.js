import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is required to start the backend.')
  }

  await mongoose.connect(uri)
  console.log('Connected to MongoDB.')
}
