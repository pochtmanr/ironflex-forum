import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword, generateTokens } from '@/lib/auth'
import { generateSecureToken, sendEmailVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Generate username from email (take part before @)
    let username = email.split('@')[0]

    // Make username unique if it already exists
    let counter = 1
    const originalUsername = username
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .single()
      if (!existing) break
      username = `${originalUsername}${counter}`
      counter++
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать не менее 6ти символов' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user
    const passwordHash = await hashPassword(password)

    // Check if this is the first user in the database
    const { count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    const isFirstUser = (count ?? 0) === 0

    const { data: user, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        username,
        password_hash: passwordHash,
        display_name: displayName || username,
        is_active: true,
        is_admin: isFirstUser,
        is_verified: isFirstUser
      })
      .select()
      .single()

    if (insertError || !user) {
      console.error('User creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate tokens
    try {
      const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.is_admin
      })

      // Send verification email (only if not first user)
      let emailSent = false
      if (!isFirstUser) {
        const verificationToken = generateSecureToken()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

        await supabaseAdmin
          .from('reset_tokens')
          .insert({
            user_id: user.id,
            token: verificationToken,
            type: 'email_verification',
            expires_at: expiresAt
          })

        try {
          emailSent = await sendEmailVerificationEmail(
            user.email,
            user.username,
            verificationToken
          )
        } catch (emailError) {
          console.error('[REGISTER] Email sending error:', emailError)
        }
      }

      const response = {
        message: isFirstUser
          ? 'Добро пожаловать! Вы первый пользователь и получили права администратора.'
          : emailSent
            ? 'User created successfully. Please check your email to verify your account.'
            : 'User created successfully. Email verification will be sent shortly.',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.display_name,
          photoURL: user.photo_url,
          isAdmin: user.is_admin,
          isVerified: user.is_verified
        },
        accessToken,
        refreshToken,
        emailSent: emailSent || isFirstUser,
        isFirstUser: isFirstUser
      }

      return NextResponse.json(response)
    } catch (tokenError) {
      console.error('Token generation error:', tokenError)
      // Delete the user if token generation fails
      await supabaseAdmin.from('users').delete().eq('id', user.id)
      throw tokenError
    }

  } catch (error) {
    console.error('Registration error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}
