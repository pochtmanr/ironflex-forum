import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAccessToken } from '@/lib/auth'
import { generateSecureToken, sendEmailVerificationEmail, sendWelcomeEmail } from '@/lib/email'

// POST endpoint to send verification email
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Get user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userPayload.id)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.is_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Delete any existing verification tokens for this user
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'email_verification')

    // Generate new verification token
    const verificationToken = generateSecureToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Save verification token
    await supabaseAdmin
      .from('reset_tokens')
      .insert({
        user_id: user.id,
        token: verificationToken,
        type: 'email_verification',
        expires_at: expiresAt
      })

    // Send verification email
    const emailSent = await sendEmailVerificationEmail(
      user.email,
      user.username || user.display_name || 'Пользователь',
      verificationToken
    )

    if (!emailSent) {
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
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find verification token
    const { data: verificationToken, error: tokenError } = await supabaseAdmin
      .from('reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('type', 'email_verification')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', verificationToken.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.is_verified) {
      await supabaseAdmin
        .from('reset_tokens')
        .update({ used: true })
        .eq('id', verificationToken.id)

      return NextResponse.json({
        message: 'Email is already verified',
        alreadyVerified: true
      })
    }

    // Update user verification status
    await supabaseAdmin
      .from('users')
      .update({ is_verified: true })
      .eq('id', user.id)

    // Mark token as used
    await supabaseAdmin
      .from('reset_tokens')
      .update({ used: true })
      .eq('id', verificationToken.id)

    // Send welcome email
    try {
      await sendWelcomeEmail(
        user.email,
        user.username || user.display_name || 'Пользователь'
      )
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    // Delete all other verification tokens for this user
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'email_verification')
      .neq('id', verificationToken.id)

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
