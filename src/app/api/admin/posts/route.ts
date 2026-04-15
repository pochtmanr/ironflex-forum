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

    const { data: posts, error, count } = await supabaseAdmin
      .from('posts')
      .select(`
        id,
        topic_id,
        user_id,
        user_name,
        user_email,
        content,
        media_links,
        likes,
        dislikes,
        is_edited,
        edited_at,
        is_active,
        parent_post_id,
        created_at,
        updated_at,
        topics (
          title,
          category_id,
          categories (
            name
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    const items = (posts || []).map((post: any) => ({
      id: post.id,
      topicId: post.topic_id,
      userId: post.user_id,
      userName: post.user_name,
      userEmail: post.user_email,
      content: post.content,
      mediaLinks: post.media_links,
      likes: post.likes,
      dislikes: post.dislikes,
      isEdited: post.is_edited,
      editedAt: post.edited_at,
      isActive: post.is_active,
      parentPostId: post.parent_post_id,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      topicTitle: post.topics?.title ?? null,
      categoryName: post.topics?.categories?.name ?? null
    }));

    return NextResponse.json({
      message: 'Posts retrieved successfully',
      // Paginated shape. `posts` kept for backwards compat with any caller
      // that hasn't migrated to `items` yet.
      items,
      posts: items,
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
