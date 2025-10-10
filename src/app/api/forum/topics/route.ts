import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Topic from '@/models/Topic'
import Category from '@/models/Category'
import User from '@/models/User'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: Record<string, unknown> = { isActive: true }
    if (categoryId) {
      where.categoryId = categoryId
    }

    const [topics, total] = await Promise.all([
      Topic.find(where)
        .sort({ isPinned: -1, lastPostAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Topic.countDocuments(where)
    ])

    // Get user and category info for each topic
    const formattedTopics = await Promise.all(
      topics.map(async (topic) => {
        const [user, category] = await Promise.all([
          User.findById(topic.userId).select('photoURL').lean(),
          Category.findById(topic.categoryId).select('name slug').lean()
        ]) as [{ photoURL?: string } | null, { name: string; slug: string } | null]

        return {
          id: String(topic._id),
          title: topic.title,
          content: topic.content,
          user_name: topic.userName,
          user_email: topic.userEmail,
          user_id: topic.userId,
          user_photo_url: user?.photoURL || null,
          category_id: topic.categoryId,
          category_name: category?.name || 'Unknown Category',
          category_slug: category?.slug || topic.categoryId,
          reply_count: topic.replyCount,
          views: topic.views,
          likes: topic.likes,
          dislikes: topic.dislikes,
          created_at: topic.createdAt.toISOString(),
          last_post_at: topic.lastPostAt.toISOString(),
          is_pinned: topic.isPinned,
          is_locked: topic.isLocked,
          media_links: topic.mediaLinks?.join('\n') || ''
        }
      })
    )

    return NextResponse.json({
      topics: formattedTopics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Topics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get user data from request body (like React app approach)
    const body = await request.json()
    const { categoryId, title, content, mediaLinks, userData } = body
    
    console.log('Received topic creation request:', { categoryId, title, content, mediaLinks, userData })

    // Validation
    if (!categoryId || !title || !content) {
      return NextResponse.json(
        { error: 'Category ID, title, and content are required' },
        { status: 400 }
      )
    }

    // For now, let's use userData from the request or create a simple user
    let user;
    if (userData && userData.email) {
      // Find or create user based on userData
      user = await User.findOne({ email: userData.email }).select('-passwordHash')
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
        console.log('Created new user:', user._id);
      }
    } else {
      return NextResponse.json(
        { error: 'User data required' },
        { status: 401 }
      )
    }


    // Verify category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Create topic
    const topic = await Topic.create({
      categoryId,
      userId: user._id.toString(),
      userName: user.displayName || user.username,
      userEmail: user.email,
      title,
      content,
      mediaLinks: mediaLinks || []
    })

    return NextResponse.json({
      message: 'Topic created successfully',
      topic: {
        id: topic._id.toString(),
        title: topic.title,
        content: topic.content,
        user_name: topic.userName,
        user_email: topic.userEmail,
        user_id: topic.userId,
        user_photo_url: user.photoURL,
        category_id: topic.categoryId,
        category_name: category.name,
        category_slug: category.slug,
        reply_count: topic.replyCount,
        views: topic.views,
        likes: topic.likes,
        dislikes: topic.dislikes,
        created_at: topic.createdAt.toISOString(),
        last_post_at: topic.lastPostAt.toISOString(),
        is_pinned: topic.isPinned,
        is_locked: topic.isLocked,
        media_links: topic.mediaLinks?.join('\n') || ''
      }
    })

  } catch (error) {
    console.error('Topic creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
