import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) throw error

    // Get topic counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const categoryId = category.id

        const { count: topicCount } = await supabaseAdmin
          .from('topics')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', categoryId)
          .eq('is_active', true)

        // Sum reply_count for all active topics in this category
        const { data: topicsWithReplies } = await supabaseAdmin
          .from('topics')
          .select('reply_count')
          .eq('category_id', categoryId)
          .eq('is_active', true)

        const postCount = (topicsWithReplies || []).reduce((sum, t) => sum + (t.reply_count || 0), 0)

        const { data: lastTopic } = await supabaseAdmin
          .from('topics')
          .select('last_post_at')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('last_post_at', { ascending: false })
          .limit(1)
          .single()

        return {
          id: categoryId,
          name: category.name,
          description: category.description,
          slug: category.slug,
          section: category.section || null,
          topic_count: topicCount || 0,
          post_count: postCount,
          last_activity: lastTopic?.last_post_at || category.created_at
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
