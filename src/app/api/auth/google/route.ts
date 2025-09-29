import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { credential } = await request.json();
    
    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential is required' },
        { status: 400 }
      );
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 400 }
      );
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not provided by Google' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Google info if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.photoURL = picture;
        if (name && !user.displayName) {
          user.displayName = name;
        }
        await user.save();
      }
    } else {
      // Create new user
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
      
      user = new User({
        email,
        username,
        displayName: name || email.split('@')[0],
        photoURL: picture,
        googleId,
        isVerified: true, // Google accounts are pre-verified
        isAdmin: false
      });

      await user.save();
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Update user with refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return NextResponse.json({
      message: 'Google login successful',
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
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Google authentication failed' },
      { status: 500 }
    );
  }
}
