import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Topic from '@/models/Topic'
import Post from '@/models/Post'
import User from '@/models/User'

export async function GET() {
  try {
    await connectDB()

    const [totalTopics, totalPosts, totalUsers] = await Promise.all([
      Topic.countDocuments({ isActive: true }),
      Post.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true })
    ])

    // Get latest user
    const latestUser = await User.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .select('username')

    return NextResponse.json({
      stats: {
        total_topics: totalTopics,
        total_posts: totalPosts,
        total_users: totalUsers,
        latest_username: latestUser?.username || null
      }
      // Removed onlineUsers - real-time online tracking is complex and not implemented
    })
  } catch (error) {
    console.error('Error fetching forum stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forum stats' },
      { status: 500 }
    )
  }
}
