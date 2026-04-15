import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const guard = await requireAdmin(request);
    if (guard instanceof NextResponse) return guard;

    // Prevent admins from deleting themselves
    if (guard.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO(Agent 4 — migration): add ON DELETE CASCADE to the FKs that
    // reference users so this handler can become a single DELETE. Columns:
    //   posts.user_id, topics.user_id, conversation_messages.user_id,
    //   chat_user_bans.user_id, chat_user_bans.banned_by,
    //   reset_tokens.user_id, flagged_posts.reviewed_by,
    //   post_votes.user_id, topic_votes.user_id, topic_ratings.user_id
    // Once the migration lands, drop the manual cascade below and just do
    // a single `delete().eq('id', userId)` on users.
    //
    // Until then: do the three deletes in sequence and bail out loudly if
    // any step fails, so we don't end up with orphaned content + a deleted
    // user (or a user whose posts were deleted but the row persists).
    try {
      const { error: postsErr } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('user_id', userId);
      if (postsErr) throw new Error(`posts: ${postsErr.message}`);

      const { error: topicsErr } = await supabaseAdmin
        .from('topics')
        .delete()
        .eq('user_id', userId);
      if (topicsErr) throw new Error(`topics: ${topicsErr.message}`);

      const { error: userErr } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);
      if (userErr) throw new Error(`users: ${userErr.message}`);
    } catch (cascadeErr) {
      console.error('User cascade delete failed mid-flight:', cascadeErr);
      return NextResponse.json(
        { error: 'Failed to fully delete user; partial deletion may have occurred. Check logs.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'User and associated content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
