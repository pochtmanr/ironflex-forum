import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Article from '@/models/Article'

// GET /api/content/articles - Public endpoint to get all articles
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get published articles only (or articles without published field - treat as published)
    const articles = await Article.find({ $or: [{ published: true }, { published: { $exists: false } }] })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title slug subheader coverImageUrl tags createdAt likes views')
      .lean()

    const total = await Article.countDocuments({ $or: [{ published: true }, { published: { $exists: false } }] })

    // Format articles for frontend
    const formattedArticles = articles.map(article => ({
      id: String(article._id),
      title: article.title,
      slug: article.slug,
      subheader: article.subheader || '',
      coverImageUrl: article.coverImageUrl || '',
      tags: article.tags || '',
      created_at: article.createdAt,
      likes: article.likes || 0,
      views: article.views || 0,
      commentCount: 0 // TODO: Implement comments
    }))

    return NextResponse.json({
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

