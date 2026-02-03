import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// PUT - Update training (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) {
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

    const { trainingId } = await params

    // Check if training exists
    const { data: existingTraining, error: fetchError } = await supabaseAdmin
      .from('trainings')
      .select('id, slug')
      .eq('id', trainingId)
      .single()

    if (fetchError || !existingTraining) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== existingTraining.slug) {
      const { data: slugConflict } = await supabaseAdmin
        .from('trainings')
        .select('id')
        .eq('slug', slug)
        .single()

      if (slugConflict) {
        return NextResponse.json(
          { error: 'Training with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (subheader !== undefined) updateData.subheader = subheader
    if (content !== undefined) updateData.content = content
    if (coverImageUrl !== undefined) updateData.cover_image_url = coverImageUrl
    if (level !== undefined) updateData.level = level
    if (durationMinutes !== undefined) updateData.duration_minutes = durationMinutes
    if (authorName !== undefined) updateData.author_name = authorName

    const { data: training, error } = await supabaseAdmin
      .from('trainings')
      .update(updateData)
      .eq('id', trainingId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Training updated successfully',
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
        updated_at: training.updated_at
      }
    })
  } catch (error) {
    console.error('Error updating training:', error)
    return NextResponse.json(
      { error: 'Failed to update training' },
      { status: 500 }
    )
  }
}

// DELETE - Delete training (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) {
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

    const { trainingId } = await params

    // Check if training exists before deleting
    const { data: training, error: fetchError } = await supabaseAdmin
      .from('trainings')
      .select('id')
      .eq('id', trainingId)
      .single()

    if (fetchError || !training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('trainings')
      .delete()
      .eq('id', trainingId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Training deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting training:', error)
    return NextResponse.json(
      { error: 'Failed to delete training' },
      { status: 500 }
    )
  }
}
