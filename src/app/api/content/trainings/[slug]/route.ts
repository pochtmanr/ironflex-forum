import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Training from '@/models/Training';
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
    
    // Find training by slug
    const training = await Training.findOne({ slug });
    
    if (!training) {
      return NextResponse.json(
        { error: 'Training not found' },
        { status: 404 }
      );
    }

    // Increment view count
    training.views = (training.views || 0) + 1;
    await training.save();

    // Fetch comments for this training
    const comments = await Comment.find({
      contentType: 'training',
      contentId: training._id.toString()
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
      training: {
        id: training._id.toString(),
        title: training.title,
        slug: training.slug,
        subheader: training.subheader,
        content: training.content,
        coverImageUrl: training.coverImageUrl,
        level: training.level,
        durationMinutes: training.durationMinutes,
        authorName: training.authorName,
        likes: training.likes || 0,
        views: training.views || 0,
        created_at: training.created_at,
        updated_at: training.updated_at
      },
      comments: commentsWithUsers
    });

  } catch (error) {
    console.error('Error fetching training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

