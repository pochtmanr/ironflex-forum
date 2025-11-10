import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Post from '@/models/Post';
import Topic from '@/models/Topic';
import User from '@/models/User';
import FlaggedPost from '@/models/FlaggedPost';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { reason, topicId, topicTitle } = await request.json();

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

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get current user information
    const currentUser = await User.findById(userPayload.id).select('username displayName').lean() as { username: string; displayName: string } | null;
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if post exists
    const post = await Post.findById(postId).lean() as { _id: unknown; userId: string; content: string; topicId: string } | null;
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get post author information
    const postAuthor = await User.findById(post.userId).select('username displayName').lean() as { username: string; displayName: string } | null;
    if (!postAuthor) {
      return NextResponse.json(
        { error: 'Post author not found' },
        { status: 404 }
      );
    }

    // Verify that the user is the topic author
    const topic = await Topic.findById(topicId || post.topicId).lean() as { userId: string } | null;
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    if (topic.userId !== userPayload.id) {
      return NextResponse.json(
        { error: 'Only topic authors can flag posts' },
        { status: 403 }
      );
    }

    // Check if this post has already been flagged by this user
    const existingFlag = await FlaggedPost.findOne({
      postId: postId,
      flaggedBy: userPayload.id,
      status: 'pending'
    });

    if (existingFlag) {
      return NextResponse.json(
        { error: 'You have already flagged this post' },
        { status: 400 }
      );
    }

    // Create flagged post record
    const flaggedPost = new FlaggedPost({
      postId: postId,
      topicId: topicId || post.topicId,
      topicTitle: topicTitle || 'Unknown',
      postContent: post.content,
      postAuthorId: post.userId,
      postAuthorName: postAuthor.displayName || postAuthor.username,
      flaggedBy: userPayload.id,
      flaggedByName: currentUser.displayName || currentUser.username,
      reason: reason.trim(),
      status: 'pending'
    });

    await flaggedPost.save();

    return NextResponse.json({
      message: 'Post flagged successfully'
    });

  } catch (error) {
    console.error('Error flagging post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

