import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Get user and category info for each topic
    const formattedTopics = await Promise.all(
      topics.map(async (topic) => {
        const [userResult, categoryResult] = await Promise.all([
          supabaseAdmin.from('users').select('photo_url').eq('id', topic.user_id).single(),
          supabaseAdmin.from('categories').select('name, slug').eq('id', topic.category_id).single()
        ])

        return {
          id: topic.id,
          title: topic.title,
          content: topic.content,
          user_name: topic.user_name,
          user_email: topic.user_email,
          user_id: topic.user_id,
          user_photo_url: userResult.data?.photo_url || null,
          category_id: topic.category_id,
          category_name: categoryResult.data?.name || 'Unknown Category',
          category_slug: categoryResult.data?.slug || topic.category_id,
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
      topics: formattedTopics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Topics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user data from request body (like React app approach)
    const body = await request.json()
    const { categoryId, title, content, mediaLinks, userData } = body

    console.log('Received topic creation request:', { categoryId, title, content, mediaLinks, userData })

    // Validation
    if (!categoryId || !title || !content) {
      return NextResponse.json(
        { error: 'Category ID, title, and content are required' },
        { status: 400 }
      )
    }

    // For now, let's use userData from the request or create a simple user
    let user;
    if (userData && userData.email) {
      // Find or create user based on userData
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email, username, display_name, photo_url')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        user = existingUser
      } else {
        const username = userData.email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5)
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            email: userData.email,
            username,
            display_name: userData.displayName || userData.name || userData.email.split('@')[0],
            photo_url: userData.photoURL || userData.picture,
            google_id: userData.id,
            is_verified: true,
            is_admin: false,
            is_active: true
          })
          .select('id, email, username, display_name, photo_url')
          .single()

        if (createError) throw createError
        user = newUser
        console.log('Created new user:', user.id)
      }
    } else {
      return NextResponse.json(
        { error: 'User data required' },
        { status: 401 }
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

    // Create topic
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .insert({
        category_id: categoryId,
        user_id: user.id,
        user_name: user.display_name || user.username,
        user_email: user.email,
        title,
        content,
        media_links: mediaLinks || []
      })
      .select()
      .single()

    if (topicError) throw topicError

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
        media_links: Array.isArray(topic.media_links) ? topic.media_links.join('\n') : (topic.media_links || '')
      }
    })

  } catch (error) {
    console.error('Topic creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
