import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, generateTokens, DUMMY_BCRYPT_HASH } from '@/lib/auth'

// ----- Rate limiting (in-memory, per-process) ---------------------------
// Per-IP: 10 attempts / 10 minutes
// Per-account (email or username): 5 attempts / 1 hour
// Mirrors the pattern in forgot-password/route.ts.

const IP_WINDOW_MS = 10 * 60 * 1000
const IP_MAX = 10
const ACCOUNT_WINDOW_MS = 60 * 60 * 1000
const ACCOUNT_MAX = 5

const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const accountRateLimitMap = new Map<string, { count: number; resetAt: number }>()

type LimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

function hitLimit(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  max: number,
  windowMs: number
): LimitResult {
  const now = Date.now()
  const entry = map.get(key)
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
  }
  entry.count++
  return { allowed: true }
}

let requestCounter = 0
function periodicCleanup() {
  requestCounter++
  if (requestCounter % 100 !== 0) return
  const now = Date.now()
  for (const [k, v] of ipRateLimitMap) if (now > v.resetAt) ipRateLimitMap.delete(k)
  for (const [k, v] of accountRateLimitMap) if (now > v.resetAt) accountRateLimitMap.delete(k)
}

// ------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Trust x-real-ip from our nginx; fall back to rightmost forwarded-for.
    const ip = request.headers.get('x-real-ip')
      || request.headers.get('x-forwarded-for')?.split(',').pop()?.trim()
      || 'unknown'

    periodicCleanup()

    const ipCheck = hitLimit(ipRateLimitMap, ip, IP_MAX, IP_WINDOW_MS)
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток входа. Попробуйте позже.' },
        { status: 429, headers: { 'Retry-After': String(ipCheck.retryAfterSeconds) } }
      )
    }

    const { emailOrUsername, password } = await request.json() as { emailOrUsername: string; password: string }

    // Validation
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    const searchValue = emailOrUsername.toLowerCase().trim()

    // Whitelist: email chars or username chars (no PostgREST metacharacters: , . : ( ) )
    if (!/^[a-z0-9._@+-]+$/.test(searchValue)) {
      return NextResponse.json(
        { error: 'Неверные данные для входа' },
        { status: 401 }
      )
    }

    // Per-account rate limit keyed on the normalized identifier.
    const accountCheck = hitLimit(accountRateLimitMap, searchValue, ACCOUNT_MAX, ACCOUNT_WINDOW_MS)
    if (!accountCheck.allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток входа для этого аккаунта. Попробуйте позже.' },
        { status: 429, headers: { 'Retry-After': String(accountCheck.retryAfterSeconds) } }
      )
    }

    // Single-field lookup (avoids .or() filter-string injection)
    const lookupColumn = searchValue.includes('@') ? 'email' : 'username'
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true)
      .eq(lookupColumn, searchValue)
      .maybeSingle()

    // Timing equalization: if the user doesn't exist OR has no password hash
    // (OAuth-only account), still run bcrypt.compare against a dummy hash so
    // the response time roughly matches the user-exists path.
    if (error || !user || !user.password_hash) {
      await bcrypt.compare(password, DUMMY_BCRYPT_HASH)
      return NextResponse.json(
        { error: 'Неверные данные для входа' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверные данные для входа' },
        { status: 401 }
      )
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin
    })

    // Persist the refresh token + last_login. Storing the RT enables rotation
    // and reuse-detection in /api/auth/refresh and revocation in /api/auth/logout.
    await supabaseAdmin
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        refresh_token: refreshToken,
      })
      .eq('id', user.id)

    const response = {
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        photoURL: user.photo_url,
        isAdmin: user.is_admin
      },
      accessToken,
      refreshToken
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    )
  }
}
