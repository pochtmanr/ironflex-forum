import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyAccessToken, verifyPassword, hashPassword } from '@/lib/auth'

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
      console.log('Change password: Token verification failed')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('Change password: Token verified for user:', userPayload.id)

    const { currentPassword, newPassword } = await request.json()

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
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

    // Check if user has a password (not OAuth only)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account uses social login. Cannot change password.' },
        { status: 400 }
      )
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update user password
    await User.findByIdAndUpdate(user._id, {
      passwordHash: newPasswordHash,
      updatedAt: new Date()
    })

    return NextResponse.json({
      message: 'Password has been changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
