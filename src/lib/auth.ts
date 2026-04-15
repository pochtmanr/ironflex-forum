import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET is required')
}

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m'
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d'

// Precomputed bcrypt hash used for timing-equalization in the login path.
// When a user lookup misses, callers compare the submitted password against
// this dummy hash so total wall-time roughly matches the user-exists branch,
// mitigating user-enumeration via timing differences.
export const DUMMY_BCRYPT_HASH = bcrypt.hashSync('placeholder', 12)

export interface UserPayload {
  id: string
  email: string
  username: string
  isAdmin: boolean
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateTokens = (user: UserPayload) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRE as any })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE as any })

  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export const verifyRefreshToken = (token: string): { id: string } | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string }
  } catch {
    return null
  }
}

export const getUserFromToken = async (token: string) => {
  const payload = verifyAccessToken(token)
  if (!payload) return null

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, username, display_name, photo_url, bio, city, country, is_active, is_admin, is_verified, google_id, github_id, vk_id, last_login, created_at, updated_at')
    .eq('id', payload.id)
    .single()

  if (error || !user) return null
  return user
}

// Verify token and return payload with role information
export const verifyToken = async (token: string): Promise<{ userId: string; id: string; email: string; username: string; role: string; isAdmin: boolean } | null> => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserPayload
    if (!payload) return null

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, is_admin, is_active')
      .eq('id', payload.id)
      .single()

    if (error || !user) return null
    // Reject deactivated accounts — every route that uses verifyToken()
    // auto-inherits this check.
    if (!user.is_active) return null

    const isAdmin = user.is_admin || false

    return {
      userId: user.id,
      id: user.id,
      email: user.email,
      username: user.username || user.email.split('@')[0],
      role: isAdmin ? 'admin' : 'user',
      isAdmin: isAdmin
    }
  } catch (error) {
    console.error('verifyToken error:', error)
    return null
  }
}

// Guard: returns a 401/403 NextResponse if the caller is not an authenticated admin.
// Re-fetches is_admin from the DB (never trusts the JWT claim — it may be stale).
// Usage in a route handler:
//   const guard = await requireAdmin(request)
//   if (guard instanceof NextResponse) return guard
//   const { userId } = guard
export const requireAdmin = async (
  request: NextRequest
): Promise<{ userId: string; email: string; username: string } | NextResponse> => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const token = authHeader.substring(7)
  const userData = await verifyToken(token)
  if (!userData || !userData.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { userId: userData.userId, email: userData.email, username: userData.username }
}
