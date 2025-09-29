import mongoose from 'mongoose'

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (global as any).mongoose

if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function connectDB() {
  // Use environment variable for MongoDB URI
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin"

  console.log('Attempting to connect to MongoDB...')

  if (cached.conn) {
    console.log('Using cached MongoDB connection')
    return cached.conn
  }

        if (!cached.promise) {
          const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            maxPoolSize: 1,
          }

          console.log('Creating new MongoDB connection...')
          console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')) // Hide credentials in logs
          cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('MongoDB connected successfully')
            return mongoose
          }).catch((error) => {
            console.error('MongoDB connection error:', error)
            console.error('Connection URI (masked):', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'))
            throw error
          })
        }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    console.error('MongoDB connection failed:', e)
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB