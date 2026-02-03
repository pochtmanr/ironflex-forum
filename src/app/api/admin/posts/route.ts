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

    // Get all posts with topic and category information
    const { data: posts, error } = await supabaseAdmin
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
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: 'Posts retrieved successfully',
      posts: (posts || []).map((post: any) => ({
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
      }))
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
