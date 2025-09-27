import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Topic from '@/models/Topic'
import User from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    await connectDB()
    
    const { categoryId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get category
    const category = await Category.findById(categoryId).lean()
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get topics for this category with pagination
    const [topics, total] = await Promise.all([
      Topic.find({ 
        categoryId: categoryId,
        isActive: true 
      })
        .sort({ isPinned: -1, lastPostAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Topic.countDocuments({ 
        categoryId: categoryId,
        isActive: true 
      })
    ])

    // Get user info for each topic
    const formattedTopics = await Promise.all(
      topics.map(async (topic) => {
        const user = await User.findById(topic.userId).select('photoURL').lean()
        
        return {
          id: topic._id.toString(),
          title: topic.title,
          content: topic.content,
          user_name: topic.userName,
          user_email: topic.userEmail,
          user_id: topic.userId,
          user_photo_url: user?.photoURL,
          category_id: topic.categoryId,
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
      category: {
        id: category._id.toString(),
        name: category.name,
        description: category.description,
        slug: category.slug
      },
      topics: formattedTopics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Category fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
