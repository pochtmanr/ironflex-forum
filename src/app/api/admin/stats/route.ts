import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Topic from '@/models/Topic';
import Post from '@/models/Post';
import Article from '@/models/Article';
import Training from '@/models/Training';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userData = await verifyToken(token);
    
    if (!userData || !userData.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await User.findById(userData.userId);
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch stats
    const [usersCount, topicsCount, postsCount, articlesCount, trainingsCount] = await Promise.all([
      User.countDocuments(),
      Topic.countDocuments(),
      Post.countDocuments(),
      Article.countDocuments(),
      Training.countDocuments()
    ]);

    return NextResponse.json({
      users: usersCount,
      topics: topicsCount,
      posts: postsCount,
      articles: articlesCount,
      trainings: trainingsCount
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

