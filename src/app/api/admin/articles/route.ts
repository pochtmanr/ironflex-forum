import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Article from '@/models/Article'
import { verifyToken } from '@/lib/auth'
import mongoose from 'mongoose'

// GET - List all articles (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()

    const articles = await Article.find()
      .sort({ created_at: -1 })
      .lean()

    return NextResponse.json({
      articles: articles.map(article => ({
        id: (article._id as mongoose.Types.ObjectId).toString(),
        title: article.title,
        slug: article.slug,
        subheader: article.subheader,
        content: article.content,
        coverImageUrl: article.coverImageUrl,
        tags: article.tags,
        likes: article.likes,
        views: article.views,
        commentCount: article.commentCount,
        created_at: article.created_at,
        updated_at: article.updated_at
      }))
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

// POST - Create new article (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { title, slug, subheader, content, coverImageUrl, tags } = body

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await Article.findOne({ slug })
    if (existing) {
      return NextResponse.json(
        { error: 'Article with this slug already exists' },
        { status: 400 }
      )
    }

    const article = new Article({
      title,
      slug,
      subheader: subheader || '',
      content,
      coverImageUrl: coverImageUrl || '',
      tags: tags || ''
    })

    await article.save()

    return NextResponse.json({
      message: 'Article created successfully',
      article: {
        id: article._id.toString(),
        title: article.title,
        slug: article.slug,
        subheader: article.subheader,
        content: article.content,
        coverImageUrl: article.coverImageUrl,
        tags: article.tags,
        created_at: article.created_at
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}

