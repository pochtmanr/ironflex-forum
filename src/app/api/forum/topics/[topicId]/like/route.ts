import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Topic from '@/models/Topic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
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

    // Verify topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Update like/dislike count
    const updateField = likeType === 'like' ? 'likes' : 'dislikes';
    await Topic.findByIdAndUpdate(topicId, {
      $inc: { [updateField]: 1 }
    });

    return NextResponse.json({
      message: `${likeType} added successfully`,
      likeType
    });

  } catch (error) {
    console.error('Error updating topic like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
