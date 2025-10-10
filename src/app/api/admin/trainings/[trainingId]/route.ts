import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Training from '@/models/Training'
import { verifyToken } from '@/lib/auth'

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

    await connectDB()

    const body = await request.json()
    const { title, slug, subheader, content, coverImageUrl, level, durationMinutes, authorName } = body

    const { trainingId } = await params
    const training = await Training.findById(trainingId)
    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== training.slug) {
      const existing = await Training.findOne({ slug })
      if (existing) {
        return NextResponse.json(
          { error: 'Training with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update fields
    if (title !== undefined) training.title = title
    if (slug !== undefined) training.slug = slug
    if (subheader !== undefined) training.subheader = subheader
    if (content !== undefined) training.content = content
    if (coverImageUrl !== undefined) training.coverImageUrl = coverImageUrl
    if (level !== undefined) training.level = level
    if (durationMinutes !== undefined) training.durationMinutes = durationMinutes
    if (authorName !== undefined) training.authorName = authorName

    await training.save()

    return NextResponse.json({
      message: 'Training updated successfully',
      training: {
        id: training._id.toString(),
        title: training.title,
        slug: training.slug,
        subheader: training.subheader,
        content: training.content,
        coverImageUrl: training.coverImageUrl,
        level: training.level,
        durationMinutes: training.durationMinutes,
        authorName: training.authorName,
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

    await connectDB()

    const { trainingId } = await params
    const training = await Training.findByIdAndDelete(trainingId)
    if (!training) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 })
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

