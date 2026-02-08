import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAccessToken } from '@/lib/auth'

async function requireAdmin(request: NextRequest): Promise<{ userId: string } | Response> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const payload = verifyAccessToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('id', payload.id)
    .single()
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { userId: payload.id }
}

// GET - list all chat bans (active only by default)
export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin(request)
    if (result instanceof Response) return result

    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    let query = supabaseAdmin
      .from('chat_user_bans')
      .select('id, user_id, reason, banned_at, expires_at, is_active, users:user_id(username, display_name, photo_url)')
      .order('banned_at', { ascending: false })

    if (!showAll) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error

    const bans = (data || []).map((ban: Record<string, unknown>) => ({
      id: ban.id,
      user_id: ban.user_id,
      reason: ban.reason,
      banned_at: ban.banned_at,
      expires_at: ban.expires_at,
      is_active: ban.is_active,
      user_name: (ban.users as Record<string, unknown> | null)?.display_name || (ban.users as Record<string, unknown> | null)?.username || 'Unknown',
      user_photo_url: (ban.users as Record<string, unknown> | null)?.photo_url || null,
    }))

    return NextResponse.json({ bans })
  } catch (error) {
    console.error('Bans fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch bans' }, { status: 500 })
  }
}

// POST - ban a user from chat
export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin(request)
    if (result instanceof Response) return result
    const admin = result

    const body = await request.json()
    const { userId, reason, duration } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Don't allow banning admins
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (targetUser?.is_admin) {
      return NextResponse.json({ error: 'Нельзя заблокировать администратора' }, { status: 400 })
    }

    // Deactivate any existing active bans for this user first
    await supabaseAdmin
      .from('chat_user_bans')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)

    // Calculate expiration
    let expiresAt: string | null = null
    if (duration && duration > 0) {
      const expires = new Date()
      expires.setHours(expires.getHours() + duration)
      expiresAt = expires.toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('chat_user_bans')
      .insert({
        user_id: userId,
        reason: reason || null,
        banned_by: admin.userId,
        expires_at: expiresAt,
        is_active: true,
      })
      .select('id, user_id, reason, banned_at, expires_at, is_active')
      .single()

    if (error) throw error

    return NextResponse.json({ ban: data })
  } catch (error) {
    console.error('Ban create error:', error)
    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
  }
}
