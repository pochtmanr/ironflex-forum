import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - List all trainings (admin only)
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

    const { data: trainings, error } = await supabaseAdmin
      .from('trainings')
      .select('id, title, slug, subheader, content, cover_image_url, level, duration_minutes, author_name, likes, views, comment_count, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      trainings: (trainings || []).map(training => ({
        id: training.id,
        title: training.title,
        slug: training.slug,
        subheader: training.subheader,
        content: training.content,
        coverImageUrl: training.cover_image_url,
        level: training.level,
        durationMinutes: training.duration_minutes,
        authorName: training.author_name,
        likes: training.likes,
        views: training.views,
        commentCount: training.comment_count,
        created_at: training.created_at,
        updated_at: training.updated_at
      }))
    })
  } catch (error) {
    console.error('Error fetching trainings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trainings' },
      { status: 500 }
    )
  }
}

// POST - Create new training (admin only)
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
    const { title, slug, subheader, content, coverImageUrl, level, durationMinutes, authorName } = body

    // Validate required fields
    if (!title || !slug || !content || !authorName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('trainings')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Training with this slug already exists' },
        { status: 400 }
      )
    }

    const { data: training, error } = await supabaseAdmin
      .from('trainings')
      .insert({
        title,
        slug,
        subheader: subheader || '',
        content,
        cover_image_url: coverImageUrl || '',
        level: level || 'beginner',
        duration_minutes: durationMinutes || null,
        author_name: authorName
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Training created successfully',
      training: {
        id: training.id,
        title: training.title,
        slug: training.slug,
        subheader: training.subheader,
        content: training.content,
        coverImageUrl: training.cover_image_url,
        level: training.level,
        durationMinutes: training.duration_minutes,
        authorName: training.author_name,
        created_at: training.created_at
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating training:', error)
    return NextResponse.json(
      { error: 'Failed to create training' },
      { status: 500 }
    )
  }
}
