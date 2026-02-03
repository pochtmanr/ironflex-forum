import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    const period = searchParams.get('period') || 'all'

    // Build query
    let query = supabaseAdmin
      .from('topics')
      .select('id, title, views, likes, reply_count, user_name, user_id, category_id')
      .eq('is_active', true)

    // Calculate date filter based on period
    if (period === 'day') {
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      query = query.gte('created_at', oneDayAgo.toISOString())
    } else if (period === 'week') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      query = query.gte('created_at', oneWeekAgo.toISOString())
    }

    const { data: topics, error } = await query
      .order('views', { ascending: false })
      .order('likes', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Get user and category info for each topic
    const formattedTopics = await Promise.all(
      (topics || []).map(async (topic) => {
        const [userResult, categoryResult] = await Promise.all([
          supabaseAdmin.from('users').select('photo_url').eq('id', topic.user_id).single(),
          supabaseAdmin.from('categories').select('name, slug').eq('id', topic.category_id).single()
        ])

        return {
          id: topic.id,
          title: topic.title,
          views: topic.views || 0,
          reply_count: topic.reply_count || 0,
          user_name: topic.user_name,
          user_id: topic.user_id,
          category_name: categoryResult.data?.name || 'Forum',
          category_id: topic.category_id || '',
          user_photo_url: userResult.data?.photo_url || null
        }
      })
    )

    return NextResponse.json({
      topics: formattedTopics
    })
  } catch (error) {
    console.error('Ошибка при загрузке популярных тем:', error)
    return NextResponse.json(
      { error: 'Не удалось загрузить популярные темы' },
      { status: 500 }
    )
  }
}
