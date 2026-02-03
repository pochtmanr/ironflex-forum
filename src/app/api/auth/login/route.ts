import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, generateTokens } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { emailOrUsername, password } = await request.json() as { emailOrUsername: string; password: string }

    // Validation
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    const searchValue = emailOrUsername.toLowerCase()

    // Find user by email or username
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true)
      .or(`email.eq.${searchValue},username.eq.${searchValue}`)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin
    })

    const response = {
      message: 'Login successful',
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
