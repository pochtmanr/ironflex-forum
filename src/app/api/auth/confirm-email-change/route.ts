import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateTokens } from '@/lib/auth'
import { sendEmailChangedNotification } from '@/lib/email'

// GET — confirm email change via token from email link
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Токен обязателен' }, { status: 400 })
    }

    // Find valid token
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('type', 'email_change')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !tokenRecord) {
      return NextResponse.json(
        { error: 'Недействительная или истёкшая ссылка' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, username, display_name, pending_email, is_admin')
      .eq('id', tokenRecord.user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Check pending_email exists (may have been cancelled)
    if (!user.pending_email) {
      return NextResponse.json(
        { error: 'Запрос на смену email был отменён' },
        { status: 400 }
      )
    }

    // Re-check uniqueness (race condition protection)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', user.pending_email)
      .neq('id', user.id)
      .single()

    if (existingUser) {
      // Clean up
      await supabaseAdmin
        .from('reset_tokens')
        .update({ used: true })
        .eq('id', tokenRecord.id)

      await supabaseAdmin
        .from('users')
        .update({ pending_email: null })
        .eq('id', user.id)

      return NextResponse.json(
        { error: 'Этот email уже занят другим пользователем' },
        { status: 409 }
      )
    }

    const oldEmail = user.email
    const newEmail = user.pending_email

    // Atomic update: swap email, clear pending, mark verified
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email: newEmail,
        pending_email: null,
        is_verified: true
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update email:', updateError)
      return NextResponse.json(
        { error: 'Не удалось обновить email' },
        { status: 500 }
      )
    }

    // Mark token as used
    await supabaseAdmin
      .from('reset_tokens')
      .update({ used: true })
      .eq('id', tokenRecord.id)

    // Delete all remaining email_change tokens for this user
    await supabaseAdmin
      .from('reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'email_change')
      .neq('id', tokenRecord.id)

    // Issue new JWT tokens (old ones contain the previous email)
    const newTokens = generateTokens({
      id: user.id,
      email: newEmail,
      username: user.username,
      isAdmin: user.is_admin
    })

    // Notify old email about the change (fire-and-forget)
    sendEmailChangedNotification(
      oldEmail,
      user.username || user.display_name || 'Пользователь'
    ).catch(err => console.error('Failed to send email changed notification:', err))

    return NextResponse.json({
      verified: true,
      newEmail,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      message: 'Email успешно изменён'
    })
  } catch (error) {
    console.error('Confirm email change error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
