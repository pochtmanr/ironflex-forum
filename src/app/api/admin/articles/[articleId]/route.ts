import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Article from '@/models/Article'
import { verifyToken } from '@/lib/auth'

// PUT - Update article (admin only) 
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
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
    const { title, slug, subheader, content, coverImageUrl, tags } = body

    const { articleId } = await params
    const article = await Article.findById(articleId)
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== article.slug) {
      const existing = await Article.findOne({ slug })
      if (existing) {
        return NextResponse.json(
          { error: 'Article with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update fields
    if (title !== undefined) article.title = title
    if (slug !== undefined) article.slug = slug
    if (subheader !== undefined) article.subheader = subheader
    if (content !== undefined) article.content = content
    if (coverImageUrl !== undefined) article.coverImageUrl = coverImageUrl
    if (tags !== undefined) article.tags = tags

    await article.save()

    return NextResponse.json({
      message: 'Article updated successfully',
      article: {
        id: article._id.toString(),
        title: article.title,
        slug: article.slug,
        subheader: article.subheader,
        content: article.content,
        coverImageUrl: article.coverImageUrl,
        tags: article.tags,
        updated_at: article.updated_at
      }
    })
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

// DELETE - Delete article (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
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

    const { articleId } = await params
    const article = await Article.findByIdAndDelete(articleId)
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Article deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}

