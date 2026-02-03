import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get category
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (catError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get topics for this category with pagination
    const [topicsResult, countResult] = await Promise.all([
      supabaseAdmin
        .from('topics')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('last_post_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabaseAdmin
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('is_active', true)
    ])

    const topics = topicsResult.data || []
    const total = countResult.count || 0

    // Get user info for each topic
    const formattedTopics = await Promise.all(
      topics.map(async (topic) => {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('photo_url')
          .eq('id', topic.user_id)
          .single()

        return {
          id: topic.id,
          title: topic.title,
          content: topic.content,
          user_name: topic.user_name,
          user_email: topic.user_email,
          user_id: topic.user_id,
          user_photo_url: user?.photo_url || null,
          category_id: topic.category_id,
          reply_count: topic.reply_count,
          views: topic.views,
          likes: topic.likes,
          dislikes: topic.dislikes,
          created_at: topic.created_at,
          last_post_at: topic.last_post_at,
          is_pinned: topic.is_pinned,
          is_locked: topic.is_locked,
          media_links: Array.isArray(topic.media_links) ? topic.media_links.join('\n') : (topic.media_links || '')
        }
      })
    )

    return NextResponse.json({
      category: {
        id: category.id,
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
