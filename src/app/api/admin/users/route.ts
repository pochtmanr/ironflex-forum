import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication (no admin check - any user can access)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userPayload = verifyAccessToken(token);
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all users (excluding password hash)
    const users = await User.find({}, {
      passwordHash: 0,
      refreshToken: 0
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      message: 'Users retrieved successfully',
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        googleId: user.googleId,
        githubId: user.githubId
      }))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
