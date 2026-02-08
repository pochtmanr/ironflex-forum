import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication (no admin check - any user can access)
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

    // Get all topics with category information
    const { data: topics, error } = await supabaseAdmin
      .from('topics')
      .select(`
        id,
        category_id,
        user_id,
        user_name,
        user_email,
        title,
        content,
        media_links,
        views,
        likes,
        dislikes,
        is_pinned,
        is_locked,
        is_active,
        created_at,
        updated_at,
        last_post_at,
        reply_count,
        categories (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: 'Topics retrieved successfully',
      topics: (topics || []).map((topic: any) => ({
        id: topic.id,
        categoryId: topic.category_id,
        userId: topic.user_id,
        userName: topic.user_name,
        userEmail: topic.user_email,
        title: topic.title,
        content: topic.content || null,
        mediaLinks: topic.media_links,
        views: topic.views,
        likes: topic.likes,
        dislikes: topic.dislikes,
        isPinned: topic.is_pinned,
        isLocked: topic.is_locked,
        isActive: topic.is_active,
        createdAt: topic.created_at,
        updatedAt: topic.updated_at,
        lastPostAt: topic.last_post_at,
        replyCount: topic.reply_count,
        categoryName: topic.categories?.name ?? null
      }))
    });

  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
