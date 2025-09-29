import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Topic from '@/models/Topic';
import Post from '@/models/Post';
import User from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const body = await request.json();
    const { content, mediaLinks, userData } = body;
    console.log('Received post creation request:', { content, mediaLinks, userData });

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get or create user based on userData (like topics)
    let user;
    if (userData && userData.email) {
      user = await User.findOne({ email: userData.email }).select('-passwordHash');
      if (!user) {
        const username = userData.email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
        user = await User.create({
          email: userData.email,
          username,
          displayName: userData.displayName || userData.name || userData.email.split('@')[0],
          photoURL: userData.photoURL || userData.picture,
          googleId: userData.id,
          isVerified: true,
          isAdmin: false,
          isActive: true
        });
        console.log('Created new user for post:', user._id);
      }
    } else {
      return NextResponse.json(
        { error: 'User data required' },
        { status: 401 }
      );
    }

    // Verify topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if topic is locked
    if (topic.is_locked) {
      return NextResponse.json(
        { error: 'Topic is locked' },
        { status: 403 }
      );
    }

    // Create new post
    const post = new Post({
      topicId: topicId,
      userId: user._id.toString(),
      userName: user.displayName || user.username,
      userEmail: user.email,
      content: content.trim(),
      mediaLinks: mediaLinks || []
    });

    await post.save();

    // Update topic's last_post_at and increment reply_count
    await Topic.findByIdAndUpdate(topicId, {
      last_post_at: new Date(),
      $inc: { reply_count: 1 }
    });

    // Get the created post
    const createdPost = await Post.findById(post._id).lean();

    const formattedPost = {
      id: createdPost._id,
      content: createdPost.content,
      user_name: createdPost.userName || 'Unknown',
      user_email: createdPost.userEmail || '',
      user_id: createdPost.userId || '',
      created_at: createdPost.createdAt,
      likes: createdPost.likes || 0,
      dislikes: createdPost.dislikes || 0,
      media_links: createdPost.mediaLinks || [],
      is_author: true
    };

    return NextResponse.json({
      message: 'Post created successfully',
      post: formattedPost
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
