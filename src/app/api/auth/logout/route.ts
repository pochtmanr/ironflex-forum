import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAccessToken } from '@/lib/auth'

// Revokes the caller's refresh token by clearing users.refresh_token.
// This is the counterpart to refresh-token rotation — without it, a
// leaked RT stays valid until the next successful login overwrites it.
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ refresh_token: null })
      .eq('id', payload.id)

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Failed to log out' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Logged out successfully' })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
