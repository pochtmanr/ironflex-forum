import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';
import Comment from '@/models/Comment';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    const params = await context.params;
    const slug = params.slug;
    
    // Find article by slug
    const article = await Article.findOne({ slug });
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count
    article.views = (article.views || 0) + 1;
    await article.save();

    // Fetch comments for this article
    const comments = await Comment.find({
      contentType: 'article',
      contentId: article._id.toString()
    }).sort({ created_at: -1 });

    // Fetch user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findById(comment.userId);
        return {
          id: (comment as any)._id.toString(),
          content: comment.content,
          user_name: user?.displayName || user?.username || 'Anonymous',
          user_email: user?.email || '',
          user_id: comment.userId,
          user_photo: user?.photoURL || null,
          created_at: comment.created_at,
          likes: comment.likes || 0,
          is_author: false
        };
      })
    );

    return NextResponse.json({
      article: {
        id: article._id.toString(),
        title: article.title,
        slug: article.slug,
        subheader: article.subheader,
        content: article.content,
        coverImageUrl: article.coverImageUrl,
        tags: article.tags,
        likes: article.likes || 0,
        views: article.views || 0,
        created_at: article.created_at,
        updated_at: article.updated_at
      },
      comments: commentsWithUsers
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

