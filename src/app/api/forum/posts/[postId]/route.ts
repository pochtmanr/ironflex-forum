import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Post from '@/models/Post';
import Topic from '@/models/Topic';
import User from '@/models/User';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const userPayload = verifyAccessToken(token);
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectDB();

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the topic to check if user is topic author
    const topic = await Topic.findById(post.topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user is the post author OR the topic author
    const isPostAuthor = post.userId === userPayload.id;
    const isTopicAuthor = topic.userId === userPayload.id;

    console.log('Delete post authorization check:', {
      postId,
      postUserId: post.userId,
      topicUserId: topic.userId,
      requestUserId: userPayload.id,
      isPostAuthor,
      isTopicAuthor
    });

    if (!isPostAuthor && !isTopicAuthor) {
      return NextResponse.json(
        { error: 'You can only delete your own posts or posts in your topics' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Update topic reply count
    await Topic.findByIdAndUpdate(post.topicId, {
      $inc: { replyCount: -1 }
    });

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

