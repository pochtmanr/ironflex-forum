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
    const incrementView = searchParams.get('incrementView') !== 'false';

    // Get current user if authenticated
    let currentUserId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userPayload = verifyAccessToken(token);
      if (userPayload) {
        currentUserId = userPayload.id;
      }
    }

    await connectDB();

    // Find the topic
    const topic = await Topic.findById(topicId).lean() as { _id: unknown; title: string; mediaLinks: string[]; userId: string; content: string; replyCount: number; views: number; likes: number; dislikes: number; likedBy?: string[]; dislikedBy?: string[]; createdAt: Date; lastPostAt: Date; isPinned: boolean; isLocked: boolean; categoryId: string } | null;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get current user information for the topic author
    const topicAuthor = await User.findById(topic.userId).select('username displayName email photoURL').lean() as { username: string; displayName: string; email: string; photoURL?: string } | null;
    if (!topicAuthor) {
      return NextResponse.json(
        { error: 'Topic author not found' },
        { status: 404 }
      );
    }
    console.log('Raw topic data:', {
      id: String(topic._id),
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

    // Get unique user IDs from posts to fetch current usernames
    const postUserIds = [...new Set(posts.map(post => String(post.userId)))];
    const postAuthors = await User.find({ _id: { $in: postUserIds } })
      .select('_id username displayName email photoURL')
      .lean();
    
    // Create a map of userId to user data for quick lookup
    const userMap = new Map(postAuthors.map(user => [String(user._id), user]));

    // Get total posts count for pagination
    const totalPosts = await Post.countDocuments({ topicId: topicId });
    const totalPages = Math.ceil(totalPosts / limit);

    // Get category information
    const category = await Category.findById(topic.categoryId).lean() as { name: string } | null;
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Increment view count only on page 1 and when incrementView is true
    if (page === 1 && incrementView) {
    await Topic.findByIdAndUpdate(topicId, { $inc: { views: 1 } });
    }

    // Determine user's vote on this topic
    let userVote: 'like' | 'dislike' | null = null;
    if (currentUserId) {
      if (topic.likedBy && topic.likedBy.includes(currentUserId)) {
        userVote = 'like';
      } else if (topic.dislikedBy && topic.dislikedBy.includes(currentUserId)) {
        userVote = 'dislike';
      }
    }

    // Format the response with current user data
    const formattedTopic = {
      id: String(topic._id),
      title: topic.title,
      content: topic.content,
      user_name: topicAuthor?.displayName || topicAuthor?.username || 'Unknown',
      user_email: topicAuthor?.email || '',
      user_id: String(topic.userId) || '', // Ensure it's always a string
      user_photo: topicAuthor?.photoURL || null,
      category_id: topic.categoryId,
      category_name: category?.name || 'Unknown Category',
      reply_count: topic.replyCount || 0,
      views: topic.views + 1, // Include the increment
      likes: topic.likes || 0,
      dislikes: topic.dislikes || 0,
      user_vote: userVote, // Add user's current vote
      created_at: topic.createdAt?.toISOString() || new Date().toISOString(),
      last_post_at: topic.lastPostAt?.toISOString() || new Date().toISOString(),
      is_pinned: topic.isPinned || false,
      is_locked: topic.isLocked || false,
      media_links: topic.mediaLinks || [],
      is_author: currentUserId ? String(topic.userId) === String(currentUserId) : false
    };

    const formattedPosts = posts.map((post: any) => {
      console.log('Post data:', { 
        id: post._id, 
        mediaLinks: post.mediaLinks,
        hasMediaLinks: !!post.mediaLinks,
        mediaLinksLength: post.mediaLinks?.length || 0
      });
      
      // Get current user data for this post
      const postUser = userMap.get(String(post.userId));
      
      // Determine user's vote on this post
      let postUserVote: 'like' | 'dislike' | null = null;
      if (currentUserId) {
        if (post.likedBy && post.likedBy.includes(currentUserId)) {
          postUserVote = 'like';
        } else if (post.dislikedBy && post.dislikedBy.includes(currentUserId)) {
          postUserVote = 'dislike';
        }
      }
      
      return {
        id: String(post._id),
        content: post.content,
        user_name: postUser?.displayName || postUser?.username || 'Unknown',
        user_email: postUser?.email || '',
        user_id: String(post.userId) || '', // Ensure it's always a string
        user_photo: postUser?.photoURL || null,
        created_at: post.createdAt,
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        user_vote: postUserVote, // Add user's current vote
        media_links: post.mediaLinks || [],
        is_author: currentUserId ? String(post.userId) === String(currentUserId) : false
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
    const user = await User.findById(userPayload.id) as { _id: unknown; username: string; email: string } | null;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify topic exists
    const topic = await Topic.findById(topicId) as { _id: unknown; is_locked: boolean; userId: string } | null;
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
    const createdPost = await Post.findById(post._id).lean() as { _id: unknown; content: string; userName: string; userEmail: string; userId: string; createdAt: Date; likes: number; dislikes: number; mediaLinks: string[] } | null;
    if (!createdPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const formattedPost = {
      id: String(createdPost._id),
      content: createdPost.content,
      user_name: createdPost.userName || 'Unknown',
      user_email: createdPost.userEmail || '',
      user_id: createdPost.userId || '',
      created_at: createdPost.createdAt?.toISOString() || new Date().toISOString(),
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
