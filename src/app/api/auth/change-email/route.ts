import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ResetToken from '@/models/ResetToken'
import { verifyAccessToken } from '@/lib/auth'
import { generateSecureToken, sendEmailChangeConfirmation } from '@/lib/email'

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
      console.log('Change email: Token verification failed')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('Change email: Token verified for user:', userPayload.id)

    const { newEmail } = await request.json()

    // Validation
    if (!newEmail) {
      return NextResponse.json(
        { error: 'New email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
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

    // Check if new email is the same as current
    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'New email must be different from current email' },
        { status: 400 }
      )
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ 
      email: newEmail.toLowerCase(),
      _id: { $ne: user._id }
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 409 }
      )
    }

    // Delete any existing email change tokens for this user
    await ResetToken.deleteMany({
      userId: user._id.toString(),
      type: 'email_change'
    })

    // Generate new change token
    const changeToken = generateSecureToken()
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours

    // Save change token
    await ResetToken.create({
      userId: user._id.toString(),
      token: changeToken,
      type: 'email_change',
      email: newEmail.toLowerCase(),
      expiresAt
    })

    // Send confirmation email to new address
    const emailSent = await sendEmailChangeConfirmation(
      newEmail,
      user.username || user.displayName || 'Пользователь',
      user.email,
      changeToken
    )

    if (!emailSent) {
      console.error('Failed to send email change confirmation')
      return NextResponse.json(
        { error: 'Failed to send confirmation email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Confirmation email sent to new address. Please check your inbox.'
    })

  } catch (error) {
    console.error('Change email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
