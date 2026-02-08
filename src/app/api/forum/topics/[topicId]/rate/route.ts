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
    const { rating } = body;

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be a number between 1 and 5' },
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
      .select('id, rating_sum, rating_count')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if user already rated this topic
    const { data: existingRating } = await supabaseAdmin
      .from('topic_ratings')
      .select('id, rating')
      .eq('topic_id', topicId)
      .eq('user_id', userPayload.id)
      .single();

    let ratingSum = topic.rating_sum || 0;
    let ratingCount = topic.rating_count || 0;
    let userRating = rating;
    let message = '';

    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating;

      await supabaseAdmin
        .from('topic_ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', existingRating.id);

      // Update sum: remove old rating, add new rating
      ratingSum = ratingSum - oldRating + rating;
      message = 'Rating updated';
    } else {
      // Create new rating
      await supabaseAdmin
        .from('topic_ratings')
        .insert({
          topic_id: topicId,
          user_id: userPayload.id,
          rating
        });

      ratingSum += rating;
      ratingCount += 1;
      message = 'Rating added';
    }

    // Update topic rating totals
    await supabaseAdmin
      .from('topics')
      .update({ rating_sum: ratingSum, rating_count: ratingCount })
      .eq('id', topicId);

    // Calculate average
    const averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

    return NextResponse.json({
      message,
      rating: userRating,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount,
      userRating
    });

  } catch (error) {
    console.error('Error updating topic rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current rating
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    // Get current user if authenticated
    let currentUserId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const userPayload = verifyAccessToken(token);
      if (userPayload) {
        currentUserId = userPayload.id;
      }
    }

    // Get topic rating data
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('rating_sum, rating_count')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const ratingSum = topic.rating_sum || 0;
    const ratingCount = topic.rating_count || 0;
    const averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

    // Get user's rating if authenticated
    let userRating: number | null = null;
    if (currentUserId) {
      const { data: rating } = await supabaseAdmin
        .from('topic_ratings')
        .select('rating')
        .eq('topic_id', topicId)
        .eq('user_id', currentUserId)
        .single();

      if (rating) {
        userRating = rating.rating;
      }
    }

    return NextResponse.json({
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCount,
      userRating
    });

  } catch (error) {
    console.error('Error fetching topic rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
