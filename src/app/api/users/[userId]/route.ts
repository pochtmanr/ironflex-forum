import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

// Verify JWT token
interface TokenPayload {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

function verifyTokenLocal(request: NextRequest): TokenPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Check if the requesting user is the profile owner
    const tokenData = verifyTokenLocal(request);
    const isOwner = tokenData?.id === userId;

    // Find user by ID
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, display_name, photo_url, bio, city, country, is_active, is_admin, is_verified, google_id, github_id, last_login, created_at, updated_at, telegram_link, vk_link, viber_link, telegram_visible, vk_visible, viber_visible')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's topic count
    const { count: topicCount } = await supabaseAdmin
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get user's post count
    const { count: postCount } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get user's recent topics
    const { data: recentTopics } = await supabaseAdmin
      .from('topics')
      .select('id, title, created_at, views, reply_count, category_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get user's recent posts
    const { data: recentPosts } = await supabaseAdmin
      .from('posts')
      .select('id, content, created_at, topic_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // Format the response
    // Social links: owner sees everything, public sees only visible links
    const socialLinks = {
      telegramLink: isOwner || user.telegram_visible ? (user.telegram_link || null) : null,
      vkLink: isOwner || user.vk_visible ? (user.vk_link || null) : null,
      viberLink: isOwner || user.viber_visible ? (user.viber_link || null) : null,
      telegramVisible: user.telegram_visible,
      vkVisible: user.vk_visible,
      viberVisible: user.viber_visible,
    };

    const userProfile = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      photoURL: user.photo_url,
      bio: user.bio,
      city: user.city,
      country: user.country,
      isActive: user.is_active,
      isAdmin: user.is_admin,
      isVerified: user.is_verified,
      googleId: user.google_id,
      githubId: user.github_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
      ...socialLinks,
      topicCount: topicCount || 0,
      postCount: postCount || 0,
      recentTopics: (recentTopics || []).map(topic => ({
        id: topic.id,
        title: topic.title,
        createdAt: topic.created_at,
        views: topic.views || 0,
        replyCount: topic.reply_count || 0,
        categoryId: topic.category_id
      })),
      recentPosts: (recentPosts || []).map(post => ({
        id: post.id,
        content: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
        createdAt: post.created_at,
        topicId: post.topic_id
      }))
    };

    return NextResponse.json({
      message: 'User profile retrieved successfully',
      user: userProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Verify authentication
    const tokenData = verifyTokenLocal(request);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is updating their own profile or is an admin
    if (tokenData.id !== userId) {
      const { data: requestingUser } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', tokenData.id)
        .single();

      if (!requestingUser?.is_admin) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update your own profile' },
          { status: 403 }
        );
      }
    }

    // Get the request body
    const body = await request.json();
    const { username, displayName, bio, city, country, photoURL,
            telegramLink, vkLink, viberLink,
            telegramVisible, vkVisible, viberVisible } = body;

    // Validate input
    const updateData: Record<string, string | boolean | null> = {};

    if (username !== undefined && username !== null) {
      const trimmedUsername = username.trim();

      if (trimmedUsername.length < 3) {
        return NextResponse.json(
          { error: 'Username must be at least 3 characters long' },
          { status: 400 }
        );
      }

      if (trimmedUsername.length > 30) {
        return NextResponse.json(
          { error: 'Username must be less than 30 characters' },
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user (case-insensitive)
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .ilike('username', trimmedUsername)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }

      updateData.username = trimmedUsername;
    }

    if (displayName !== undefined) {
      const trimmedDisplayName = displayName ? displayName.trim() : '';
      if (trimmedDisplayName.length > 50) {
        return NextResponse.json(
          { error: 'Display name must be less than 50 characters' },
          { status: 400 }
        );
      }
      updateData.display_name = trimmedDisplayName || null;
    }

    if (bio !== undefined) {
      const trimmedBio = bio ? bio.trim() : '';
      if (trimmedBio.length > 500) {
        return NextResponse.json(
          { error: 'Bio must be less than 500 characters' },
          { status: 400 }
        );
      }
      updateData.bio = trimmedBio || null;
    }

    if (city !== undefined) {
      const trimmedCity = city ? city.trim() : '';
      if (trimmedCity.length > 100) {
        return NextResponse.json(
          { error: 'City name must be less than 100 characters' },
          { status: 400 }
        );
      }
      updateData.city = trimmedCity || null;
    }

    if (country !== undefined) {
      const trimmedCountry = country ? country.trim() : '';
      if (trimmedCountry.length > 100) {
        return NextResponse.json(
          { error: 'Country name must be less than 100 characters' },
          { status: 400 }
        );
      }
      updateData.country = trimmedCountry || null;
    }

    if (photoURL !== undefined) {
      updateData.photo_url = photoURL ? photoURL.trim() : null;
    }

    // Social links validation (max 200 chars each)
    if (telegramLink !== undefined) {
      const trimmed = telegramLink ? telegramLink.trim() : '';
      if (trimmed.length > 200) {
        return NextResponse.json({ error: 'Ссылка Telegram должна быть менее 200 символов' }, { status: 400 });
      }
      updateData.telegram_link = trimmed || null;
    }
    if (vkLink !== undefined) {
      const trimmed = vkLink ? vkLink.trim() : '';
      if (trimmed.length > 200) {
        return NextResponse.json({ error: 'Ссылка VK должна быть менее 200 символов' }, { status: 400 });
      }
      updateData.vk_link = trimmed || null;
    }
    if (viberLink !== undefined) {
      const trimmed = viberLink ? viberLink.trim() : '';
      if (trimmed.length > 200) {
        return NextResponse.json({ error: 'Ссылка Viber должна быть менее 200 символов' }, { status: 400 });
      }
      updateData.viber_link = trimmed || null;
    }

    // Social visibility flags
    if (telegramVisible !== undefined) {
      updateData.telegram_visible = !!telegramVisible;
    }
    if (vkVisible !== undefined) {
      updateData.vk_visible = !!vkVisible;
    }
    if (viberVisible !== undefined) {
      updateData.viber_visible = !!viberVisible;
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, username, display_name, photo_url, bio, city, country, is_active, is_admin, is_verified, google_id, github_id, created_at, updated_at, last_login, telegram_link, vk_link, viber_link, telegram_visible, vk_visible, viber_visible')
      .single();

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Профиль успешно обновлён',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        photoURL: updatedUser.photo_url,
        bio: updatedUser.bio,
        city: updatedUser.city,
        country: updatedUser.country,
        isActive: updatedUser.is_active,
        isAdmin: updatedUser.is_admin,
        isVerified: updatedUser.is_verified,
        googleId: updatedUser.google_id,
        githubId: updatedUser.github_id,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
        lastLogin: updatedUser.last_login,
        telegramLink: updatedUser.telegram_link,
        vkLink: updatedUser.vk_link,
        viberLink: updatedUser.viber_link,
        telegramVisible: updatedUser.telegram_visible,
        vkVisible: updatedUser.vk_visible,
        viberVisible: updatedUser.viber_visible,
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
