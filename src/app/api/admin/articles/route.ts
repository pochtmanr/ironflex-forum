import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('id, title, slug, subheader, content, cover_image_url, tags, likes, views, comment_count, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      articles: (articles || []).map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        subheader: article.subheader,
        content: article.content,
        coverImageUrl: article.cover_image_url,
        tags: article.tags,
        likes: article.likes,
        views: article.views,
        commentCount: article.comment_count,
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
    const { data: existing } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Article with this slug already exists' },
        { status: 400 }
      )
    }

    const { data: article, error } = await supabaseAdmin
      .from('articles')
      .insert({
        title,
        slug,
        subheader: subheader || '',
        content,
        cover_image_url: coverImageUrl || '',
        tags: tags || ''
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Article created successfully',
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        subheader: article.subheader,
        content: article.content,
        coverImageUrl: article.cover_image_url,
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
