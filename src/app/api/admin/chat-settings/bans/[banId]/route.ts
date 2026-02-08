import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAccessToken } from '@/lib/auth'

// DELETE - unban (deactivate ban)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ banId: string }> }
) {
  try {
    const { banId } = await params

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

    const { error } = await supabaseAdmin
      .from('chat_user_bans')
      .update({ is_active: false })
      .eq('id', banId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unban error:', error)
    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 })
  }
}
