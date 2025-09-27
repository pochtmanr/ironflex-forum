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
  // Hardcoded MongoDB URI - no more environment variable issues!
  const MONGODB_URI = "mongodb://admin:1U72642Td%261S5NLVN@212.233.93.63:27017/MongoDB-8954?authSource=admin"

  console.log('Attempting to connect to MongoDB...')

  if (cached.conn) {
    console.log('Using cached MongoDB connection')
    return cached.conn
  }

        if (!cached.promise) {
          const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            serverSelectionRetryDelayMS: 5000,
            heartbeatFrequencyMS: 10000,
          }

          console.log('Creating new MongoDB connection with options:', opts)
          cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('MongoDB connected successfully')
            console.log('MongoDB ready state:', mongoose.connection.readyState)
            return mongoose
          }).catch((error) => {
            console.error('MongoDB connection error:', error)
            console.error('Error name:', error.name)
            console.error('Error message:', error.message)
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