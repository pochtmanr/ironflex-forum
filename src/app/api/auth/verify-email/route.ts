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
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userPayload = verifyAccessToken(token)

    if (!userPayload) {
      return NextResponse.json(
        { error: 'Недействительный или просроченный токен' },
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
        { error: 'Аккаунт не найден' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.is_verified) {
      return NextResponse.json(
        { error: 'Email адрес уже подтвержден' },
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
        { error: 'Не удалось отправить письмо с подтверждением. Пожалуйста, попробуйте позже.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Письмо с подтверждением отправлено. Пожалуйста, проверьте ваш почтовый ящик.'
    })

  } catch (error) {
    console.error('Ошибка отправки письма с подтверждением:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
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
        { error: 'Токен обязателен' },
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
        { error: 'Недействительный или просроченный токен подтверждения' },
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
        { error: 'Аккаунт не найден' },
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
        message: 'Email адрес уже подтвержден',
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
      console.error('Не удалось отправить письмо приветствия:', emailError)
    }

    // Delete all other verification tokens for this user
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'email_verification')
      .neq('id', verificationToken.id)

    return NextResponse.json({
      message: 'Email адрес успешно подтвержден!',
      verified: true
    })

  } catch (error) {
    console.error('Ошибка подтверждения email:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
