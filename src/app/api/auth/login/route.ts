import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyPassword, generateTokens } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called')
    await connectDB()
    console.log('MongoDB connected for login')
    
    const { emailOrUsername, password } = await request.json()
    console.log('Login data received:', { emailOrUsername, passwordLength: password?.length })

    // Validation
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    // Find user by email or username
    console.log('Looking for user...')
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ],
      isActive: true
    })
    console.log('User found:', !!user)

    if (!user) {
      console.log('User not found, returning 401')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    console.log('Verifying password...')
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    console.log('Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('Invalid password, returning 401')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    console.log('Updating last login...')
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
    console.log('Last login updated')

    // Generate tokens
    console.log('Generating tokens...')
    const { accessToken, refreshToken } = generateTokens({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin
    })
    console.log('Tokens generated successfully')

    const response = {
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: user.isAdmin
      },
      accessToken,
      refreshToken
    }
    
    console.log('Returning successful login response')
    return NextResponse.json(response)

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
