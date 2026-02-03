import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    const { flagId } = await params;
    const { status } = await request.json();

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
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('id', userData.userId)
      .single();

    if (userError || !user || !user.is_admin) {
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
    const { data: flaggedPost, error } = await supabaseAdmin
      .from('flagged_posts')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.userId
      })
      .eq('id', flagId)
      .select()
      .single();

    if (error || !flaggedPost) {
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
