import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateSecureToken, sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'Если аккаунт с таким email существует, то ссылка для сброса пароля была отправлена.'
      })
    }

    // Check if user has a password (not OAuth-only)
    if (!user.password_hash) {
      return NextResponse.json({
        message: 'Если аккаунт с таким email существует, то ссылка для сброса пароля была отправлена.'
      })
    }

    // Delete any existing password reset tokens for this user
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'password_reset')

    // Generate reset token
    const resetToken = generateSecureToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    // Save reset token
    await supabaseAdmin
      .from('reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        type: 'password_reset',
        expires_at: expiresAt
      })

    // Send reset email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      user.username || user.display_name || 'Пользователь',
      resetToken
    )

    if (!emailSent) {
      console.error('Failed to send password reset email')
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Если аккаунт с таким email существует, то ссылка для сброса пароля была отправлена.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
