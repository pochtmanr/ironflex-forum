import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Training from '@/models/Training'

// GET /api/content/trainings - Public endpoint to get all trainings
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get published trainings only (or trainings without published field - treat as published)
    const trainings = await Training.find({ $or: [{ published: true }, { published: { $exists: false } }] })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title slug subheader coverImageUrl level durationMinutes authorName createdAt likes views')
      .lean()

    const total = await Training.countDocuments({ $or: [{ published: true }, { published: { $exists: false } }] })

    // Format trainings for frontend
    const formattedTrainings = trainings.map(training => ({
      id: String(training._id),
      title: training.title,
      slug: training.slug,
      subheader: training.subheader || '',
      coverImageUrl: training.coverImageUrl || '',
      level: training.level || '',
      durationMinutes: training.durationMinutes || null,
      authorName: training.authorName || '',
      created_at: training.createdAt,
      likes: training.likes || 0,
      views: training.views || 0,
      commentCount: 0 // TODO: Implement comments
    }))

    return NextResponse.json({
      trainings: formattedTrainings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

