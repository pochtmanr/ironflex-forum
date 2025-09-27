import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Post from '@/models/Post';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const body = await request.json();
    const { likeType } = body;

    if (!likeType || !['like', 'dislike'].includes(likeType)) {
      return NextResponse.json(
        { error: 'Invalid like type. Must be "like" or "dislike"' },
        { status: 400 }
      );
    }

    // Verify authentication
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

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Update like/dislike count
    const updateField = likeType === 'like' ? 'likes' : 'dislikes';
    await Post.findByIdAndUpdate(postId, {
      $inc: { [updateField]: 1 }
    });

    return NextResponse.json({
      message: `${likeType} added successfully`,
      likeType
    });

  } catch (error) {
    console.error('Error updating post like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
