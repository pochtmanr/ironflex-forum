import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userData = await verifyToken(token);

    if (!userData || !userData.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const slug = params.slug;
    const { content } = await request.json();

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Find article by slug
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('id, comment_count')
      .eq('slug', slug)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Create comment
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        content_type: 'article',
        content_id: article.id,
        user_id: userData.userId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        likes: 0
      })
      .select()
      .single();

    if (commentError || !comment) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Increment article comment count
    await supabaseAdmin
      .from('articles')
      .update({ comment_count: (article.comment_count || 0) + 1 })
      .eq('id', article.id);

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        user_id: comment.user_id,
        created_at: comment.created_at
      }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
