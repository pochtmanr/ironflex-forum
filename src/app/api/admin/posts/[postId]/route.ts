import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Verify authentication. Admins bypass ownership/time-window checks below.
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

    // Check if post exists
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, topic_id, created_at')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Admins can delete any post; non-admins: ownership + 2-hour window.
    // When the JWT claims admin, re-check against the DB (verifyToken) so a
    // demoted admin's still-valid JWT can't keep destructive powers.
    let isAdmin = false;
    if (userPayload.isAdmin) {
      const dbCheck = await verifyToken(token);
      isAdmin = !!dbCheck?.isAdmin;
    }

    if (!isAdmin) {
      if (post.user_id !== userPayload.id) {
        return NextResponse.json(
          { error: 'You can only delete your own posts' },
          { status: 403 }
        );
      }

      const createdAt = new Date(post.created_at);
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      if (Date.now() - createdAt.getTime() > twoHoursInMs) {
        return NextResponse.json(
          { error: 'Posts can only be deleted within 2 hours of creation' },
          { status: 403 }
        );
      }
    }

    // Delete the post
    await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId);

    // Update topic reply count
    const { data: topic } = await supabaseAdmin
      .from('topics')
      .select('reply_count')
      .eq('id', post.topic_id)
      .single();

    if (topic) {
      await supabaseAdmin
        .from('topics')
        .update({ reply_count: Math.max(0, (topic.reply_count || 0) - 1) })
        .eq('id', post.topic_id);
    }

    return NextResponse.json({
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { content } = await request.json();

    // Verify authentication. Admins bypass ownership/time-window checks below.
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

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, created_at')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Admins can edit any post; non-admins: ownership + 2-hour window.
    // DB-backed admin re-check (see DELETE handler above for rationale).
    let isAdmin = false;
    if (userPayload.isAdmin) {
      const dbCheck = await verifyToken(token);
      isAdmin = !!dbCheck?.isAdmin;
    }

    if (!isAdmin) {
      if (post.user_id !== userPayload.id) {
        return NextResponse.json(
          { error: 'You can only edit your own posts' },
          { status: 403 }
        );
      }

      const createdAt = new Date(post.created_at);
      const twoHoursInMs = 2 * 60 * 60 * 1000;
      if (Date.now() - createdAt.getTime() > twoHoursInMs) {
        return NextResponse.json(
          { error: 'Posts can only be edited within 2 hours of creation' },
          { status: 403 }
        );
      }
    }

    // Update the post
    await supabaseAdmin
      .from('posts')
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', postId);

    return NextResponse.json({
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}
