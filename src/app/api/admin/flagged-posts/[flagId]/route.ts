import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import FlaggedPost from '@/models/FlaggedPost';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    const { flagId } = await params;
    const { status } = await request.json();

    await connectDB();

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

    // Check if user is admin
    const user = await User.findById(userData.userId);
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Validate status
    if (!['reviewed', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update flagged post
    const flaggedPost = await FlaggedPost.findByIdAndUpdate(
      flagId,
      {
        status,
        reviewedAt: new Date(),
        reviewedBy: userData.userId
      },
      { new: true }
    );

    if (!flaggedPost) {
      return NextResponse.json(
        { error: 'Flagged post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Flagged post updated successfully',
      flaggedPost
    });

  } catch (error) {
    console.error('Flagged post update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

