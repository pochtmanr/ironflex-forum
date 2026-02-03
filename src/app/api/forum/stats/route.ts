import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const [topicsResult, postsResult, usersResult] = await Promise.all([
      supabaseAdmin.from('topics').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ])

    const totalTopics = topicsResult.count || 0
    const totalPosts = postsResult.count || 0
    const totalUsers = usersResult.count || 0

    // Get latest user
    const { data: latestUser } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      stats: {
        total_topics: totalTopics,
        total_posts: totalPosts,
        total_users: totalUsers,
        latest_username: latestUser?.username || null
      }
    })
  } catch (error) {
    console.error('Error fetching forum stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forum stats' },
      { status: 500 }
    )
  }
}
