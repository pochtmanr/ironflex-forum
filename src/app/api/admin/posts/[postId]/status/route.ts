import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { isActive } = await request.json();

    const guard = await requireAdmin(request);
    if (guard instanceof NextResponse) return guard;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Check if post exists
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Update post status
    await supabaseAdmin
      .from('posts')
      .update({ is_active: isActive })
      .eq('id', postId);

    return NextResponse.json({
      message: `Post ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error updating post status:', error);
    return NextResponse.json(
      { error: 'Failed to update post status' },
      { status: 500 }
    );
  }
}
