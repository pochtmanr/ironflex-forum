import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Topic from '@/models/Topic';
import Post from '@/models/Post';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    
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

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Verify ownership - only the author can delete
    if (topic.userId !== userPayload.id) {
      return NextResponse.json(
        { error: 'You can only delete your own topics' },
        { status: 403 }
      );
    }

    // Check if topic is within 2-hour edit window
    const createdAt = new Date(topic.createdAt);
    const now = new Date();
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const timeSinceCreation = now.getTime() - createdAt.getTime();

    if (timeSinceCreation > twoHoursInMs) {
      return NextResponse.json(
        { error: 'Topics can only be deleted within 2 hours of creation' },
        { status: 403 }
      );
    }

    // Delete all posts in this topic
    await Post.deleteMany({ topicId: topicId });

    // Delete the topic
    await Topic.findByIdAndDelete(topicId);

    return NextResponse.json({
      message: 'Topic and all its posts deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const { title, content } = await request.json();
    
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

    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Verify ownership - only the author can edit
    if (topic.userId !== userPayload.id) {
      return NextResponse.json(
        { error: 'You can only edit your own topics' },
        { status: 403 }
      );
    }

    // Check if topic is within 2-hour edit window
    const createdAt = new Date(topic.createdAt);
    const now = new Date();
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const timeSinceCreation = now.getTime() - createdAt.getTime();

    if (timeSinceCreation > twoHoursInMs) {
      return NextResponse.json(
        { error: 'Topics can only be edited within 2 hours of creation' },
        { status: 403 }
      );
    }

    // Update the topic
    await Topic.findByIdAndUpdate(topicId, {
      title: title.trim(),
      content: content.trim()
    });

    return NextResponse.json({
      message: 'Topic updated successfully'
    });

  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}
