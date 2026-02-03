import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    const userPayload = verifyAccessToken(token);
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Find the post
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, topic_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the topic to check if user is topic author
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('id, user_id, reply_count')
      .eq('id', post.topic_id)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user is the post author OR the topic author
    const isPostAuthor = post.user_id === userPayload.id;
    const isTopicAuthor = topic.user_id === userPayload.id;

    console.log('Delete post authorization check:', {
      postId,
      postUserId: post.user_id,
      topicUserId: topic.user_id,
      requestUserId: userPayload.id,
      isPostAuthor,
      isTopicAuthor
    });

    if (!isPostAuthor && !isTopicAuthor) {
      return NextResponse.json(
        { error: 'You can only delete your own posts or posts in your topics' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete post votes first
    await supabaseAdmin
      .from('post_votes')
      .delete()
      .eq('post_id', postId);

    // Delete the post
    await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);

    // Update topic reply count
    await supabaseAdmin
      .from('topics')
      .update({ reply_count: Math.max(0, (topic.reply_count || 0) - 1) })
      .eq('id', post.topic_id);

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
