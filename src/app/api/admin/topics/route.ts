import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Pagination defaults — mirrored from admin/contact-requests/route.ts.
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if (guard instanceof NextResponse) return guard;

    const { searchParams } = new URL(request.url);
    const page = Math.max(DEFAULT_PAGE, parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
    const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: topics, error, count } = await supabaseAdmin
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
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const items = (topics || []).map((topic: any) => ({
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
    }));

    return NextResponse.json({
      message: 'Topics retrieved successfully',
      // Paginated shape. `topics` kept for backwards compat with any caller
      // that hasn't migrated to `items` yet.
      items,
      topics: items,
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
