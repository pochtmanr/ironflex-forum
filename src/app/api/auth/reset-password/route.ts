import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ResetToken from '@/models/ResetToken'
import { hashPassword } from '@/lib/auth'

// POST endpoint to reset password with token
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { token, newPassword } = await request.json()

    // Validation
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать не менее 8 символов' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать хотя бы одну заглавную букву (A-Z)' },
        { status: 400 }
      )
    }

    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать хотя бы одну строчную букву (a-z)' },
        { status: 400 }
      )
    }

    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать хотя бы одну цифру (0-9)' },
        { status: 400 }
      )
    }

    // Find reset token
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

    // Get user
    const user = await User.findById(resetToken.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    user.passwordHash = passwordHash
    await user.save()

    // Mark token as used
    resetToken.used = true
    await resetToken.save()

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

// GET endpoint to verify reset token
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

    // Find reset token
    const resetToken = await ResetToken.findOne({
      token,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token', valid: false },
        { status: 400 }
      )
    }

    // Get user info (without sensitive data)
    const user = await User.findById(resetToken.userId).select('email username')
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', valid: false },
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
      { error: 'Internal server error', valid: false },
      { status: 500 }
    )
  }
}

