import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    console.log('Test DB endpoint called')
    await connectDB()
    console.log('MongoDB connected for test')

    // Test read
    console.log('Testing read operation...')
    const userCount = await User.countDocuments()
    console.log('User count:', userCount)

    // Test write (create a test user)
    console.log('Testing write operation...')
    const testUser = await User.create({
      email: `test-${Date.now()}@test.com`,
      username: `testuser${Date.now()}`,
      passwordHash: 'test-hash',
      displayName: 'Test User',
      isActive: true,
      isAdmin: false
    })
    console.log('Test user created:', testUser._id)

    // Clean up test user
    await User.deleteOne({ _id: testUser._id })
    console.log('Test user deleted')

    return NextResponse.json({
      success: true,
      userCount,
      message: 'Database read/write test successful'
    })

  } catch (error) {
    console.error('Test DB error:', error)
    return NextResponse.json(
      { 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
