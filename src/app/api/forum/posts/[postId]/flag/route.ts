import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { reason, topicId, topicTitle } = await request.json();

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userPayload = verifyAccessToken(token);
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Get current user information
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('username, display_name')
      .eq('id', userPayload.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, content, topic_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get post author information
    const { data: postAuthor, error: authorError } = await supabaseAdmin
      .from('users')
      .select('username, display_name')
      .eq('id', post.user_id)
      .single();

    if (authorError || !postAuthor) {
      return NextResponse.json(
        { error: 'Post author not found' },
        { status: 404 }
      );
    }

    // Verify that the user is the topic author
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('user_id')
      .eq('id', topicId || post.topic_id)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    if (topic.user_id !== userPayload.id) {
      return NextResponse.json(
        { error: 'Only topic authors can flag posts' },
        { status: 403 }
      );
    }

    // Check if this post has already been flagged by this user
    const { data: existingFlag } = await supabaseAdmin
      .from('flagged_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('flagged_by', userPayload.id)
      .eq('status', 'pending')
      .single();

    if (existingFlag) {
      return NextResponse.json(
        { error: 'You have already flagged this post' },
        { status: 400 }
      );
    }

    // Create flagged post record
    const { error: flagError } = await supabaseAdmin
      .from('flagged_posts')
      .insert({
        post_id: postId,
        topic_id: topicId || post.topic_id,
        topic_title: topicTitle || 'Unknown',
        post_content: post.content,
        post_author_id: post.user_id,
        post_author_name: postAuthor.display_name || postAuthor.username,
        flagged_by: userPayload.id,
        flagged_by_name: currentUser.display_name || currentUser.username,
        reason: reason.trim(),
        status: 'pending'
      });

    if (flagError) throw flagError;

    return NextResponse.json({
      message: 'Post flagged successfully'
    });

  } catch (error) {
    console.error('Error flagging post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
