import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
  try {
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

    // Get all posts with topic and category information
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $unwind: {
          path: '$topic',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'topic.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          topicId: 1,
          userId: 1,
          userName: 1,
          userEmail: 1,
          content: 1,
          mediaLinks: 1,
          likes: 1,
          dislikes: 1,
          isEdited: 1,
          editedAt: 1,
          isActive: 1,
          parentPostId: 1,
          createdAt: 1,
          updatedAt: 1,
          topicTitle: '$topic.title',
          categoryName: '$category.name'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return NextResponse.json({
      message: 'Posts retrieved successfully',
      posts: posts.map(post => ({
        id: post._id,
        topicId: post.topicId,
        userId: post.userId,
        userName: post.userName,
        userEmail: post.userEmail,
        content: post.content,
        mediaLinks: post.mediaLinks,
        likes: post.likes,
        dislikes: post.dislikes,
        isEdited: post.isEdited,
        editedAt: post.editedAt,
        isActive: post.isActive,
        parentPostId: post.parentPostId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        topicTitle: post.topicTitle,
        categoryName: post.categoryName
      }))
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
