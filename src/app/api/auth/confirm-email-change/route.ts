import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ResetToken from '@/models/ResetToken'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { token } = await request.json()

    // Validation
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find valid change token
    const changeToken = await ResetToken.findOne({
      token,
      type: 'email_change',
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!changeToken) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findById(changeToken.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if new email is still available
    const existingUser = await User.findOne({ 
      email: changeToken.email,
      _id: { $ne: user._id }
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is no longer available' },
        { status: 409 }
      )
    }

    const oldEmail = user.email

    // Update user email
    await User.findByIdAndUpdate(user._id, {
      email: changeToken.email,
      isVerified: true, // New email is automatically verified
      updatedAt: new Date()
    })

    // Mark token as used
    await ResetToken.findByIdAndUpdate(changeToken._id, {
      used: true
    })

    // Delete all other email change tokens for this user
    await ResetToken.deleteMany({
      userId: user._id.toString(),
      type: 'email_change',
      _id: { $ne: changeToken._id }
    })

    return NextResponse.json({
      message: 'Email address has been changed successfully',
      oldEmail,
      newEmail: changeToken.email
    })

  } catch (error) {
    console.error('Confirm email change error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify token validity
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find valid change token
    const changeToken = await ResetToken.findOne({
      token,
      type: 'email_change',
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!changeToken) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 400 }
      )
    }

    // Get user info (without sensitive data)
    const user = await User.findById(changeToken.userId).select('email username')
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      currentEmail: user.email,
      newEmail: changeToken.email,
      username: user.username
    })

  } catch (error) {
    console.error('Verify email change token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
