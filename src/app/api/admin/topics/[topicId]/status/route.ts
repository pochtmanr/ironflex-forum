import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAccessToken } from '@/lib/auth';
import Topic from '@/models/Topic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const { statusType, value } = await request.json();
    
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

    // Validate statusType
    const allowedStatuses = ['isPinned', 'isLocked', 'isActive'];
    if (!allowedStatuses.includes(statusType)) {
      return NextResponse.json(
        { error: 'Invalid status type' },
        { status: 400 }
      );
    }

    if (typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Value must be a boolean' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Update topic status
    const updateData = { [statusType]: value };
    await Topic.findByIdAndUpdate(topicId, updateData);

    return NextResponse.json({
      message: `Topic ${statusType} updated successfully`
    });

  } catch (error) {
    console.error('Error updating topic status:', error);
    return NextResponse.json(
      { error: 'Failed to update topic status' },
      { status: 500 }
    );
  }
}
