import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if (guard instanceof NextResponse) return guard;

    // Get all users (excluding password hash and refresh token)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, display_name, photo_url, is_admin, is_active, is_verified, created_at, last_login, google_id, github_id')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: 'Users retrieved successfully',
      users: (users || []).map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        photoURL: user.photo_url,
        isAdmin: user.is_admin,
        isActive: user.is_active,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        googleId: user.google_id,
        githubId: user.github_id
      }))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
