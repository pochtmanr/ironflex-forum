import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;

    // Find article by slug
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabaseAdmin
      .from('articles')
      .update({ views: (article.views || 0) + 1 })
      .eq('id', article.id);

    // Fetch comments for this article
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('content_type', 'article')
      .eq('content_id', article.id)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    // Fetch user details for each comment
    const commentsWithUsers = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, display_name, username, email, photo_url')
          .eq('id', comment.user_id)
          .single();

        return {
          id: comment.id,
          content: comment.content,
          user_name: user?.display_name || user?.username || 'Anonymous',
          user_email: user?.email || '',
          user_id: comment.user_id,
          user_photo: user?.photo_url || null,
          created_at: comment.created_at,
          likes: comment.likes || 0,
          is_author: false
        };
      })
    );

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        subheader: article.subheader,
        content: article.content,
        coverImageUrl: article.cover_image_url,
        tags: article.tags,
        likes: article.likes || 0,
        views: (article.views || 0) + 1,
        created_at: article.created_at,
        updated_at: article.updated_at
      },
      comments: commentsWithUsers
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
