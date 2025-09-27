import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Topic from '@/models/Topic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const categories = await Category.find({ isActive: true })
      .sort({ orderIndex: 1 })
      .lean()

    // Get topic counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const topicCount = await Topic.countDocuments({ 
          categoryId: category._id.toString(),
          isActive: true 
        })
        
        const postCount = await Topic.aggregate([
          { $match: { categoryId: category._id.toString(), isActive: true } },
          { $group: { _id: null, total: { $sum: '$replyCount' } } }
        ])

        const lastTopic = await Topic.findOne({ 
          categoryId: category._id.toString(),
          isActive: true 
        }).sort({ lastPostAt: -1 })

        return {
          id: category._id.toString(),
          name: category.name,
          description: category.description,
          slug: category.slug,
          topic_count: topicCount,
          post_count: postCount[0]?.total || 0,
          last_activity: lastTopic?.lastPostAt || category.createdAt
        }
      })
    )

    return NextResponse.json({ categories: categoriesWithCounts })

  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
