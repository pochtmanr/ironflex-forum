import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Topic from '@/models/Topic';
import Post from '@/models/Post';
import User from '@/models/User';
import Category from '@/models/Category';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    await connectDB();

    // Find the topic
    const topic = await Topic.findById(topicId)
      .populate('user_id', 'username email displayName')
      .lean();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    console.log('Raw topic data:', {
      id: topic._id,
      title: topic.title,
      mediaLinks: topic.mediaLinks,
      hasMediaLinks: !!topic.mediaLinks,
      mediaLinksLength: topic.mediaLinks?.length || 0
    });

    // Get posts for this topic
    const posts = await Post.find({ topicId: topicId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total posts count for pagination
    const totalPosts = await Post.countDocuments({ topicId: topicId });
    const totalPages = Math.ceil(totalPosts / limit);

    // Get category information
    const category = await Category.findById(topic.categoryId).lean();

    // Increment view count
    await Topic.findByIdAndUpdate(topicId, { $inc: { views: 1 } });

    // Format the response
    const formattedTopic = {
      id: topic._id,
      title: topic.title,
      content: topic.content,
      user_name: topic.userName || 'Unknown',
      user_email: topic.userEmail || '',
      user_id: topic.userId || '',
      category_id: topic.categoryId,
      category_name: category?.name || 'Unknown Category',
      reply_count: topic.replyCount || 0,
      views: topic.views + 1, // Include the increment
      likes: topic.likes || 0,
      dislikes: topic.dislikes || 0,
      created_at: topic.createdAt,
      last_post_at: topic.lastPostAt || topic.createdAt,
      is_pinned: topic.isPinned || false,
      is_locked: topic.isLocked || false,
      media_links: topic.mediaLinks || [],
      is_author: false // Will be set based on auth if needed
    };

    const formattedPosts = posts.map(post => {
      console.log('Post data:', { 
        id: post._id, 
        mediaLinks: post.mediaLinks,
        hasMediaLinks: !!post.mediaLinks,
        mediaLinksLength: post.mediaLinks?.length || 0
      });
      
      return {
        id: post._id,
        content: post.content,
        user_name: post.userName || 'Unknown',
        user_email: post.userEmail || '',
        user_id: post.userId || '',
        created_at: post.createdAt,
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        media_links: post.mediaLinks || [],
        is_author: false // Will be set based on auth if needed
      };
    });

    return NextResponse.json({
      topic: formattedTopic,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const body = await request.json();
    const { content, mediaLinks } = body;
    console.log('Received post creation request:', { content, mediaLinks });

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
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

    // Get user information
    const user = await User.findById(userPayload.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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
      userId: userPayload.id,
      userName: user.username,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

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

    // Get user information
    const user = await User.findById(userPayload.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the topic
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if user is the author of the topic
    if (topic.userId !== userPayload.id) {
      return NextResponse.json(
        { error: 'You can only delete your own topics' },
        { status: 403 }
      );
    }

    // Delete all posts in this topic
    await Post.deleteMany({ topicId: topicId });

    // Delete the topic
    await Topic.findByIdAndDelete(topicId);

    // Update category stats (decrement topic count)
    await Category.findByIdAndUpdate(topic.categoryId, {
      $inc: { topicCount: -1 }
    });

    return NextResponse.json({
      message: 'Topic deleted successfully'
    });

  } catch (error) {
    console.error('Topic deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
