import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Topic from '@/models/Topic'
import User from '@/models/User'
import Category from '@/models/Category'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    const period = searchParams.get('period') || 'all'
    

    // Calculate date filter based on period
    let dateFilter = {}
    if (period === 'day') {
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      dateFilter = { createdAt: { $gte: oneDayAgo } }
    } else if (period === 'week') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      dateFilter = { createdAt: { $gte: oneWeekAgo } }
    }

    // Get top topics sorted by views and likes
    const topics = await Topic.find({ 
      isActive: true,
      ...dateFilter
    })
      .sort({ views: -1, likes: -1 })
      .limit(limit)
      .select('title views likes replyCount userName userId categoryId createdAt categoryName')
      .lean()


    // Get user and category info for each topic
    const formattedTopics = await Promise.all(
      topics.map(async (topic: any) => {
        const [user, category] = await Promise.all([
          User.findById(topic.userId).select('photoURL').lean(),
          Category.findById(topic.categoryId).select('name slug').lean()
        ]) as [{ photoURL?: string } | null, { name: string; slug: string } | null]

        return {
          id: String(topic._id),
          title: topic.title,
          views: topic.views || 0,
          reply_count: topic.replyCount || 0,
          user_name: topic.userName,
          user_id: topic.userId,
          category_name: category?.name || topic.categoryName || 'Forum',
          category_id: topic.categoryId || '',
          user_photo_url: user?.photoURL || null
        }
      })
    )

    return NextResponse.json({
      topics: formattedTopics
    })
  } catch (error) {
    console.error('Ошибка при загрузке популярных тем:', error)
    return NextResponse.json(
      { error: 'Не удалось загрузить популярные темы' },
      { status: 500 }
    )
  }
}
