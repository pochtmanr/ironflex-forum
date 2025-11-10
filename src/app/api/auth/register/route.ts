import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ResetToken from '@/models/ResetToken'
import { hashPassword, generateTokens } from '@/lib/auth'
import { generateSecureToken, sendEmailVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    console.log('Registration API called')
    await connectDB()
    console.log('MongoDB connected for registration')
    
    const { email, password, displayName } = await request.json()
    console.log('Registration data received:', { email, displayName, passwordLength: password?.length })

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
    while (await User.findOne({ username })) {
      username = `${originalUsername}${counter}`
      counter++
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать не менее 8 символов' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать хотя бы одну заглавную букву (A-Z)' },
        { status: 400 }
      )
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать хотя бы одну строчную букву (a-z)' },
        { status: 400 }
      )
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать хотя бы одну цифру (0-9)' },
        { status: 400 }
      )
    }

    // Check if user already exists
    console.log('Checking if user exists...')
    const existingUser = await User.findOne({
      email
    })
    console.log('User exists check result:', !!existingUser)

    if (existingUser) {
      console.log('User already exists, returning 409')
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user
    console.log('Creating new user...')
    const passwordHash = await hashPassword(password)
    console.log('Password hashed successfully')
    
    // Check if this is the first user in the database
    const userCount = await User.countDocuments()
    const isFirstUser = userCount === 0
    
    if (isFirstUser) {
      console.log('This is the first user - will be granted admin privileges')
    }
    
    const user = await User.create({
      email,
      username,
      passwordHash,
      displayName: displayName || username,
      isActive: true,
      isAdmin: isFirstUser, // First user becomes admin automatically
      isVerified: isFirstUser // First user is auto-verified
    })
    console.log('User created successfully:', user._id, isFirstUser ? '(ADMIN)' : '')

    // Generate tokens
    console.log('Generating tokens...')
    try {
      const { accessToken, refreshToken } = generateTokens({
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin
      })
      console.log('Tokens generated successfully')

      // Send verification email (only if not first user, first user is auto-verified)
      let emailSent = false
      if (!isFirstUser) {
        // Generate email verification token
        const verificationToken = generateSecureToken()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Save verification token
        await ResetToken.create({
          userId: user._id.toString(),
          token: verificationToken,
          type: 'email_verification',
          expiresAt
        })

        // Send verification email
        console.log('[REGISTER] About to send verification email...')
        try {
          emailSent = await sendEmailVerificationEmail(
            user.email,
            user.username,
            verificationToken
          )
          console.log('[REGISTER] Email sent result:', emailSent)
        } catch (emailError) {
          console.error('[REGISTER] Email sending error:', emailError)
          // Don't fail registration if email fails
        }

        if (!emailSent) {
          console.error('Failed to send verification email, but user was created')
        }
      }

      const response = {
        message: isFirstUser 
          ? 'Добро пожаловать! Вы первый пользователь и получили права администратора.' 
          : emailSent 
            ? 'User created successfully. Please check your email to verify your account.'
            : 'User created successfully. Email verification will be sent shortly.',
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified
        },
        accessToken,
        refreshToken,
        emailSent: emailSent || isFirstUser,
        isFirstUser: isFirstUser
      }
      
      console.log('Returning successful response')
      return NextResponse.json(response)
    } catch (tokenError) {
      console.error('Token generation error:', tokenError)
      // Delete the user if token generation fails
      await User.deleteOne({ _id: user._id })
      console.log('User deleted due to token error')
      throw tokenError
    }

  } catch (error) {
    console.error('Registration error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    
    // Return more detailed error information in development
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
