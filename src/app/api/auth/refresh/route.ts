import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyRefreshToken, generateTokens } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    // Validation
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Verify refresh token signature
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Look up the user + stored refresh token
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, display_name, photo_url, is_admin, is_active, refresh_token')
      .eq('id', payload.id)
      .single()

    if (error || !user || !user.is_active) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    // Reuse detection: if the submitted RT doesn't match the one on file,
    // null out the stored RT (forces re-login everywhere) and reject.
    if (!user.refresh_token || user.refresh_token !== refreshToken) {
      await supabaseAdmin
        .from('users')
        .update({ refresh_token: null })
        .eq('id', user.id)

      return NextResponse.json(
        { error: 'Refresh token reuse detected. Please log in again.' },
        { status: 401 }
      )
    }

    // Rotate: issue a new pair and persist the new RT before returning.
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin
    })

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ refresh_token: newRefreshToken })
      .eq('id', user.id)

    if (updateError) {
      console.error('Refresh token rotation failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to rotate refresh token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tokens refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        photoURL: user.photo_url,
        isAdmin: user.is_admin
      },
      accessToken,
      refreshToken: newRefreshToken
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
