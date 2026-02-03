import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/content/articles - Public endpoint to get all articles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('id, title, slug, subheader, cover_image_url, tags, created_at, likes, views')
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Supabase error fetching articles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      )
    }

    // Get total count
    const { count: total, error: countError } = await supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Supabase count error:', countError)
    }

    const totalCount = total || 0

    // Format articles for frontend
    const formattedArticles = (articles || []).map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      subheader: article.subheader || '',
      coverImageUrl: article.cover_image_url || '',
      tags: article.tags || '',
      created_at: article.created_at,
      likes: article.likes || 0,
      views: article.views || 0,
      commentCount: 0
    }))

    return NextResponse.json({
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
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
