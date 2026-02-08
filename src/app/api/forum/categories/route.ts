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

        const { data: lastTopicData } = await supabaseAdmin
          .from('topics')
          .select('id, title, last_post_at, user_name')
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .order('last_post_at', { ascending: false })
          .limit(1)

        const lastTopic = lastTopicData?.[0] || null

        // Get the last post for the last topic
        let lastPost = null
        if (lastTopic) {
          const { data: lastPostData } = await supabaseAdmin
            .from('posts')
            .select('id, content, user_name, created_at')
            .eq('topic_id', lastTopic.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)

          lastPost = lastPostData?.[0] || null
        }

        return {
          id: categoryId,
          name: category.name,
          description: category.description,
          slug: category.slug,
          section: category.section || null,
          topic_count: topicCount || 0,
          post_count: postCount,
          last_activity: lastTopic?.last_post_at || category.created_at,
          last_topic: lastTopic ? {
            id: lastTopic.id,
            title: lastTopic.title,
            author: lastTopic.user_name,
            date: lastPost ? lastPost.created_at : lastTopic.last_post_at,
            content: lastPost ? lastPost.content : null
          } : null
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
