import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Topic from '@/models/Topic';

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

    // Get all topics with category information
    const topics = await Topic.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
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
          categoryId: 1,
          userId: 1,
          userName: 1,
          userEmail: 1,
          title: 1,
          content: 1,
          mediaLinks: 1,
          views: 1,
          likes: 1,
          dislikes: 1,
          isPinned: 1,
          isLocked: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          lastPostAt: 1,
          replyCount: 1,
          categoryName: '$category.name'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return NextResponse.json({
      message: 'Topics retrieved successfully',
      topics: topics.map(topic => ({
        id: topic._id,
        categoryId: topic.categoryId,
        userId: topic.userId,
        userName: topic.userName,
        userEmail: topic.userEmail,
        title: topic.title,
        content: topic.content,
        mediaLinks: topic.mediaLinks,
        views: topic.views,
        likes: topic.likes,
        dislikes: topic.dislikes,
        isPinned: topic.isPinned,
        isLocked: topic.isLocked,
        isActive: topic.isActive,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        lastPostAt: topic.lastPostAt,
        replyCount: topic.replyCount,
        categoryName: topic.categoryName
      }))
    });

  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
