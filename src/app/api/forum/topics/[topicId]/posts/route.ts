import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const body = await request.json();
    const { content, mediaLinks, userData, replyToPostId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get or create user based on userData (like topics)
    let user;
    if (userData && userData.email) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email, username, display_name, photo_url')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        user = existingUser;
      } else {
        const username = userData.email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            email: userData.email,
            username,
            display_name: userData.displayName || userData.name || userData.email.split('@')[0],
            photo_url: userData.photoURL || userData.picture,
            google_id: userData.id,
            is_verified: true,
            is_admin: false,
            is_active: true
          })
          .select('id, email, username, display_name, photo_url')
          .single();

        if (createError) throw createError;
        user = newUser;
      }
    } else {
      return NextResponse.json(
        { error: 'User data required' },
        { status: 401 }
      );
    }

    // Verify topic exists
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('id, is_locked')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if topic is locked
    if (topic.is_locked) {
      return NextResponse.json(
        { error: 'Topic is locked' },
        { status: 403 }
      );
    }

    // Build reply-to excerpt if quoting another post
    let replyToExcerpt: { author_name: string; excerpt: string } | null = null;
    if (replyToPostId) {
      const { data: sourcePost } = await supabaseAdmin
        .from('posts')
        .select('id, content, user_id')
        .eq('id', replyToPostId)
        .eq('topic_id', topicId)
        .single();

      if (sourcePost) {
        const { data: sourceUser } = await supabaseAdmin
          .from('users')
          .select('username, display_name')
          .eq('id', sourcePost.user_id)
          .single();

        const plainExcerpt = (sourcePost.content || '')
          .replace(/!\[.*?\]\(.*?\)/g, '[Изображение]')
          .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
          .replace(/[*_~`#>]/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim()
          .slice(0, 150);

        replyToExcerpt = {
          author_name: sourceUser?.display_name || sourceUser?.username || 'Unknown',
          excerpt: plainExcerpt
        };
      }
    }

    // Create new post
    const { data: createdPost, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        topic_id: topicId,
        user_id: user.id,
        user_name: user.display_name || user.username,
        user_email: user.email,
        content: content.trim(),
        media_links: mediaLinks || [],
        reply_to_post_id: replyToPostId || null,
        reply_to_excerpt: replyToExcerpt
      })
      .select()
      .single();

    if (postError) throw postError;

    // Update topic's last_post_at and increment reply_count
    const { data: currentTopic } = await supabaseAdmin
      .from('topics')
      .select('reply_count')
      .eq('id', topicId)
      .single();

    await supabaseAdmin
      .from('topics')
      .update({
        last_post_at: new Date().toISOString(),
        reply_count: (currentTopic?.reply_count || 0) + 1
      })
      .eq('id', topicId);

    const formattedPost = {
      id: createdPost.id,
      content: createdPost.content,
      user_name: createdPost.user_name || 'Unknown',
      user_email: createdPost.user_email || '',
      user_id: createdPost.user_id || '',
      created_at: createdPost.created_at,
      likes: createdPost.likes || 0,
      dislikes: createdPost.dislikes || 0,
      media_links: createdPost.media_links || [],
      is_author: true,
      reply_to_post_id: createdPost.reply_to_post_id || null,
      reply_to_excerpt: createdPost.reply_to_excerpt || null
    };

    return NextResponse.json({
      message: 'Post created successfully',
      post: formattedPost
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
