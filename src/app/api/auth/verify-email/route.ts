import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ResetToken from '@/models/ResetToken'
import { verifyAccessToken } from '@/lib/auth'
import { generateSecureToken, sendEmailVerificationEmail } from '@/lib/email'

// POST endpoint to send verification email
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userPayload = verifyAccessToken(token)
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Find current user
    const user = await User.findById(userPayload.id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Delete any existing verification tokens for this user
    await ResetToken.deleteMany({
      userId: user._id.toString(),
      type: 'email_verification'
    })

    // Generate new verification token
    const verificationToken = generateSecureToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save verification token
    await ResetToken.create({
      userId: user._id.toString(),
      token: verificationToken,
      type: 'email_verification',
      expiresAt
    })

    // Send verification email
    const emailSent = await sendEmailVerificationEmail(
      user.email,
      user.username,
      verificationToken
    )

    if (!emailSent) {
      console.error('Failed to send email verification')
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Verification email sent. Please check your inbox.'
    })

  } catch (error) {
    console.error('Send verification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify email with token
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

    // Find valid verification token
    const verificationToken = await ResetToken.findOne({
      token,
      type: 'email_verification',
      used: false,
      expiresAt: { $gt: new Date() }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findById(verificationToken.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.isVerified) {
      return NextResponse.json({
        message: 'Email is already verified',
        alreadyVerified: true
      })
    }

    // Update user verification status
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      updatedAt: new Date()
    })

    // Mark token as used
    await ResetToken.findByIdAndUpdate(verificationToken._id, {
      used: true
    })

    // Delete all other verification tokens for this user
    await ResetToken.deleteMany({
      userId: user._id.toString(),
      type: 'email_verification',
      _id: { $ne: verificationToken._id }
    })

    return NextResponse.json({
      message: 'Email has been verified successfully',
      verified: true
    })

  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
