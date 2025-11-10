import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Post from '@/models/Post';
import Topic from '@/models/Topic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    
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

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the post author
    const isPostAuthor = post.userId === userPayload.id;

    if (!isPostAuthor) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Check 2-hour time limit
    const createdAt = new Date(post.createdAt);
    const now = new Date();
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const timeSinceCreation = now.getTime() - createdAt.getTime();

    if (timeSinceCreation > twoHoursInMs) {
      return NextResponse.json(
        { error: 'Posts can only be deleted within 2 hours of creation' },
        { status: 403 }
      );
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Update topic reply count
    await Topic.findByIdAndUpdate(post.topicId, {
      $inc: { replyCount: -1 }
    });

    return NextResponse.json({
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { content } = await request.json();
    
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

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify ownership - only the author can edit
    if (post.userId !== userPayload.id) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    // Check if post is within 2-hour edit window
    const createdAt = new Date(post.createdAt);
    const now = new Date();
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const timeSinceCreation = now.getTime() - createdAt.getTime();

    if (timeSinceCreation > twoHoursInMs) {
      return NextResponse.json(
        { error: 'Posts can only be edited within 2 hours of creation' },
        { status: 403 }
      );
    }

    // Update the post
    await Post.findByIdAndUpdate(postId, {
      content: content.trim(),
      isEdited: true,
      editedAt: new Date()
    });

    return NextResponse.json({
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}
