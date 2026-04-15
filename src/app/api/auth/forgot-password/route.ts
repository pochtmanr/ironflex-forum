import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateSecureToken, sendPasswordResetEmail } from '@/lib/email'

// In-memory rate limiting: max 3 requests per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return true
  }

  if (entry.count >= 3) {
    return false
  }

  entry.count++
  return true
}

// Periodic cleanup (every 100 requests)
let requestCounter = 0
function cleanupRateLimitMap() {
  requestCounter++
  if (requestCounter % 100 === 0) {
    const now = Date.now()
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key)
      }
    }
  }
}

const UNIFORM_MESSAGE = 'Если аккаунт с таким email существует, то ссылка для сброса пароля была отправлена.'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    // Trust x-real-ip from our nginx; fallback to rightmost forwarded-for to avoid client spoofing
    const ip = request.headers.get('x-real-ip')
      || request.headers.get('x-forwarded-for')?.split(',').pop()?.trim()
      || 'unknown'

    cleanupRateLimitMap()

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ message: UNIFORM_MESSAGE })
    }

    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).toLowerCase()

    // Timing decoupling: respond uniformly BEFORE doing any DB writes or
    // SMTP sends. We kick the actual work into a microtask so the response
    // latency does not reveal whether the email is registered.
    const respond = NextResponse.json({ message: UNIFORM_MESSAGE })

    queueMicrotask(async () => {
      try {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', normalizedEmail)
          .eq('is_active', true)
          .single()

        if (!user || !user.password_hash) return

        // Clear prior reset tokens for this user
        await supabaseAdmin
          .from('reset_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('type', 'password_reset')

        // Issue a new token
        const resetToken = generateSecureToken()
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

        await supabaseAdmin
          .from('reset_tokens')
          .insert({
            user_id: user.id,
            token: resetToken,
            type: 'password_reset',
            expires_at: expiresAt,
          })

        const emailSent = await sendPasswordResetEmail(
          user.email,
          user.username || user.display_name || 'Пользователь',
          resetToken
        )

        if (!emailSent) {
          console.error('Failed to send password reset email for user', user.id)
        }
      } catch (err) {
        console.error('reset flow error', err)
      }
    })

    return respond

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
