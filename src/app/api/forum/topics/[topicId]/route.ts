import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const incrementView = searchParams.get('incrementView') !== 'false';

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

    // Find the topic
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Get current user information for the topic author
    const { data: topicAuthor, error: authorError } = await supabaseAdmin
      .from('users')
      .select('username, display_name, email, photo_url')
      .eq('id', topic.user_id)
      .single();

    if (authorError || !topicAuthor) {
      return NextResponse.json(
        { error: 'Topic author not found' },
        { status: 404 }
      );
    }

    console.log('Raw topic data:', {
      id: topic.id,
      title: topic.title,
      mediaLinks: topic.media_links,
      hasMediaLinks: !!topic.media_links,
      mediaLinksLength: topic.media_links?.length || 0
    });

    // Get posts for this topic
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true })
      .range(skip, skip + limit - 1);

    // Get unique user IDs from posts to fetch current usernames
    const postUserIds = [...new Set((posts || []).map(post => post.user_id))];

    let userMap = new Map<string, { username: string; display_name: string; email: string; photo_url: string | null }>();
    if (postUserIds.length > 0) {
      const { data: postAuthors } = await supabaseAdmin
        .from('users')
        .select('id, username, display_name, email, photo_url')
        .in('id', postUserIds);

      userMap = new Map((postAuthors || []).map(user => [user.id, user]));
    }

    // Get total posts count for pagination
    const { count: totalPosts } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    const totalPages = Math.ceil((totalPosts || 0) / limit);

    // Get category information
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .select('name')
      .eq('id', topic.category_id)
      .single();

    if (catError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Increment view count only on page 1 and when incrementView is true
    if (page === 1 && incrementView) {
      await supabaseAdmin
        .from('topics')
        .update({ views: (topic.views || 0) + 1 })
        .eq('id', topicId);
    }

    // Determine user's vote on this topic
    let userVote: 'like' | 'dislike' | null = null;
    if (currentUserId) {
      const { data: vote } = await supabaseAdmin
        .from('topic_votes')
        .select('vote_type')
        .eq('topic_id', topicId)
        .eq('user_id', currentUserId)
        .single();

      if (vote) {
        userVote = vote.vote_type as 'like' | 'dislike';
      }
    }

    // Format the response with current user data
    const formattedTopic = {
      id: topic.id,
      title: topic.title,
      content: topic.content,
      user_name: topicAuthor?.display_name || topicAuthor?.username || 'Unknown',
      user_email: topicAuthor?.email || '',
      user_id: topic.user_id || '',
      user_photo: topicAuthor?.photo_url || null,
      category_id: topic.category_id,
      category_name: category?.name || 'Unknown Category',
      reply_count: topic.reply_count || 0,
      views: (topic.views || 0) + 1, // Include the increment
      likes: topic.likes || 0,
      dislikes: topic.dislikes || 0,
      user_vote: userVote,
      created_at: topic.created_at,
      last_post_at: topic.last_post_at,
      is_pinned: topic.is_pinned || false,
      is_locked: topic.is_locked || false,
      media_links: topic.media_links || [],
      is_author: currentUserId ? topic.user_id === currentUserId : false
    };

    // Determine user's votes on posts
    let postVotesMap = new Map<string, string>();
    if (currentUserId && posts && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const { data: postVotes } = await supabaseAdmin
        .from('post_votes')
        .select('post_id, vote_type')
        .in('post_id', postIds)
        .eq('user_id', currentUserId);

      if (postVotes) {
        postVotesMap = new Map(postVotes.map(v => [v.post_id, v.vote_type]));
      }
    }

    const formattedPosts = (posts || []).map((post) => {
      console.log('Post data:', {
        id: post.id,
        mediaLinks: post.media_links,
        hasMediaLinks: !!post.media_links,
        mediaLinksLength: post.media_links?.length || 0
      });

      // Get current user data for this post
      const postUser = userMap.get(post.user_id);

      // Determine user's vote on this post
      const postUserVote = currentUserId ? (postVotesMap.get(post.id) as 'like' | 'dislike' | undefined) || null : null;

      return {
        id: post.id,
        content: post.content,
        user_name: postUser?.display_name || postUser?.username || 'Unknown',
        user_email: postUser?.email || '',
        user_id: post.user_id || '',
        user_photo: postUser?.photo_url || null,
        created_at: post.created_at,
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        user_vote: postUserVote,
        media_links: post.media_links || [],
        is_author: currentUserId ? post.user_id === currentUserId : false
      };
    });

    return NextResponse.json({
      topic: formattedTopic,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts || 0,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const body = await request.json();
    const { content, mediaLinks } = body;
    console.log('Received post creation request:', { content, mediaLinks });

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
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

    // Get user information
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, email')
      .eq('id', userPayload.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify topic exists
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('id, is_locked, user_id')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if topic is locked
    if (topic.is_locked) {
      return NextResponse.json(
        { error: 'Topic is locked' },
        { status: 403 }
      );
    }

    // Create new post
    const { data: createdPost, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        topic_id: topicId,
        user_id: userPayload.id,
        user_name: user.username,
        user_email: user.email,
        content: content.trim(),
        media_links: mediaLinks || []
      })
      .select()
      .single();

    if (postError) throw postError;

    // Update topic's last_post_at and increment reply_count
    const { data: currentTopic } = await supabaseAdmin
      .from('topics')
      .select('reply_count')
      .eq('id', topicId)
      .single();

    await supabaseAdmin
      .from('topics')
      .update({
        last_post_at: new Date().toISOString(),
        reply_count: (currentTopic?.reply_count || 0) + 1
      })
      .eq('id', topicId);

    const formattedPost = {
      id: createdPost.id,
      content: createdPost.content,
      user_name: createdPost.user_name || 'Unknown',
      user_email: createdPost.user_email || '',
      user_id: createdPost.user_id || '',
      created_at: createdPost.created_at,
      likes: createdPost.likes || 0,
      dislikes: createdPost.dislikes || 0,
      media_links: createdPost.media_links || [],
      is_author: true
    };

    return NextResponse.json({
      message: 'Post created successfully',
      post: formattedPost
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

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

    // Get user information
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userPayload.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the topic
    const { data: topic, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('id, user_id, category_id')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Check if user is the author of the topic
    if (topic.user_id !== userPayload.id) {
      return NextResponse.json(
        { error: 'You can only delete your own topics' },
        { status: 403 }
      );
    }

    // Delete all posts in this topic
    await supabaseAdmin
      .from('posts')
      .delete()
      .eq('topic_id', topicId);

    // Delete topic votes
    await supabaseAdmin
      .from('topic_votes')
      .delete()
      .eq('topic_id', topicId);

    // Delete the topic
    await supabaseAdmin
      .from('topics')
      .delete()
      .eq('id', topicId);

    return NextResponse.json({
      message: 'Topic deleted successfully'
    });

  } catch (error) {
    console.error('Topic deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
