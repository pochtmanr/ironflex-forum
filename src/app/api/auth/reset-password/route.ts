import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

// POST endpoint to reset password with token
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    // Validation
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать не менее 6ти символов' },
        { status: 400 }
      )
    }

    // Find reset token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('type', 'password_reset')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', resetToken.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id)

    // Mark token as used
    await supabaseAdmin
      .from('reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    // Delete all other reset tokens for this user
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'password_reset')
      .neq('id', resetToken.id)

    return NextResponse.json({
      message: 'Пароль был успешно сброшен'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify reset token
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

    // Find reset token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('type', 'password_reset')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token', valid: false },
        { status: 400 }
      )
    }

    // Get user info (without sensitive data)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, username')
      .eq('id', resetToken.user_id)
      .single()

    if (userError || !user) {
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
