import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/content/trainings - Public endpoint to get all trainings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const { data: trainings, error } = await supabaseAdmin
      .from('trainings')
      .select('id, title, slug, subheader, cover_image_url, level, duration_minutes, author_name, created_at, likes, views')
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) {
      console.error('Supabase error fetching trainings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trainings' },
        { status: 500 }
      )
    }

    // Get total count
    const { count: total, error: countError } = await supabaseAdmin
      .from('trainings')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Supabase count error:', countError)
    }

    const totalCount = total || 0

    // Format trainings for frontend
    const formattedTrainings = (trainings || []).map(training => ({
      id: training.id,
      title: training.title,
      slug: training.slug,
      subheader: training.subheader || '',
      coverImageUrl: training.cover_image_url || '',
      level: training.level || '',
      durationMinutes: training.duration_minutes || null,
      authorName: training.author_name || '',
      created_at: training.created_at,
      likes: training.likes || 0,
      views: training.views || 0,
      commentCount: 0
    }))

    return NextResponse.json({
      trainings: formattedTrainings,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching trainings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trainings' },
      { status: 500 }
    )
  }
}
