import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Topic from '@/models/Topic';
import Post from '@/models/Post';
import jwt from 'jsonwebtoken';

// Verify JWT token
interface TokenPayload {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

function verifyToken(request: NextRequest): TokenPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Invalid auth header format');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('Token length:', token.length);
    console.log('JWT_SECRET defined:', !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload; 
    console.log('Token decoded successfully:', { id: decoded.id, username: decoded.username });
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    await connectDB();

    // Find user by ID
    const user = await User.findById(userId).select('-passwordHash -refreshToken');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's topic count
    const topicCount = await Topic.countDocuments({ 
      userId: userId, 
      isActive: true 
    });

    // Get user's post count
    const postCount = await Post.countDocuments({ 
      userId: userId, 
      isActive: true 
    });

    // Get user's recent topics
    const recentTopics = await Topic.find({ 
      userId: userId, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title createdAt views replyCount categoryId')
    .lean();

    // Get user's recent posts
    const recentPosts = await Post.find({ 
      userId: userId, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('content createdAt topicId')
    .lean();

    // Format the response with all available user data
    const userProfile = {
      id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      photoURL: user.photoURL,
      bio: user.bio,
      city: user.city,
      country: user.country,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      googleId: user.googleId,
      githubId: user.githubId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      topicCount,
      postCount,
      recentTopics: recentTopics.map(topic => ({
        id: topic._id,
        title: topic.title,
        createdAt: topic.createdAt,
        views: topic.views || 0,
        replyCount: topic.replyCount || 0,
        categoryId: topic.categoryId
      })),
      recentPosts: recentPosts.map(post => ({
        id: post._id,
        content: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
        createdAt: post.createdAt,
        topicId: post.topicId
      }))
    };

    return NextResponse.json({
      message: 'User profile retrieved successfully',
      user: userProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Verify authentication
    const tokenData = verifyToken(request);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is updating their own profile or is an admin
    if (tokenData.id !== userId) {
      // Optional: Check if user is admin
      await connectDB();
      const requestingUser = await User.findById(tokenData.id);
      if (!requestingUser?.isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update your own profile' },
          { status: 403 }
        );
      }
    }

    await connectDB();

    // Get the request body
    const body = await request.json();
    const { username, displayName, bio, city, country, photoURL } = body;

    // Validate input
    const updateData: Record<string, string | null> = {};
    
    if (username !== undefined && username !== null) {
      const trimmedUsername = username.trim();
      
      // Validate username length
      if (trimmedUsername.length < 3) {
        return NextResponse.json(
          { error: 'Username must be at least 3 characters long' },
          { status: 400 }
        );
      }
      
      if (trimmedUsername.length > 30) {
        return NextResponse.json(
          { error: 'Username must be less than 30 characters' },
          { status: 400 }
        );
      }
      
      // Validate username format (alphanumeric, underscores, hyphens only)
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
          { status: 400 }
        );
      }
      
      // Check if username is already taken by another user (case-insensitive)
      const existingUser = await User.findOne({ 
        username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') },
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
      
      updateData.username = trimmedUsername;
    }

    if (displayName !== undefined) {
      const trimmedDisplayName = displayName ? displayName.trim() : '';
      if (trimmedDisplayName.length > 50) {
        return NextResponse.json(
          { error: 'Display name must be less than 50 characters' },
          { status: 400 }
        );
      }
      updateData.displayName = trimmedDisplayName || null;
    }

    if (bio !== undefined) {
      const trimmedBio = bio ? bio.trim() : '';
      if (trimmedBio.length > 500) {
        return NextResponse.json(
          { error: 'Bio must be less than 500 characters' },
          { status: 400 }
        );
      }
      updateData.bio = trimmedBio || null;
    }

    if (city !== undefined) {
      const trimmedCity = city ? city.trim() : '';
      if (trimmedCity.length > 100) {
        return NextResponse.json(
          { error: 'City name must be less than 100 characters' },
          { status: 400 }
        );
      }
      updateData.city = trimmedCity || null;
    }

    if (country !== undefined) {
      const trimmedCountry = country ? country.trim() : '';
      if (trimmedCountry.length > 100) {
        return NextResponse.json(
          { error: 'Country name must be less than 100 characters' },
          { status: 400 }
        );
      }
      updateData.country = trimmedCountry || null;
    }

    if (photoURL !== undefined) {
      updateData.photoURL = photoURL ? photoURL.trim() : null;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash -refreshToken');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
        bio: updatedUser.bio,
        city: updatedUser.city,
        country: updatedUser.country,
        isActive: updatedUser.isActive,
        isAdmin: updatedUser.isAdmin,
        isVerified: updatedUser.isVerified,
        googleId: updatedUser.googleId,
        githubId: updatedUser.githubId,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        lastLogin: updatedUser.lastLogin
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
