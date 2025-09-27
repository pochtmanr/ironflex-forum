import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Topic from '@/models/Topic'
import User from '@/models/User'

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
      .populate('categoryId', 'name')
      .sort({ views: -1, likes: -1 })
      .limit(limit)
      .select('title views likes replyCount userName userId categoryId createdAt')

    // Format response
    const formattedTopics = topics.map(topic => ({
      id: topic._id,
      title: topic.title,
      views: topic.views || 0,
      reply_count: topic.replyCount || 0,
      user_name: topic.userName,
      user_id: topic.userId,
      category_name: topic.categoryId?.name || 'Unknown',
      category_id: topic.categoryId?._id || '',
      user_photo_url: null // We'll add this later if needed
    }))

    return NextResponse.json({
      topics: formattedTopics
    })
  } catch (error) {
    console.error('Error fetching top topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top topics' },
      { status: 500 }
    )
  }
}
