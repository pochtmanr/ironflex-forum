import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Article from '@/models/Article';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userData = await verifyToken(token);
    
    if (!userData || !userData.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const slug = params.slug;
    const { content } = await request.json();

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Find article by slug
    const article = await Article.findOne({ slug });
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Create comment
    const comment = await Comment.create({
      contentType: 'article',
      contentId: article._id.toString(),
      userId: userData.userId,
      content: content.trim(),
      created_at: new Date(),
      likes: 0
    });

    // Increment article comment count
    article.commentCount = (article.commentCount || 0) + 1;
    await article.save();

    return NextResponse.json({
      success: true,
      comment: {
        id: (comment as any)._id.toString(),
        content: comment.content,
        user_id: comment.userId,
        created_at: comment.created_at
      }
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

