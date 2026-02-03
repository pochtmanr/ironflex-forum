import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { likeType } = body;

    if (!likeType || !['like', 'dislike'].includes(likeType)) {
      return NextResponse.json(
        { error: 'Invalid like type. Must be "like" or "dislike"' },
        { status: 400 }
      );
    }

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

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, likes, dislikes')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabaseAdmin
      .from('post_votes')
      .select('id, vote_type')
      .eq('post_id', postId)
      .eq('user_id', userPayload.id)
      .single();

    let likes = post.likes || 0;
    let dislikes = post.dislikes || 0;
    let userVote: string | null = null;
    let message = '';

    if (existingVote) {
      if (existingVote.vote_type === likeType) {
        // Remove the vote (toggle off)
        await supabaseAdmin
          .from('post_votes')
          .delete()
          .eq('id', existingVote.id);

        if (likeType === 'like') {
          likes = Math.max(0, likes - 1);
        } else {
          dislikes = Math.max(0, dislikes - 1);
        }
        userVote = null;
        message = 'Vote removed';
      } else {
        // Change vote type
        await supabaseAdmin
          .from('post_votes')
          .update({ vote_type: likeType })
          .eq('id', existingVote.id);

        if (likeType === 'like') {
          likes += 1;
          dislikes = Math.max(0, dislikes - 1);
        } else {
          dislikes += 1;
          likes = Math.max(0, likes - 1);
        }
        userVote = likeType;
        message = 'Vote changed';
      }
    } else {
      // New vote
      await supabaseAdmin
        .from('post_votes')
        .insert({
          post_id: postId,
          user_id: userPayload.id,
          vote_type: likeType
        });

      if (likeType === 'like') {
        likes += 1;
      } else {
        dislikes += 1;
      }
      userVote = likeType;
      message = 'Vote added';
    }

    // Update post counts
    await supabaseAdmin
      .from('posts')
      .update({ likes, dislikes })
      .eq('id', postId);

    return NextResponse.json({
      message,
      likeType,
      likes,
      dislikes,
      userVote
    });

  } catch (error) {
    console.error('Error updating post like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
