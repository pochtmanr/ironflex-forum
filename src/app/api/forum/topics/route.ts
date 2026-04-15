import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAccessToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query for topics
    let topicsQuery = supabaseAdmin
      .from('topics')
      .select('*')
      .eq('is_active', true)

    let countQuery = supabaseAdmin
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (categoryId) {
      topicsQuery = topicsQuery.eq('category_id', categoryId)
      countQuery = countQuery.eq('category_id', categoryId)
    }

    const [topicsResult, countResult] = await Promise.all([
      topicsQuery
        .order('is_pinned', { ascending: false })
        .order('last_post_at', { ascending: false })
        .range(offset, offset + limit - 1),
      countQuery
    ])

    const topics = topicsResult.data || []
    const total = countResult.count || 0

    // Batch-fetch users and categories to avoid N+1 queries
    const userIds = Array.from(new Set(topics.map(t => t.user_id).filter(Boolean)))
    const categoryIds = Array.from(new Set(topics.map(t => t.category_id).filter(Boolean)))

    const [usersResult, categoriesResult] = await Promise.all([
      userIds.length > 0
        ? supabaseAdmin.from('users').select('id, photo_url').in('id', userIds)
        : Promise.resolve({ data: [] as Array<{ id: string; photo_url: string | null }> }),
      categoryIds.length > 0
        ? supabaseAdmin.from('categories').select('id, name, slug').in('id', categoryIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string; slug: string }> }),
    ])

    const userMap = new Map((usersResult.data || []).map(u => [u.id, u]))
    const categoryMap = new Map((categoriesResult.data || []).map(c => [c.id, c]))

    const formattedTopics = topics.map(topic => {
      const u = userMap.get(topic.user_id)
      const c = categoryMap.get(topic.category_id)
      return {
        id: topic.id,
        title: topic.title,
        content: topic.content || null,
        user_name: topic.user_name,
        user_email: topic.user_email,
        user_id: topic.user_id,
        user_photo_url: u?.photo_url || null,
        category_id: topic.category_id,
        category_name: c?.name || 'Unknown Category',
        category_slug: c?.slug || topic.category_id,
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

    return NextResponse.json({
      topics: formattedTopics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require Bearer token auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const payload = verifyAccessToken(authHeader.substring(7))
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    const { data: user, error: userLookupError } = await supabaseAdmin
      .from('users')
      .select('id, email, username, display_name, photo_url')
      .eq('id', payload.id)
      .single()
    if (userLookupError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const { categoryId, title, content, mediaLinks } = body

    // Validation — content is now optional (topic can exist as description-only)
    if (!categoryId || !title) {
      return NextResponse.json(
        { error: 'Category ID and title are required' },
        { status: 400 }
      )
    }

    // Verify category exists
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .eq('id', categoryId)
      .single()

    if (catError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Strip rich-text "empty" content: &nbsp;, whitespace, empty HTML tags
    const isContentEmpty = !content || content
      .replace(/&nbsp;/g, '')
      .replace(/<[^>]*>/g, '')
      .trim().length === 0
    const cleanContent = isContentEmpty ? null : content.trim()

    // Create topic — content is always null; first comment goes to posts table
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .insert({
        category_id: categoryId,
        user_id: user.id,
        user_name: user.display_name || user.username,
        user_email: user.email,
        title,
        content: null,
        media_links: []
      })
      .select()
      .single()

    if (topicError) throw topicError

    // If meaningful content was provided, create as first post (separate from topic)
    let firstPost = null
    if (cleanContent) {
      const { data: post, error: postError } = await supabaseAdmin
        .from('posts')
        .insert({
          topic_id: topic.id,
          user_id: user.id,
          user_name: user.display_name || user.username,
          user_email: user.email,
          content: cleanContent,
          media_links: mediaLinks || [],
          is_first_post: true
        })
        .select()
        .single()

      if (postError) {
      } else {
        firstPost = post
      }
    }

    return NextResponse.json({
      message: 'Topic created successfully',
      topic: {
        id: topic.id,
        title: topic.title,
        content: topic.content,
        user_name: topic.user_name,
        user_email: topic.user_email,
        user_id: topic.user_id,
        user_photo_url: user.photo_url,
        category_id: topic.category_id,
        category_name: category.name,
        category_slug: category.slug,
        reply_count: topic.reply_count,
        views: topic.views,
        likes: topic.likes,
        dislikes: topic.dislikes,
        created_at: topic.created_at,
        last_post_at: topic.last_post_at,
        is_pinned: topic.is_pinned,
        is_locked: topic.is_locked,
        media_links: Array.isArray(topic.media_links) ? topic.media_links.join('\n') : (topic.media_links || ''),
        has_first_post: !!firstPost
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
