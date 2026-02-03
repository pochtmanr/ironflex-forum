import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const slug = params.slug;

    // Find training by slug
    const { data: training, error: trainingError } = await supabaseAdmin
      .from('trainings')
      .select('*')
      .eq('slug', slug)
      .single();

    if (trainingError || !training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabaseAdmin
      .from('trainings')
      .update({ views: (training.views || 0) + 1 })
      .eq('id', training.id);

    // Fetch comments for this training
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('content_type', 'training')
      .eq('content_id', training.id)
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
        likes: training.likes || 0,
        views: (training.views || 0) + 1,
        created_at: training.created_at,
        updated_at: training.updated_at
      },
      comments: commentsWithUsers
    });

  } catch (error) {
    console.error('Error fetching training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
