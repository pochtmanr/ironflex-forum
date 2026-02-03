import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

    const body = await request.json()
    const { title, slug, subheader, content, coverImageUrl, tags } = body

    const { articleId } = await params

    // Check if article exists
    const { data: existingArticle, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('id, slug')
      .eq('id', articleId)
      .single()

    if (fetchError || !existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== existingArticle.slug) {
      const { data: slugConflict } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single()

      if (slugConflict) {
        return NextResponse.json(
          { error: 'Article with this slug already exists' },
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
    if (tags !== undefined) updateData.tags = tags

    const { data: article, error } = await supabaseAdmin
      .from('articles')
      .update(updateData)
      .eq('id', articleId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Article updated successfully',
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        subheader: article.subheader,
        content: article.content,
        coverImageUrl: article.cover_image_url,
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

    const { articleId } = await params

    // Check if article exists before deleting
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('id', articleId)
      .single()

    if (fetchError || !article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', articleId)

    if (error) {
      throw error
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
