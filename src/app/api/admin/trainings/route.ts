import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Training from '@/models/Training'
import { verifyToken } from '@/lib/auth'
import mongoose from 'mongoose'

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

    await connectDB()

    const trainings = await Training.find()
      .sort({ created_at: -1 })
      .lean()

    return NextResponse.json({
      trainings: trainings.map(training => ({
        id: (training._id as mongoose.Types.ObjectId).toString(),
        title: training.title,
        slug: training.slug,
        subheader: training.subheader,
        content: training.content,
        coverImageUrl: training.coverImageUrl,
        level: training.level,
        durationMinutes: training.durationMinutes,
        authorName: training.authorName,
        likes: training.likes,
        views: training.views,
        commentCount: training.commentCount,
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

    await connectDB()

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
    const existing = await Training.findOne({ slug })
    if (existing) {
      return NextResponse.json(
        { error: 'Training with this slug already exists' },
        { status: 400 }
      )
    }

    const training = new Training({
      title,
      slug,
      subheader: subheader || '',
      content,
      coverImageUrl: coverImageUrl || '',
      level: level || 'beginner',
      durationMinutes: durationMinutes || null,
      authorName
    })

    await training.save()

    return NextResponse.json({
      message: 'Training created successfully',
      training: {
        id: (training._id as mongoose.Types.ObjectId).toString(),
        title: training.title,
        slug: training.slug,
        subheader: training.subheader,
        content: training.content,
        coverImageUrl: training.coverImageUrl,
        level: training.level,
        durationMinutes: training.durationMinutes,
        authorName: training.authorName,
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

