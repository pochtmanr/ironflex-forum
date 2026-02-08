import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAccessToken } from '@/lib/auth'
import { generateSecureToken, sendEmailChangeVerificationEmail } from '@/lib/email'

// Rate limit: max 3 email change requests per user per hour
async function checkRateLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count } = await supabaseAdmin
    .from('reset_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'email_change')
    .gte('created_at', oneHourAgo)

  return (count || 0) < 3
}

// POST — request email change
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPayload = verifyAccessToken(authHeader.substring(7))
    if (!userPayload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const { newEmail } = await request.json()

    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const trimmedEmail = newEmail.trim().toLowerCase()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 200) {
      return NextResponse.json({ error: 'Некорректный формат email' }, { status: 400 })
    }

    // Get current user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, username, display_name, is_active')
      .eq('id', userPayload.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Аккаунт деактивирован' }, { status: 403 })
    }

    // No-op if same email
    if (trimmedEmail === user.email) {
      return NextResponse.json({ error: 'Новый email совпадает с текущим' }, { status: 400 })
    }

    // Rate limit check
    const withinLimit = await checkRateLimit(user.id)
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте позже.' },
        { status: 429 }
      )
    }

    // Check if email is already taken (return generic success for enumeration protection)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .neq('id', user.id)
      .single()

    if (existingUser) {
      // Don't reveal that email is taken — return success but don't send email
      return NextResponse.json({
        message: 'Письмо с подтверждением отправлено на новый адрес'
      })
    }

    // Delete any existing email_change tokens for this user
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'email_change')

    // Generate token
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    // Save token
    await supabaseAdmin
      .from('reset_tokens')
      .insert({
        user_id: user.id,
        token,
        type: 'email_change',
        expires_at: expiresAt
      })

    // Save pending email on user
    await supabaseAdmin
      .from('users')
      .update({ pending_email: trimmedEmail })
      .eq('id', user.id)

    // Send verification email to the NEW address
    const emailSent = await sendEmailChangeVerificationEmail(
      trimmedEmail,
      user.username || user.display_name || 'Пользователь',
      token
    )

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Не удалось отправить письмо. Попробуйте позже.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Письмо с подтверждением отправлено на новый адрес',
      pendingEmail: trimmedEmail
    })
  } catch (error) {
    console.error('Change email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — cancel pending email change
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPayload = verifyAccessToken(authHeader.substring(7))
    if (!userPayload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Delete all email_change tokens
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('user_id', userPayload.id)
      .eq('type', 'email_change')

    // Clear pending_email
    await supabaseAdmin
      .from('users')
      .update({ pending_email: null })
      .eq('id', userPayload.id)

    return NextResponse.json({ message: 'Запрос на смену email отменён' })
  } catch (error) {
    console.error('Cancel email change error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
