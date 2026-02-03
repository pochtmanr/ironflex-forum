import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
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

    // Check if topic exists
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('id, likes, dislikes')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabaseAdmin
      .from('topic_votes')
      .select('id, vote_type')
      .eq('topic_id', topicId)
      .eq('user_id', userPayload.id)
      .single();

    let likes = topic.likes || 0;
    let dislikes = topic.dislikes || 0;
    let userVote: string | null = null;
    let message = '';

    if (existingVote) {
      if (existingVote.vote_type === likeType) {
        // Remove the vote (toggle off)
        await supabaseAdmin
          .from('topic_votes')
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
          .from('topic_votes')
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
        .from('topic_votes')
        .insert({
          topic_id: topicId,
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

    // Update topic counts
    await supabaseAdmin
      .from('topics')
      .update({ likes, dislikes })
      .eq('id', topicId);

    return NextResponse.json({
      message,
      likeType,
      likes,
      dislikes,
      userVote
    });

  } catch (error) {
    console.error('Error updating topic like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
