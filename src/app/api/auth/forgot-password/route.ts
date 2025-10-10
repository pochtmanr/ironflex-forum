import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ResetToken from '@/models/ResetToken'
import { generateSecureToken, sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
    
    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Check if user has a password (not OAuth only)
    if (!user.passwordHash) {
      return NextResponse.json({
        message: 'This account uses social login. Please use the social login option.'
      })
    }

    // Delete any existing password reset tokens for this user
    await ResetToken.deleteMany({
      userId: user._id.toString(),
      type: 'password_reset'
    })

    // Generate new reset token
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token
    await ResetToken.create({
      userId: user._id.toString(),
      token,
      type: 'password_reset',
      expiresAt
    })

    // Send reset email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.username,
      token
    )

    if (!emailSent) {
      console.error('Failed to send password reset email')
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
