import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Map camelCase status types to snake_case column names
const statusFieldMap: Record<string, string> = {
  isPinned: 'is_pinned',
  isLocked: 'is_locked',
  isActive: 'is_active'
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const { statusType, value } = await request.json();

    const guard = await requireAdmin(request);
    if (guard instanceof NextResponse) return guard;

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

    // Check if topic exists
    const { data: topic, error: fetchError } = await supabaseAdmin
      .from('topics')
      .select('id')
      .eq('id', topicId)
      .single();

    if (fetchError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Update topic status
    const dbField = statusFieldMap[statusType];
    await supabaseAdmin
      .from('topics')
      .update({ [dbField]: value })
      .eq('id', topicId);

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
