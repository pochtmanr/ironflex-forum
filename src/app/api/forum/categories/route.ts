import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Topic from '@/models/Topic'

export async function GET() {
  try {
    await connectDB()
    
    const categories = await Category.find({ isActive: true })
      .sort({ orderIndex: 1 })
      .lean() as unknown as Array<{ _id: unknown; name: string; description?: string; slug: string; createdAt: Date }>

    // Get topic counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const categoryId = String(category._id)
        const topicCount = await Topic.countDocuments({ 
          categoryId: categoryId,
          isActive: true 
        })
        
        const postCount = await Topic.aggregate([
          { $match: { categoryId: categoryId, isActive: true } },
          { $group: { _id: null, total: { $sum: '$replyCount' } } }
        ])

        const lastTopic = await Topic.findOne({ 
          categoryId: categoryId,
          isActive: true 
        }).sort({ lastPostAt: -1 })

        return {
          id: categoryId,
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
