import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ResetToken from '@/models/ResetToken'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { token, password } = await request.json()

    // Validation
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Find valid reset token
    const resetToken = await ResetToken.findOne({
      token,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findById(resetToken.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user password
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      updatedAt: new Date()
    })

    // Mark token as used
    await ResetToken.findByIdAndUpdate(resetToken._id, {
      used: true
    })

    // Delete all other reset tokens for this user
    await ResetToken.deleteMany({
      userId: user._id.toString(),
      type: 'password_reset',
      _id: { $ne: resetToken._id }
    })

    return NextResponse.json({
      message: 'Password has been reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
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

    // Find valid reset token
    const resetToken = await ResetToken.findOne({
      token,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Get user info (without sensitive data)
    const user = await User.findById(resetToken.userId).select('email username')
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      username: user.username
    })

  } catch (error) {
    console.error('Verify reset token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
